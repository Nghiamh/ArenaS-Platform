import { Request, Response } from "express";
import mongoose from "mongoose";
import Plan from "../models/planModel.js";
import Subscription from "../models/subscriptionModel.js";
import { IPlanFeatures, IPlanPricing, PlanTier } from "../models/planModel.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatePlanBody {
	name?: PlanTier;
	displayName?: string;
	description?: string;
	pricing?: Partial<IPlanPricing>;
	features?: Partial<IPlanFeatures>;
	isCustom?: boolean;
	isActive?: boolean;
	sortOrder?: number;
}

// ─── GET /api/plans ───────────────────────────────────────────────────────────

/**
 * Public — returns all active plans sorted by display order.
 * Admin can pass ?all=true to see inactive plans too.
 */
export async function getPlans(req: Request, res: Response): Promise<void> {
	try {
		const showAll = req.user?.role === "admin" && req.query.all === "true";
		// $ne: false matches both { isActive: true } AND documents that don't
		// have the isActive field at all (legacy data without the field).
		const filter = showAll ? {} : { isActive: { $ne: false } };

		const plans = await Plan.find(filter).sort({ sortOrder: 1 }).lean();

		res.status(200).json({
			success: true,
			count: plans.length,
			plans,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ success: false, message: "Failed to load plans.", error: errorMessage });
	}
}

// ─── GET /api/plans/:id ───────────────────────────────────────────────────────

/**
 * Public — returns a single plan by its MongoDB ObjectId.
 */
export async function getPlanById(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			res.status(400).json({ success: false, message: "Invalid plan ID.", error: "invalid_id" });
			return;
		}

		const plan = await Plan.findById(id).lean();

		if (!plan) {
			res.status(404).json({ success: false, message: "Plan not found.", error: "plan_not_found" });
			return;
		}

		res.status(200).json({ success: true, plan });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ success: false, message: "Failed to load plan.", error: errorMessage });
	}
}

// ─── POST /api/plans ──────────────────────────────────────────────────────────

/**
 * Admin only — creates a new pricing plan.
 * The `name` field must be unique (starter | basic | professional | enterprise).
 */
export async function createPlan(req: Request, res: Response): Promise<void> {
	try {
		const body = req.body as CreatePlanBody;

		// ── Required field validation ────────────────────────────────────────
		const missingFields: string[] = [];
		if (!body.name) missingFields.push("name");
		if (!body.displayName) missingFields.push("displayName");
		if (!body.description) missingFields.push("description");
		if (body.pricing?.monthly === undefined) missingFields.push("pricing.monthly");
		if (!body.features) missingFields.push("features");
		// NOTE: pricing.yearly is NOT required — it is auto-computed from monthly.

		if (missingFields.length > 0) {
			res.status(400).json({
				success: false,
				message: `Missing required fields: ${missingFields.join(", ")}.`,
				error: "missing_fields",
			});
			return;
		}

		// ── Duplicate name check ──────────────────────────────────────────────
		const existing = await Plan.findOne({ name: body.name?.toLowerCase() });
		if (existing) {
			res.status(409).json({
				success: false,
				message: `A plan with name "${body.name}" already exists.`,
				error: "duplicate_plan_name",
			});
			return;
		}

		const plan = await Plan.create({
			name: body.name,
			displayName: body.displayName,
			description: body.description,
			// Only store monthly; yearly is a virtual computed from monthly.
			pricing: { monthly: body.pricing?.monthly ?? 0 },
			features: body.features,
			isCustom: body.isCustom ?? false,
			isActive: body.isActive ?? true,
			sortOrder: body.sortOrder ?? 0,
		});

		res.status(201).json({
			success: true,
			message: "Plan created successfully.",
			plan,
		});
	} catch (error: unknown) {
		// Mongoose duplicate key error
		if ((error as { code?: number }).code === 11000) {
			res.status(409).json({
				success: false,
				message: "A plan with this name already exists.",
				error: "duplicate_plan_name",
			});
			return;
		}
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ success: false, message: "Failed to create plan.", error: errorMessage });
	}
}

// ─── PATCH /api/plans/:id ─────────────────────────────────────────────────────

/**
 * Admin only — partially updates a plan's pricing, features, or metadata.
 *
 * Only the fields present in the request body are updated (PATCH semantics).
 * Nested objects (pricing, features) are merged via $set with dot notation
 * so callers can update a single feature flag without sending the full object.
 */
