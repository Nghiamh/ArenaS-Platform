import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import {
	handlePaymentSuccess,
	getMySubscription,
	cancelSubscription,
	getAllPlans,
} from "../controllers/subscriptionController.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** GET /api/subscriptions/plans — list all active pricing plans */
router.get("/plans", getAllPlans);

// ─── Owner-only ───────────────────────────────────────────────────────────────

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

export default router;
