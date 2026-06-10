import mongoose, { Document, Schema } from "mongoose";

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface IWithdrawalRequest extends Document {
	ownerId: mongoose.Types.ObjectId;
	amount: number;
	bankName: string;
	bankAccountName: string;
	bankAccountNumber: string;
	status: WithdrawalStatus;
	adminNote?: string;
	isReported?: boolean;
	reportMessage?: string;
	isReportResolved?: boolean;
	reportResolutionMessage?: string;
	isReceiptConfirmed?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
	{
		ownerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 10000, // Minimum withdrawal amount
		},
		bankName: {
			type: String,
			required: true,
			trim: true,
		},
		bankAccountName: {
			type: String,
			required: true,
			trim: true,
		},
		bankAccountNumber: {
			type: String,
			required: true,
			trim: true,
		},
		status: {
			type: String,
			required: true,
			default: "pending",
			enum: ["pending", "approved", "rejected"],
		},
		adminNote: {
			type: String,
			required: false,
		},
		isReported: {
			type: Boolean,
			default: false,
		},
		reportMessage: {
			type: String,
			required: false,
		},
		isReportResolved: {
			type: Boolean,
			default: false,
		},
		reportResolutionMessage: {
			type: String,
			required: false,
		},
		isReceiptConfirmed: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

const WithdrawalRequest =
	mongoose.models.WithdrawalRequest ||
	mongoose.model<IWithdrawalRequest>("WithdrawalRequest", withdrawalRequestSchema);

export default WithdrawalRequest;
