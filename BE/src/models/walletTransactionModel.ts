import mongoose, { Document, Schema } from "mongoose";

export type TransactionType = "deposit" | "payment" | "refund";
export type TransactionStatus = "pending" | "completed" | "expired" | "failed";

export interface IWalletTransaction extends Document {
	walletId: mongoose.Types.ObjectId;
	bookingId?: mongoose.Types.ObjectId;
	amount: number;
	type: TransactionType;
	status: TransactionStatus;
	transferCode?: string;
	expiredAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
	{
		walletId: {
			type: Schema.Types.ObjectId,
			ref: "Wallet",
			required: true,
		},
		bookingId: {
			type: Schema.Types.ObjectId,
			required: false,
		},
		amount: {
			type: Number,
			required: true,
			min: 1,
		},
		type: {
			type: String,
			required: true,
			enum: ["deposit", "payment", "refund"],
		},
		status: {
			type: String,
			required: true,
			default: "pending",
			enum: ["pending", "completed", "expired", "failed"],
		},
		transferCode: {
			type: String,
			unique: true,
			sparse: true,
		},
		expiredAt: {
			type: Date,
			required: false,
		},
	},
	{
		timestamps: true,
	}
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });

// Automatically delete pending/expired transactions after expiredAt (TTL index)
// Only affects non-completed transactions
walletTransactionSchema.index(
	{ expiredAt: 1 },
	{
		expireAfterSeconds: 0,
		partialFilterExpression: { status: { $ne: "completed" } },
	}
);

const WalletTransaction =
	mongoose.models.WalletTransaction ||
	mongoose.model<IWalletTransaction>(
		"WalletTransaction",
		walletTransactionSchema
	);

export default WalletTransaction;
