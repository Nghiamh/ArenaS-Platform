import { NextFunction, Request, Response } from "express";
import mongoose, { Model } from "mongoose";
import Subscription, { ISubscription } from "../models/subscriptionModel.js";
import { IPlanFeatures } from "../models/planModel.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves the active subscription for the authenticated owner.
 * Returns null + sends the appropriate HTTP response if the subscription
 * is missing, expired, or cancelled.
 */
async function resolveActiveSubscription(
	ownerId: string,
	res: Response
): Promise<ISubscription | null> {
	const sub = await Subscription.findOne({
		ownerId: new mongoose.Types.ObjectId(ownerId),
		status: "active",
	}).sort({ endDate: -1 });

	if (!sub) {
		res.status(403).json({
			success: false,
			message: "No active subscription found. Please upgrade your plan to access this feature.",
			error: "no_active_subscription",
		});
		return null;
	}

	// Guard: check if the subscription has passed its endDate without being
	// marked expired (e.g. the cron job hasn't run yet).
	if (new Date() > sub.endDate) {
		// Fire-and-forget status update; we don't await to avoid blocking the middleware.
		Subscription.findByIdAndUpdate(sub._id, { status: "expired" }).exec().catch(() => {});

		res.status(403).json({
			success: false,
			message: "Your subscription has expired. Please renew to continue using this feature.",
			error: "subscription_expired",
		});
		return null;
	}

	return sub;
}

// ─── checkLimit ───────────────────────────────────────────────────────────────

/**
 * Middleware factory that enforces a **numeric** plan limit.
 *
 * @param featureKey  - Key in `currentFeatures` that holds the max allowed count
 *                      (e.g. "max_courts", "max_locations").
 * @param model       - Mongoose model to count existing documents against
 *                      (must have an `owner_id` field referencing the user).
 *
 * Usage:
 *   router.post("/courts", requireAuth, checkLimit("max_courts", Court), createCourt);
 */
export function checkLimit<T>(
	featureKey: keyof IPlanFeatures,
	model: Model<T> & { collection: { name: string } }
) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const owner = req.user;
			if (!owner) {
				res.status(401).json({ success: false, message: "unauthorized", error: "missing_token" });
				return;
			}

			const sub = await resolveActiveSubscription(String(owner._id), res);
			if (!sub) return; // response already sent

			const limit = (sub.currentFeatures as IPlanFeatures)[featureKey];

			// -1 means unlimited — skip the count check entirely.
			if (typeof limit === "number" && limit === -1) {
				next();
				return;
			}

			// featureKey is a boolean feature, not a numeric limit.
			if (typeof limit !== "number") {
				res.status(400).json({
					success: false,
					message: `Feature key "${featureKey}" is not a numeric limit. Use requireFeature() instead.`,
					error: "invalid_feature_key",
				});
				return;
			}

			// Count existing documents created by this owner.
			const currentCount = await (model as unknown as { countDocuments: (q: object) => Promise<number> })
				.countDocuments({ owner_id: owner._id });

			if (currentCount >= limit) {
				res.status(403).json({
					success: false,
					message: `You have reached the maximum limit of ${limit} for "${featureKey}" on your current plan. Please upgrade to add more.`,
					error: "limit_exceeded",
					meta: {
						featureKey,
						limit,
						current: currentCount,
					},
				});
				return;
			}

			// Attach subscription to the request for downstream use.
			req.subscription = sub;
			next();
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "unknown error";
			res.status(500).json({
				success: false,
				message: "Failed to verify subscription limits.",
				error: errorMessage,
			});
		}
	};
}

// ─── requireFeature ───────────────────────────────────────────────────────────

/**
 * Middleware factory that enforces a **boolean** plan feature gate.
 *
 * @param featureKey - Key in `currentFeatures` that must be `true` to allow access
 *                     (e.g. "ai_matchmaking", "api_integration").
 *
 * Usage:
 *   router.post("/match", requireAuth, requireFeature("ai_matchmaking"), createMatch);
 */
export function requireFeature(featureKey: keyof IPlanFeatures) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const owner = req.user;
			if (!owner) {
				res.status(401).json({ success: false, message: "unauthorized", error: "missing_token" });
				return;
			}

			const sub = await resolveActiveSubscription(String(owner._id), res);
			if (!sub) return; // response already sent

			const featureValue = (sub.currentFeatures as IPlanFeatures)[featureKey];

			// Guard: this middleware is for boolean features only.
			if (typeof featureValue !== "boolean") {
				res.status(400).json({
					success: false,
					message: `Feature key "${featureKey}" is not a boolean flag. Use checkLimit() instead.`,
					error: "invalid_feature_key",
				});
				return;
			}

			if (!featureValue) {
				res.status(403).json({
					success: false,
					message: `Your current plan does not include "${featureKey}". Please upgrade to unlock this feature.`,
					error: "feature_not_available",
					meta: { featureKey },
				});
				return;
			}

			// Attach subscription to the request for downstream use.
			req.subscription = sub;
			next();
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "unknown error";
			res.status(500).json({
				success: false,
				message: "Failed to verify feature access.",
				error: errorMessage,
			});
		}
	};
}
