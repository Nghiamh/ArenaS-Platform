import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMatchFeedback extends Document {
	match_id: Types.ObjectId;
	reporter_id: Types.ObjectId;
	target_id: Types.ObjectId;
	sport: string;
	punctual: boolean;
	attitude: "friendly" | "neutral" | "bad";
	skill_as_described: boolean;
	play_again: boolean;
	is_processed: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const matchFeedbackSchema = new Schema<IMatchFeedback>(
	{
		match_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "Match",
		},
		reporter_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		target_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		sport: {
			type: String,
			required: true,
			trim: true,
		},
		punctual: {
			type: Boolean,
			required: true,
		},
		attitude: {
			type: String,
			enum: ["friendly", "neutral", "bad"],
			required: true,
		},
		skill_as_described: {
			type: Boolean,
			required: true,
		},
		play_again: {
			type: Boolean,
			required: true,
		},
		is_processed: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{
		timestamps: true,
		collection: "match_feedbacks",
	}
);

// Prevent a user from submitting multiple feedbacks for the same match
matchFeedbackSchema.index({ match_id: 1, reporter_id: 1 }, { unique: true });
matchFeedbackSchema.index({ target_id: 1 });
matchFeedbackSchema.index({ is_processed: 1 });

const MatchFeedback =
	mongoose.models.MatchFeedback ||
	mongoose.model<IMatchFeedback>("MatchFeedback", matchFeedbackSchema);

export default MatchFeedback;