export async function updatePlan(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			res.status(400).json({ success: false, message: "Invalid plan ID.", error: "invalid_id" });
			return;
		}

		const body = req.body as CreatePlanBody;

		// Build a flat $set map so nested partial updates work correctly.
		const setMap: Record<string, unknown> = {};

		if (body.displayName !== undefined) setMap["displayName"] = body.displayName;
		if (body.description !== undefined) setMap["description"] = body.description;
		if (body.isCustom !== undefined) setMap["isCustom"] = body.isCustom;
		if (body.isActive !== undefined) setMap["isActive"] = body.isActive;
		if (body.sortOrder !== undefined) setMap["sortOrder"] = body.sortOrder;

		// Pricing — only monthly is stored; yearly is a virtual auto-computed from monthly
		if (body.pricing) {
			const p = body.pricing;
			if (p.monthly !== undefined) setMap["pricing.monthly"] = p.monthly;
			// NOTE: p.yearly is intentionally ignored — it is not stored in DB.
		}

		// Features — merge individual flags
		if (body.features) {
			const f = body.features;
			if (f.max_locations !== undefined) setMap["features.max_locations"] = f.max_locations;
			if (f.max_courts !== undefined) setMap["features.max_courts"] = f.max_courts;
			if (f.max_bookings_per_month !== undefined) setMap["features.max_bookings_per_month"] = f.max_bookings_per_month;
			if (f.online_booking !== undefined) setMap["features.online_booking"] = f.online_booking;
			if (f.ai_matchmaking !== undefined) setMap["features.ai_matchmaking"] = f.ai_matchmaking;
			if (f.api_integration !== undefined) setMap["features.api_integration"] = f.api_integration;
			if (f.analytics_dashboard !== undefined) setMap["features.analytics_dashboard"] = f.analytics_dashboard;
			if (f.priority_support !== undefined) setMap["features.priority_support"] = f.priority_support;
			if (f.custom_branding !== undefined) setMap["features.custom_branding"] = f.custom_branding;
		}

		if (Object.keys(setMap).length === 0) {
			res.status(400).json({
				success: false,
				message: "No updatable fields provided.",
				error: "empty_update",
			});
			return;
		}

		const updated = await Plan.findByIdAndUpdate(
			id,
			{ $set: setMap },
			{ new: true, runValidators: true }
		);

		if (!updated) {
			res.status(404).json({ success: false, message: "Plan not found.", error: "plan_not_found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Plan updated successfully.",
			plan: updated,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ success: false, message: "Failed to update plan.", error: errorMessage });
	}
}

// ─── PATCH /api/plans/:id/toggle ─────────────────────────────────────────────

/**
 * Admin only — toggles a plan's isActive flag.
 * Faster than a full PATCH when only activating/deactivating a tier.
 */
export async function togglePlanStatus(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			res.status(400).json({ success: false, message: "Invalid plan ID.", error: "invalid_id" });
			return;
		}

		const plan = await Plan.findById(id);
		if (!plan) {
			res.status(404).json({ success: false, message: "Plan not found.", error: "plan_not_found" });
			return;
		}

		plan.isActive = !plan.isActive;
		await plan.save();

		res.status(200).json({
			success: true,
			message: `Plan "${plan.displayName}" is now ${plan.isActive ? "active" : "inactive"}.`,
			plan,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ success: false, message: "Failed to toggle plan status.", error: errorMessage });
	}
}

// ─── DELETE /api/plans/:id ────────────────────────────────────────────────────

/**
 * Admin only — hard-deletes a plan.
 *
 * Safety check: refuses deletion if any active subscriptions still reference
 * this plan. Admin must migrate/cancel those subs first.
 */
export async function deletePlan(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			res.status(400).json({ success: false, message: "Invalid plan ID.", error: "invalid_id" });
			return;
		}

		// ── Safety check: active subscriptions ───────────────────────────────
		const activeSubCount = await Subscription.countDocuments({
			planId: new mongoose.Types.ObjectId(id),
			status: "active",
		});

		if (activeSubCount > 0) {
			res.status(409).json({
				success: false,
				message: `Cannot delete: ${activeSubCount} active subscription(s) are using this plan. Deactivate the plan instead, or cancel the subscriptions first.`,
				error: "plan_has_active_subscriptions",
				meta: { activeSubCount },
			});
			return;
		}

		const deleted = await Plan.findByIdAndDelete(id);

		if (!deleted) {
			res.status(404).json({ success: false, message: "Plan not found.", error: "plan_not_found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: `Plan "${deleted.displayName}" deleted successfully.`,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ success: false, message: "Failed to delete plan.", error: errorMessage });
	}
}
