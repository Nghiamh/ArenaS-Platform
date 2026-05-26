import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReportChatMessage {
	sender_id: Types.ObjectId;
	sender_name: string;
	message: string;
	createdAt: Date;
}

export interface IReport extends Document {
	reporter_id: Types.ObjectId;
	target_id: Types.ObjectId;
	target_type: "user" | "court";
	reason: string;
	description: string;
	status: "pending" | "resolved" | "dismissed";
	chat_logs: IReportChatMessage[];
	createdAt: Date;
	updatedAt: Date;
}

const reportChatMessageSchema = new Schema<IReportChatMessage>(
	{
		sender_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		sender_name: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		createdAt: {
			type: Date,
			required: true,
			default: Date.now,
		},
	},
	{ _id: false }
);

const reportSchema = new Schema<IReport>(
	{
		reporter_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		target_id: {
			type: Schema.Types.ObjectId,
			required: true,
		},
		target_type: {
			type: String,
			enum: ["user", "court"],
			default: "user",
			required: true,
		},
		reason: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		status: {
			type: String,
			enum: ["pending", "resolved", "dismissed"],
			default: "pending",
			required: true,
		},
		chat_logs: {
			type: [reportChatMessageSchema],
			default: [],
		},
	},
	{
		timestamps: true,
		collection: "reports",
	}
);

reportSchema.index({ reporter_id: 1 });
reportSchema.index({ target_id: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.models.Report || mongoose.model<IReport>("Report", reportSchema);
export default Report;
