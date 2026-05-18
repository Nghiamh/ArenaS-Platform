import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IPlanFeatures } from "./planModel.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type BillingCycle = "monthly" | "yearly";

// ─── Subscription Document Interface ─────────────────────────────────────────

export interface ISubscription extends Document {
	ownerId: Types.ObjectId;
	planId: Types.ObjectId;
	status: SubscriptionStatus;
	billingCycle: BillingCycle;
	startDate: Date;
	endDate: Date;
	/**
	 * Snapshot of plan features at the time of purchase.
	 * Stored separately so that future plan changes do not retroactively
	 * affect in-flight subscriptions.
	 */
	currentFeatures: IPlanFeatures;
	/**
	 * Price paid at the time of purchase (VND), useful for revenue reporting.
	 */
	amountPaid: number;
	/** Set when the subscription is cancelled before natural expiry. */
	cancelledAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

interface ISubscriptionModel extends Model<ISubscription> {}

// ─── Feature Snapshot Sub-Schema ─────────────────────────────────────────────
// Must mirror IPlanFeatures exactly so queries like
// sub.currentFeatures.max_courts work at runtime.

const currentFeaturesSchema = new Schema<IPlanFeatures>(
	{
		max_locations: { type: Number, required: true },
		max_courts: { type: Number, required: true },
		max_bookings_per_month: { type: Number, required: true },
		online_booking: { type: Boolean, required: true },
		ai_matchmaking: { type: Boolean, required: true },
		api_integration: { type: Boolean, required: true },
		analytics_dashboard: { type: Boolean, required: true },
		priority_support: { type: Boolean, required: true },
		custom_branding: { type: Boolean, required: true },
	},
	{ _id: false }
);

// ─── Subscription Schema ──────────────────────────────────────────────────────

const subscriptionSchema = new Schema<ISubscription, ISubscriptionModel>(
	{
		ownerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
			index: true,
		},
		planId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "Plan",
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "expired", "cancelled"],
		},
		billingCycle: {
			type: String,
			required: true,
			enum: ["monthly", "yearly"],
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
			index: true,
		},
		currentFeatures: {
			type: currentFeaturesSchema,
			required: true,
		},
		amountPaid: {
			type: Number,
			required: true,
			min: 0,
		},
		cancelledAt: {
			type: Date,
			required: false,
		},
	},
	{
		timestamps: true,
		collection: "subscriptions",
	}
);

// Compound index: find the latest active sub for a given owner quickly.
subscriptionSchema.index({ ownerId: 1, status: 1, endDate: -1 });

const Subscription =
	mongoose.models.Subscription ||
	mongoose.model<ISubscription>("Subscription", subscriptionSchema);

export default Subscription;
