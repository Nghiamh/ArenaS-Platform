import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentWebhookLog extends Document {
	provider: string;
	rawData: unknown;
	processedAt?: Date;
	transferCode?: string;
	createdAt: Date;
	updatedAt: Date;
}

const paymentWebhookLogSchema = new Schema<IPaymentWebhookLog>(
	{
		provider: {
			type: String,
			required: true,
			trim: true,
		},
		rawData: {
			type: Schema.Types.Mixed,
			required: true,
		},
		processedAt: {
			type: Date,
			required: false,
		},
		transferCode: {
			type: String,
			required: false,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

const PaymentWebhookLog =
	mongoose.models.PaymentWebhookLog ||
	mongoose.model<IPaymentWebhookLog>(
		"PaymentWebhookLog",
		paymentWebhookLogSchema
	);

export default PaymentWebhookLog;
