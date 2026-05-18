import { Request, Response } from "express";
import mongoose from "mongoose";
import Plan from "../models/planModel.js";
import Subscription, { BillingCycle } from "../models/subscriptionModel.js";

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

// ─── handlePaymentSuccess ─────────────────────────────────────────────────────

/**
 * POST /api/subscriptions/payment-success
 *
 * Triggered after a successful VietQR / SePay payment confirmation.
 * Idempotent: if the owner already has an active subscription for the same
 * plan, it is renewed rather than duplicated.
 *
 * Body:
 *   { ownerId: string, planId: string, billingCycle: "monthly" | "yearly" }
 */
export async function handlePaymentSuccess(req: Request, res: Response): Promise<void> {
	const session = await mongoose.startSession();

	try {
		const { ownerId, planId, billingCycle } = req.body as {
			ownerId?: string;
			planId?: string;
			billingCycle?: BillingCycle;
		};

		// ── Input validation ──────────────────────────────────────────────────

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

		// ── Fetch the plan ────────────────────────────────────────────────────

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

		// ── Build dates & price ───────────────────────────────────────────────

		const startDate = new Date();
		const endDate = computeEndDate(startDate, billingCycle);
		const amountPaid =
			billingCycle === "monthly" ? plan.pricing.monthly : plan.pricing.yearly;

		// ── Upsert subscription inside a transaction ──────────────────────────
		// Strategy:
		//   1. Cancel any currently active subscription (different plan or renewal).
		//   2. Create a fresh subscription with a features snapshot from the plan.
		// This keeps historical records intact for auditing.

		let subscription: InstanceType<typeof Subscription>;

		await session.withTransaction(async () => {
			// Expire all currently active subs for this owner (only one should exist
			// at a time, but this handles edge cases defensively).
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

			// Create the new subscription with a *snapshot* of the plan's features.
			// Using `plan.features.toObject()` ensures we detach from the Plan
			// document and store a plain object in the sub.
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

		// ── Success response ──────────────────────────────────────────────────

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
 * Returns the currently authenticated owner's active subscription,
 * or a 404 if they have none.
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
 * The subscription remains in the DB with status "cancelled" for audit trails.
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
