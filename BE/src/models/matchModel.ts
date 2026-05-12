import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type MatchStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface IMatch extends Document {
	participants: Types.ObjectId[];
	owner_id: Types.ObjectId;
	court_id: Types.ObjectId;
	sport: string;
	match_score: number;
	chat_deleted_by: Types.ObjectId[];
	status: MatchStatus;
	scheduled_at?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

interface IMatchModel extends Model<IMatch> {}

const matchSchema = new Schema<IMatch, IMatchModel>(
	{
		participants: {
			type: [Schema.Types.ObjectId],
			required: true,
			ref: "User",
			validate: {
				validator(value: Types.ObjectId[]) {
					return Array.isArray(value) && value.length === 2;
				},
				message: "participants must contain exactly 2 players",
			},
		},
		owner_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		court_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "Court",
		},
		sport: {
			type: String,
			required: true,
			trim: true,
		},
		match_score: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		chat_deleted_by: {
			type: [Schema.Types.ObjectId],
			required: true,
			default: [],
			ref: "User",
		},
		status: {
			type: String,
			required: true,
			default: "PENDING",
			enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
		},
		scheduled_at: {
			type: Date,
			required: false,
			default: undefined,
		},
	},
	{
		timestamps: true,
		collection: "matches",
	}
);

matchSchema.index({ participants: 1 });
matchSchema.index({ court_id: 1 });
matchSchema.index({ owner_id: 1 });

const Match = mongoose.models.Match || mongoose.model<IMatch>("Match", matchSchema);

export default Match;
