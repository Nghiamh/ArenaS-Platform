import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Feature Configuration ────────────────────────────────────────────────────

/**
 * Numeric limits use -1 to represent "unlimited".
 */
export interface IPlanFeatures {
	// Numeric limits (-1 = unlimited)
	max_locations: number;
	max_courts: number;
	max_bookings_per_month: number;

	// Boolean feature flags
	online_booking: boolean;
	ai_matchmaking: boolean;
	api_integration: boolean;
	analytics_dashboard: boolean;
	priority_support: boolean;
	custom_branding: boolean;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface IPlanPricing {
	monthly: number; // VND per month
	yearly: number;  // VND per year (discounted)
}

// ─── Plan Tiers ───────────────────────────────────────────────────────────────

export type PlanTier = string;

// ─── Plan Document Interface ──────────────────────────────────────────────────

export interface IPlan extends Document {
	name: PlanTier;
	displayName: string;
	description: string;
	pricing: IPlanPricing;
	features: IPlanFeatures;
	isCustom: boolean;
	isActive: boolean;
	sortOrder: number;
	createdAt?: Date;
	updatedAt?: Date;
}

interface IPlanModel extends Model<IPlan> {}

// ─── Feature Sub-Schema ───────────────────────────────────────────────────────

const planFeaturesSchema = new Schema<IPlanFeatures>(
	{
		max_locations: {
			type: Number,
			required: true,
			min: -1, // -1 = unlimited
			default: 1,
		},
		max_courts: {
			type: Number,
			required: true,
			min: -1,
			default: 5,
		},
		max_bookings_per_month: {
			type: Number,
			required: true,
			min: -1,
			default: 100,
		},
		online_booking: {
			type: Boolean,
			required: true,
			default: false,
		},
		ai_matchmaking: {
			type: Boolean,
			required: true,
			default: false,
		},
		api_integration: {
			type: Boolean,
			required: true,
			default: false,
		},
		analytics_dashboard: {
			type: Boolean,
			required: true,
			default: false,
		},
		priority_support: {
			type: Boolean,
			required: true,
			default: false,
		},
		custom_branding: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{ _id: false }
);

// ─── Pricing Sub-Schema ───────────────────────────────────────────────────────

const planPricingSchema = new Schema<IPlanPricing>(
	{
		monthly: {
			type: Number,
			required: true,
			min: 0,
		},
		yearly: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{ _id: false }
);

// ─── Plan Schema ──────────────────────────────────────────────────────────────

const planSchema = new Schema<IPlan, IPlanModel>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		displayName: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		pricing: {
			type: planPricingSchema,
			required: true,
		},
		features: {
			type: planFeaturesSchema,
			required: true,
		},
		/**
		 * isCustom: true means pricing/features are negotiated per-customer
		 * (Enterprise tier). The admin can override values per subscription.
		 */
		isCustom: {
			type: Boolean,
			required: true,
			default: false,
		},
		isActive: {
			type: Boolean,
			required: true,
			default: true,
		},
		/** Controls display order on the pricing page (ascending). */
		sortOrder: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	{
		timestamps: true,
		collection: "plans",
	}
);

planSchema.index({ isActive: 1, sortOrder: 1 });

const Plan = mongoose.models.Plan || mongoose.model<IPlan>("Plan", planSchema);

export default Plan;
