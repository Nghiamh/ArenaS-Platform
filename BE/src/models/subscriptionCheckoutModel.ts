import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type SubscriptionCheckoutStatus = "pending" | "completed" | "expired";

export interface ISubscriptionCheckout extends Document {
	paymentCode: string; // e.g. "SUB" + random 6-character alphanumeric string
	ownerId: Types.ObjectId;
	planId: Types.ObjectId;
	billingCycle: "monthly" | "yearly";
	amountToPay: number;
	status: SubscriptionCheckoutStatus;
	expiresAt: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

interface ISubscriptionCheckoutModel extends Model<ISubscriptionCheckout> {}

const subscriptionCheckoutSchema = new Schema<ISubscriptionCheckout, ISubscriptionCheckoutModel>(
	{
		paymentCode: {
			type: String,
			required: true,
			unique: true,
			index: true,
			trim: true,
		},
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
		billingCycle: {
			type: String,
			required: true,
			enum: ["monthly", "yearly"],
		},
		amountToPay: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			required: true,
			default: "pending",
			enum: ["pending", "completed", "expired"],
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true,
		},
	},
	{
		timestamps: true,
		collection: "subscription_checkouts",
	}
);

// Compound index to quickly find pending checkouts by code and status
subscriptionCheckoutSchema.index({ paymentCode: 1, status: 1 });

const SubscriptionCheckout =
	mongoose.models.SubscriptionCheckout ||
	mongoose.model<ISubscriptionCheckout>("SubscriptionCheckout", subscriptionCheckoutSchema);

export default SubscriptionCheckout;
