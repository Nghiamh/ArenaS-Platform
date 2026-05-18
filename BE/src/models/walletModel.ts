import mongoose, { Document, Schema } from "mongoose";

export type WalletStatus = "active" | "frozen";

export interface IWallet extends Document {
	userId: mongoose.Types.ObjectId;
	balance: number;
	status: WalletStatus;
	createdAt: Date;
	updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		balance: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "frozen"],
		},
	},
	{
		timestamps: true,
	}
);

const Wallet =
	mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", walletSchema);

export default Wallet;
