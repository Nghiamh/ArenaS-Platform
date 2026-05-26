import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import {
	createCheckoutSession,
	handlePaymentSuccess,
	getMySubscription,
	cancelSubscription,
	getAllPlans,
	getCheckoutStatus,
} from "../controllers/subscriptionController.js";
import { handleSepayWebhook, fakeSubscriptionPayment } from "../controllers/webhookController.js";
import { getCurrentSubscriptionStatus, validateSubscriptionAction } from "../controllers/subscriptionManagementController.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** GET /api/subscriptions/plans — list all active pricing plans */
router.get("/plans", getAllPlans);

/** GET /api/subscriptions/checkout-status/:paymentCode — check status of checkout session */
router.get("/checkout-status/:paymentCode", getCheckoutStatus);

/** POST /api/subscriptions/sepay-webhook — webhook receiver for SePay transaction sync */
router.post("/sepay-webhook", handleSepayWebhook);

/** POST /api/subscriptions/fake-payment — simulate successful bank transfer for development */
router.post("/fake-payment", fakeSubscriptionPayment);

// ─── Owner-only ───────────────────────────────────────────────────────────────

/**
 * POST /api/subscriptions/checkout
 * Starts a checkout session for purchasing or upgrading a plan.
 */
router.post(
	"/checkout",
	requireAuth,
	requireRole({ role: "owner", error: "forbidden", message: "Only court owners can purchase plans." }),
	createCheckoutSession
);

/**
 * POST /api/subscriptions/payment-success
 * Triggered by the backend after a confirmed VietQR / SePay payment.
 * In production this should be called server-side (not directly from the browser).
 */
router.post(
	"/payment-success",
	requireAuth,
	requireRole({ role: "owner", error: "forbidden", message: "Only court owners can purchase plans." }),
	handlePaymentSuccess
);

/** GET /api/subscriptions/me — get the authenticated owner's active subscription */
router.get(
	"/me",
	requireAuth,
	requireRole({ role: "owner", error: "forbidden", message: "Only court owners have subscriptions." }),
	getMySubscription
);

/** DELETE /api/subscriptions/me — cancel the authenticated owner's subscription */
router.delete(
	"/me",
	requireAuth,
	requireRole({ role: "owner", error: "forbidden", message: "Only court owners have subscriptions." }),
	cancelSubscription
);

/** GET /api/subscriptions/my-status — check the authenticated owner's full active status */
router.get(
	"/my-status",
	requireAuth,
	requireRole({ role: "owner", error: "forbidden", message: "Only court owners have subscriptions." }),
	getCurrentSubscriptionStatus
);

/** POST /api/subscriptions/validate-action — validate cross-tier change actions */
router.post(
	"/validate-action",
	requireAuth,
	requireRole({ role: "owner", error: "forbidden", message: "Only court owners can purchase plans." }),
	validateSubscriptionAction
);

export default router;
