import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IChatMessage extends Document {
	match_id: Types.ObjectId;
	sender_id: Types.ObjectId;
	message: string;
	createdAt?: Date;
}

interface IChatMessageModel extends Model<IChatMessage> {}

const chatMessageSchema = new Schema<IChatMessage, IChatMessageModel>(
	{
		match_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "Match",
		},
		sender_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		message: {
			type: String,
			required: true,
			trim: true,
			maxlength: 2000,
		},
	},
	{
		timestamps: true,
		collection: "chat_messages",
	}
);

// Query chat history by match, ordered by time
chatMessageSchema.index({ match_id: 1, createdAt: 1 });

const ChatMessage =
	mongoose.models.ChatMessage ||
	mongoose.model<IChatMessage>("ChatMessage", chatMessageSchema);

export default ChatMessage;
