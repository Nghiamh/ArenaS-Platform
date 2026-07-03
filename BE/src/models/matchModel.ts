import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type MatchStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface IMatch extends Document {
	participants: Types.ObjectId[];
	owner_id: Types.ObjectId;
	court_id: Types.ObjectId;
	sport: string;
	match_score: number;
	accepted_by: Types.ObjectId[];
	checked_in_players: Types.ObjectId[];
	confirmation_deadline?: Date;
	status: MatchStatus;
	scheduled_at?: Date;
	scheduled_end_at?: Date;
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
		accepted_by: {
			type: [Schema.Types.ObjectId],
			required: true,
			default: [],
			ref: "User",
		},
		checked_in_players: {
			type: [Schema.Types.ObjectId],
			required: true,
			default: [],
			ref: "User",
		},
		confirmation_deadline: {
			type: Date,
			required: false,
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
		scheduled_end_at: {
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
// Used by expirePendingMatches worker every 5s — compound index for fast expiry lookup
matchSchema.index({ status: 1, confirmation_deadline: 1 });
// Used by getMatchmakingStatus to filter active matches per participant
matchSchema.index({ participants: 1, status: 1 });

const Match = mongoose.models.Match || mongoose.model<IMatch>("Match", matchSchema);

export default Match;
