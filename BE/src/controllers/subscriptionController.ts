import { Request, Response } from "express";
import mongoose from "mongoose";
import Plan from "../models/planModel.js";
import Subscription, { BillingCycle } from "../models/subscriptionModel.js";
import SubscriptionCheckout from "../models/subscriptionCheckoutModel.js";
import { BANK_ID, ACCOUNT_NO, ACCOUNT_NAME, generateTransferCode } from "../utils/vietqr.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Computes the subscription end date from the start date.
 * - monthly: exactly 1 calendar month later
 * - yearly:  exactly 1 calendar year later
 */
function computeEndDate(startDate: Date, billingCycle: BillingCycle): Date {
	const end = new Date(startDate);
	if (billingCycle === "monthly") {
		end.setMonth(end.getMonth() + 1);
	} else {
		end.setFullYear(end.getFullYear() + 1);
	}
	return end;
}

// ─── createCheckoutSession ────────────────────────────────────────────────────

/**
 * POST /api/subscriptions/checkout
 *
 * Triggered when an authenticated owner chooses a plan to buy or upgrade.
 *
 * Request Body:
 *   { planId: string, billingCycle: 'monthly' | 'yearly' }
 */
export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
	try {
		const ownerId = req.user?._id;
		if (!ownerId) {
			res.status(401).json({
				success: false,
				message: "Unauthorized. Owner context is missing.",
				error: "unauthorized",
			});
			return;
		}

		const { planId, billingCycle } = req.body as {
			planId?: string;
			billingCycle?: "monthly" | "yearly";
		};

		// Validation of inputs
		if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
			res.status(400).json({
				success: false,
				message: "A valid planId is required.",
				error: "invalid_plan_id",
			});
			return;
		}

		if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
			res.status(400).json({
				success: false,
				message: "billingCycle must be either 'monthly' or 'yearly'.",
				error: "invalid_billing_cycle",
			});
			return;
		}

		// a) Fetch the selected Plan from the database. Return 404 if not found or inactive.
		// Return 400 if plan.isCustom is true (Enterprise plans are handled offline).
		const plan = await Plan.findById(planId);
		if (!plan) {
			res.status(404).json({
				success: false,
				message: "Plan not found.",
				error: "plan_not_found",
			});
			return;
		}

		if (!plan.isActive) {
			res.status(400).json({
				success: false,
				message: "This plan is inactive and cannot be purchased.",
				error: "plan_inactive",
			});
			return;
		}

		if (plan.isCustom) {
			res.status(400).json({
				success: false,
				message: "Custom or Enterprise plans must be handled offline with support.",
				error: "plan_is_custom",
			});
			return;
		}

		// b) Calculate the Base Price for the new plan based on the chosen billingCycle.
		// For 'yearly', apply the formula: Math.round(plan.pricing.monthly * 0.83) * 12.
		// For 'monthly', use plan.pricing.monthly.
		let basePrice = 0;
		if (billingCycle === "yearly") {
			basePrice = Math.round(plan.pricing.monthly * 0.83) * 12;
		} else {
			basePrice = plan.pricing.monthly;
		}

		// c) Support Seamless UPGRADES (Pro-Rata Calculation): Check if the owner has an existing subscription with status: "active".
		// If they are upgrading to a higher-priced plan:
		// - Calculate the unused value of the current subscription: Remaining Days = (currentSub.endDate - Current Date) / Total Subscription Days.
		// - Unused Credit = currentSub.amountPaid * (Remaining Days).
		// - Net Amount to Pay = Base Price of New Plan - Unused Credit. Ensure Net Amount is at least 0.
		let netAmount = basePrice;
		let unusedCredit = 0;
		let isUpgrade = false;

		const currentSub = await Subscription.findOne({
			ownerId,
			status: "active",
		});

		if (currentSub) {
			// Compare base price of new plan with the amount paid for the current subscription
			// to determine if it is an upgrade to a higher-priced plan.
			if (basePrice > currentSub.amountPaid) {
				isUpgrade = true;
				const now = new Date();
				const totalSubDaysMs = currentSub.endDate.getTime() - currentSub.startDate.getTime();
				const remainingDaysMs = currentSub.endDate.getTime() - now.getTime();

				if (totalSubDaysMs > 0 && remainingDaysMs > 0) {
					const remainingDaysRatio = remainingDaysMs / totalSubDaysMs;
					unusedCredit = Math.round(currentSub.amountPaid * remainingDaysRatio);
					netAmount = basePrice - unusedCredit;
					if (netAmount < 0) {
						netAmount = 0;
					}
				}
			}
		}

		// d) Store a temporary tracking object/document or payment log in your DB containing the generated paymentCode
		// (format: PAY + YYYYMMDD + 5 random alphanumeric characters) to uniquely map to this pending payment.
		let paymentCode = "";
		let isUnique = false;
		let attempts = 0;

		while (!isUnique && attempts < 10) {
			const code = generateTransferCode("payment");
			const existingCheckout = await SubscriptionCheckout.findOne({ paymentCode: code });
			if (!existingCheckout) {
				paymentCode = code;
				isUnique = true;
			}
			attempts++;
		}

		if (!paymentCode) {
			res.status(500).json({
				success: false,
				message: "Failed to generate a unique payment code. Please try again.",
				error: "payment_code_generation_failed",
			});
			return;
		}

		// Expire checkout session in 1 hour
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

		await SubscriptionCheckout.create({
			paymentCode,
			ownerId,
			planId: plan._id,
			billingCycle,
			amountToPay: netAmount,
			status: "pending",
			expiresAt,
		});

		// e) Generate and return a VietQR image link using this format:
		// https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-qr_only.png?amount=${netAmount}&addInfo=${paymentCode}&accountName=${ACCOUNT_NAME}
		// along with the calculated amount.
		const encodedAccountName = encodeURIComponent(ACCOUNT_NAME);
		const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-qr_only.png?amount=${netAmount}&addInfo=${paymentCode}&accountName=${encodedAccountName}`;

		res.status(200).json({
			success: true,
			message: "Checkout session created successfully.",
			checkout: {
				paymentCode,
				qrUrl,
				amount: netAmount,
				basePrice,
				unusedCredit,
				isUpgrade,
				billingCycle,
				plan: {
					id: String(plan._id),
					name: plan.name,
					displayName: plan.displayName,
				},
				expiresAt: expiresAt.toISOString(),
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		console.error("[subscriptionController] createCheckoutSession error:", errorMessage);
		res.status(500).json({
			success: false,
			message: "Failed to create checkout session.",
			error: errorMessage,
		});
	}
}

// ─── handlePaymentSuccess (Legacy / Manual Activation Flow) ──────────────────

/**
 * POST /api/subscriptions/payment-success
 *
 * Triggered manually or after confirmation of manual payment.
 */
export async function handlePaymentSuccess(req: Request, res: Response): Promise<void> {
	const session = await mongoose.startSession();

	try {
		const { ownerId, planId, billingCycle } = req.body as {
			ownerId?: string;
			planId?: string;
			billingCycle?: BillingCycle;
		};

		if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
			res.status(400).json({
				success: false,
				message: "A valid ownerId is required.",
				error: "invalid_owner_id",
			});
			return;
		}

		if (!planId || !mongoose.isValidObjectId(planId)) {
			res.status(400).json({
				success: false,
				message: "A valid planId is required.",
				error: "invalid_plan_id",
			});
			return;
		}

		if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
			res.status(400).json({
				success: false,
				message: 'billingCycle must be either "monthly" or "yearly".',
				error: "invalid_billing_cycle",
			});
			return;
		}

		const plan = await Plan.findById(planId);

		if (!plan) {
			res.status(404).json({
				success: false,
				message: "Plan not found. Please contact support.",
				error: "plan_not_found",
			});
			return;
		}

		if (!plan.isActive) {
			res.status(400).json({
				success: false,
				message: "This plan is no longer available for purchase.",
				error: "plan_inactive",
			});
			return;
		}

		const startDate = new Date();
		const endDate = computeEndDate(startDate, billingCycle);
		const amountPaid =
			billingCycle === "monthly" ? plan.pricing.monthly : plan.pricing.yearly || (plan.pricing.monthly * 12);

		let subscription: InstanceType<typeof Subscription>;

		await session.withTransaction(async () => {
			await Subscription.updateMany(
				{
					ownerId: new mongoose.Types.ObjectId(ownerId),
					status: "active",
				},
				{
					$set: {
						status: "cancelled",
						cancelledAt: startDate,
					},
				},
				{ session }
			);

			const [created] = await Subscription.create(
				[
					{
						ownerId: new mongoose.Types.ObjectId(ownerId),
						planId: plan._id,
						status: "active",
						billingCycle,
						startDate,
						endDate,
						currentFeatures: plan.features.toObject ? plan.features.toObject() : { ...plan.features },
						amountPaid,
					},
				],
				{ session }
			);

			subscription = created;
		});

		res.status(201).json({
			success: true,
			message: "Subscription activated successfully.",
			subscription: {
				id: String(subscription!._id),
				ownerId,
				plan: {
					id: String(plan._id),
					name: plan.name,
					displayName: plan.displayName,
				},
				billingCycle,
				status: "active",
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				amountPaid,
				currentFeatures: subscription!.currentFeatures,
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		console.error("[subscriptionController] handlePaymentSuccess error:", errorMessage);
		res.status(500).json({
			success: false,
			message: "Failed to activate subscription. Please contact support.",
			error: errorMessage,
		});
	} finally {
		await session.endSession();
	}
}

// ─── getMySubscription ────────────────────────────────────────────────────────

/**
 * GET /api/subscriptions/me
 *
 * Returns the currently authenticated owner's active subscription.
 */
export async function getMySubscription(req: Request, res: Response): Promise<void> {
	try {
		const owner = req.user!;

		const subscription = await Subscription.findOne({
			ownerId: owner._id,
			status: "active",
		})
			.sort({ endDate: -1 })
			.populate("planId", "name displayName description sortOrder");

		if (!subscription) {
			res.status(404).json({
				success: false,
				message: "No active subscription found.",
				error: "subscription_not_found",
			});
			return;
		}

		// Auto-expire if endDate has passed (lazy expiry).
		if (new Date() > subscription.endDate) {
			subscription.status = "expired";
			await subscription.save();

			res.status(403).json({
				success: false,
				message: "Your subscription has expired. Please renew your plan.",
				error: "subscription_expired",
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Subscription loaded successfully.",
			subscription: {
				id: String(subscription._id),
				plan: subscription.planId,
				billingCycle: subscription.billingCycle,
				status: subscription.status,
				startDate: subscription.startDate.toISOString(),
				endDate: subscription.endDate.toISOString(),
				amountPaid: subscription.amountPaid,
				currentFeatures: subscription.currentFeatures,
				daysRemaining: Math.max(
					0,
					Math.ceil(
						(subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
					)
				),
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			success: false,
			message: "Failed to load subscription.",
			error: errorMessage,
		});
	}
}

// ─── cancelSubscription ───────────────────────────────────────────────────────

/**
 * DELETE /api/subscriptions/me
 *
 * Cancels the authenticated owner's active subscription immediately.
 */
export async function cancelSubscription(req: Request, res: Response): Promise<void> {
	try {
		const owner = req.user!;

		const subscription = await Subscription.findOne({
			ownerId: owner._id,
			status: "active",
		}).sort({ endDate: -1 });

		if (!subscription) {
			res.status(404).json({
				success: false,
				message: "No active subscription to cancel.",
				error: "subscription_not_found",
			});
			return;
		}

		subscription.status = "cancelled";
		subscription.cancelledAt = new Date();
		await subscription.save();

		res.status(200).json({
			success: true,
			message: "Subscription cancelled successfully. Your access will remain until the billing period ends.",
			cancelledAt: subscription.cancelledAt.toISOString(),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			success: false,
			message: "Failed to cancel subscription.",
			error: errorMessage,
		});
	}
}

// ─── getAllPlans (public) ─────────────────────────────────────────────────────

/**
 * GET /api/subscriptions/plans
 *
 * Public endpoint. Returns all active pricing plans sorted by tier.
 */
export async function getAllPlans(_req: Request, res: Response): Promise<void> {
	try {
		const plans = await Plan.find({ isActive: true })
			.sort({ sortOrder: 1 })
			.lean();

		res.status(200).json({
			success: true,
			message: "Plans loaded successfully.",
			plans,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			success: false,
			message: "Failed to load plans.",
			error: errorMessage,
		});
	}
}

// ─── getCheckoutStatus ────────────────────────────────────────────────────────
/**
 * GET /api/subscriptions/checkout-status/:paymentCode
 *
 * Public/User status endpoint to verify if a pending checkout has been completed.
 */
export async function getCheckoutStatus(req: Request, res: Response): Promise<void> {
	try {
		const { paymentCode } = req.params;
		const checkout = await SubscriptionCheckout.findOne({ paymentCode });

		if (!checkout) {
			res.status(404).json({
				success: false,
				message: "Checkout session not found.",
				error: "checkout_not_found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			status: checkout.status, // "pending" | "completed" | "expired"
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			success: false,
			message: "Failed to get checkout status.",
			error: errorMessage,
		});
	}
}
