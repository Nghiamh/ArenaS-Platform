import { Request, Response } from "express";
import mongoose from "mongoose";
import SubscriptionCheckout from "../models/subscriptionCheckoutModel.js";
import Subscription from "../models/subscriptionModel.js";
import Plan from "../models/planModel.js";
import PaymentWebhookLog from "../models/paymentWebhookLogModel.js";

// ─── Reusable Subscription Checkout Processor ─────────────────────────────────

/**
 * Core logic for activating a subscription from a payment code.
 * Used by both the real SePay webhook and the dev fake-payment endpoint.
 *
 * @param paymentCode - The normalized transfer code (no dashes, uppercase)
 * @param transferAmount - The actual amount transferred. If 0, uses the checkout's expected amount.
 */
export async function processSubscriptionCheckout(
	paymentCode: string,
	transferAmount?: number
): Promise<{ success: boolean; message: string; error?: string; alreadyProcessed?: boolean }> {
	const session = await mongoose.startSession();
	let result: { success: boolean; message: string; error?: string; alreadyProcessed?: boolean } = {
		success: false,
		message: "",
	};

	try {
		await session.withTransaction(async () => {
			// Find the pending checkout record matching the payment code
			const checkout = await SubscriptionCheckout.findOne({
				paymentCode,
				status: "pending",
			}).session(session);

			if (!checkout) {
				// Idempotent: check if this payment was already processed
				const completedCheckout = await SubscriptionCheckout.findOne({
					paymentCode,
					status: "completed",
				}).session(session);

				if (completedCheckout) {
					result = {
						success: true,
						message: "Transaction already processed successfully.",
						alreadyProcessed: true,
					};
					return;
				}

				result = {
					success: false,
					message: "No pending subscription checkout found for this payment code.",
					error: "checkout_not_found",
				};
				return;
			}

			// Determine the final amount: use actual transfer amount if provided, otherwise use checkout's expected amount
			const finalAmount = (transferAmount && transferAmount > 0) ? transferAmount : checkout.amountToPay;

			// Verify paid amount (warn if less than expected)
			if (finalAmount < checkout.amountToPay) {
				console.warn(
					`[Subscription Checkout] Paid amount (${finalAmount} VND) is less than required (${checkout.amountToPay} VND) for code ${paymentCode}`
				);
			}

			// Retrieve the plan to clone features snapshot
			const plan = await Plan.findById(checkout.planId).session(session);
			if (!plan) {
				throw new Error(`Plan referenced in checkout (${checkout.planId}) not found.`);
			}

			const startDate = new Date();
			const endDate = new Date(startDate);
			if (checkout.billingCycle === "monthly") {
				endDate.setMonth(endDate.getMonth() + 1);
			} else {
				endDate.setFullYear(endDate.getFullYear() + 1);
			}

			// Atomically cancel any previous active subscriptions for this owner
			await Subscription.updateMany(
				{
					ownerId: checkout.ownerId,
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

			// Create and save the new Subscription
			const [newSubscription] = await Subscription.create(
				[
					{
						ownerId: checkout.ownerId,
						planId: plan._id,
						status: "active",
						billingCycle: checkout.billingCycle,
						startDate,
						endDate,
						amountPaid: finalAmount,
						currentFeatures: plan.features.toObject ? plan.features.toObject() : { ...plan.features },
					},
				],
				{ session }
			);

			// Mark the checkout as completed
			checkout.status = "completed";
			await checkout.save({ session });

			result = {
				success: true,
				message: "Subscription successfully created and activated.",
			};

			console.log(
				`[Subscription Checkout] Activated subscription ${newSubscription._id} for owner ${checkout.ownerId}, plan ${plan.name}, amount ${finalAmount} VND`
			);
		});

		return result;
	} catch (error: unknown) {
		const err = error instanceof Error ? error : new Error(String(error));
		console.error("[Subscription Checkout] Transaction failed and rolled back:", err.message);
		return {
			success: false,
			message: "Failed to activate subscription.",
			error: err.message,
		};
	} finally {
		await session.endSession();
	}
}

// ─── SePay Webhook (Direct Endpoint) ──────────────────────────────────────────

/**
 * POST /api/subscriptions/sepay-webhook
 *
 * Direct SePay webhook endpoint for subscription payments.
 * Authenticates via x-sepay-api-key header.
 */
export async function handleSepayWebhook(req: Request, res: Response): Promise<void> {
	try {
		// a) Security check
		const apiKey = req.headers["x-sepay-api-key"];
		const expectedApiKey = process.env.SEPAY_API_KEY;

		if (!expectedApiKey || apiKey !== expectedApiKey) {
			console.error("[SePay Webhook] Unauthorized request. Provided key:", apiKey);
			res.status(401).json({
				success: false,
				message: "Unauthorized. Invalid SePay API Key.",
				error: "unauthorized_webhook",
			});
			return;
		}

		// b) Extract transaction metadata
		const rawData = req.body;
		const content = rawData?.content;
		const transferAmount = Number(rawData?.transferAmount || rawData?.amount);

		if (!content) {
			res.status(400).json({
				success: false,
				message: "Transaction content is missing in webhook body.",
				error: "missing_content",
			});
			return;
		}

		if (isNaN(transferAmount) || transferAmount <= 0) {
			res.status(400).json({
				success: false,
				message: "A valid transferAmount is required.",
				error: "invalid_transfer_amount",
			});
			return;
		}

		// c) Extract payment code from content (format: PAY-YYYYMMDD-XXXXX or PAYYYYYMMDDXXXXX)
		let extractedCode: string | undefined;
		const codeRegex = /PAY-?\d{8}-?[A-Z0-9]{5}/i;
		const match = content.match(codeRegex);
		if (match) {
			extractedCode = match[0].replace(/-/g, "").toUpperCase();
		}

		// Log the webhook
		await PaymentWebhookLog.create({
			provider: "sepay",
			rawData,
			transferCode: extractedCode || content,
			processedAt: new Date(),
		});

		if (!extractedCode) {
			console.warn(`[SePay Webhook] No valid PAY code found in content: "${content}"`);
			res.status(400).json({
				success: false,
				message: "Could not find a valid PAY payment code in transaction content.",
				error: "invalid_payment_code_format",
			});
			return;
		}

		const result = await processSubscriptionCheckout(extractedCode, transferAmount);

		if (!result.success && !result.alreadyProcessed) {
			res.status(400).json(result);
			return;
		}

		res.status(200).json(result);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		console.error("[SePay Webhook Controller Error]:", errorMessage);
		res.status(500).json({
			success: false,
			message: "Failed to process webhook.",
			error: errorMessage,
		});
	}
}

// ─── Fake Subscription Payment (Dev Only) ─────────────────────────────────────

/**
 * POST /api/subscriptions/fake-payment
 *
 * Development-only endpoint to simulate a successful bank transfer payment for a subscription.
 */
export async function fakeSubscriptionPayment(req: Request, res: Response): Promise<void> {
	try {
		const { paymentCode } = req.body as { paymentCode?: string };

		if (!paymentCode || typeof paymentCode !== "string") {
			res.status(400).json({
				success: false,
				message: "paymentCode is required.",
				error: "missing_payment_code",
			});
			return;
		}

		const normalizedCode = paymentCode.replace(/-/g, "").toUpperCase();

		const result = await processSubscriptionCheckout(normalizedCode);

		if (!result.success && !result.alreadyProcessed) {
			res.status(400).json(result);
			return;
		}

		res.status(200).json(result);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			success: false,
			message: "Failed to simulate payment.",
			error: errorMessage,
		});
	}
}
