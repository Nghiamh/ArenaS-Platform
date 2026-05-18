import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import {
	getPlans,
	getPlanById,
	createPlan,
	updatePlan,
	togglePlanStatus,
	deletePlan,
} from "../controllers/planController.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * GET /api/plans
 * Returns all active plans (sorted by sortOrder).
 * Admin can append ?all=true to see inactive plans too.
 */
router.get("/", getPlans);

/**
 * GET /api/plans/:id
 * Returns a single plan by ObjectId.
 */
router.get("/:id", getPlanById);

// ─── Admin only ───────────────────────────────────────────────────────────────

const adminOnly = [
	requireAuth,
	requireRole({ role: "admin", error: "forbidden", message: "Admin access required." }),
];

/**
 * POST /api/plans
 * Creates a new pricing plan.
 */
router.post("/", ...adminOnly, createPlan);

/**
 * PATCH /api/plans/:id
 * Partially updates a plan's pricing, features, or metadata.
 */
router.patch("/:id", ...adminOnly, updatePlan);

/**
 * PATCH /api/plans/:id/toggle
 * Toggles the isActive flag for a plan.
 */
router.patch("/:id/toggle", ...adminOnly, togglePlanStatus);

/**
 * DELETE /api/plans/:id
 * Hard-deletes a plan (blocked if active subscriptions exist).
 */
router.delete("/:id", ...adminOnly, deletePlan);

export default router;
