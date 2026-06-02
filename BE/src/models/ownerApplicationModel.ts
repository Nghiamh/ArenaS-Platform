import mongoose, { Document, Schema } from "mongoose";

export type OwnerApplicationStatus = "pending" | "approved" | "rejected";

export interface IOwnerApplication extends Document {
	userId: mongoose.Types.ObjectId;
	businessName: string;
	businessAddress: string;
	phone: string;
	identityCard: string;
	bankAccount?: string;
	description?: string;
	largeCourts?: number;
	smallCourts?: number;
	status: OwnerApplicationStatus;
	rejectionReason?: string;
	createdAt: Date;
	updatedAt: Date;
}

const ownerApplicationSchema = new Schema<IOwnerApplication>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		businessName: {
			type: String,
			required: true,
			trim: true,
		},
		businessAddress: {
			type: String,
			required: true,
			trim: true,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
		},
		identityCard: {
			type: String,
			required: true,
			trim: true,
		},
		bankAccount: {
			type: String,
			required: false,
			trim: true,
		},
		description: {
			type: String,
			required: false,
			trim: true,
		},
		largeCourts: {
			type: Number,
			required: false,
		},
		smallCourts: {
			type: Number,
			required: false,
		},
		status: {
			type: String,
			required: true,
			default: "pending",
			enum: ["pending", "approved", "rejected"],
		},
		rejectionReason: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	}
);

const OwnerApplication =
	mongoose.models.OwnerApplication ||
	mongoose.model<IOwnerApplication>("OwnerApplication", ownerApplicationSchema);

export default OwnerApplication;
