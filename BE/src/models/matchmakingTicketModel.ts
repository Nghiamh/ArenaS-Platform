import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type TicketStatus = "WAITING" | "MATCHED" | "CANCELLED" | "EXPIRED";

export interface IMatchmakingTicketLocation {
	type: "Point";
	coordinates: [number, number]; // [longitude, latitude]
}

export interface IMatchmakingTicket extends Document {
	user_id: Types.ObjectId;
	court_id?: Types.ObjectId;
	sport: string;
	location: IMatchmakingTicketLocation;
	status: TicketStatus;
	matched_with?: Types.ObjectId;
	match_id?: Types.ObjectId;
	expires_at: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

interface IMatchmakingTicketModel extends Model<IMatchmakingTicket> {}

const ticketLocationSchema = new Schema<IMatchmakingTicketLocation>(
	{
		type: {
			type: String,
			required: true,
			default: "Point",
			enum: ["Point"],
		},
		coordinates: {
			type: [Number],
			required: true,
			validate: {
				validator(value: number[]) {
					return (
						Array.isArray(value) &&
						value.length === 2 &&
						value.every((c) => typeof c === "number")
					);
				},
				message: "coordinates must contain [longitude, latitude]",
			},
		},
	},
	{ _id: false }
);

const matchmakingTicketSchema = new Schema<IMatchmakingTicket, IMatchmakingTicketModel>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		court_id: {
			type: Schema.Types.ObjectId,
			required: false,
			ref: "Court",
			default: undefined,
		},
		sport: {
			type: String,
			required: true,
			trim: true,
		},
		location: {
			type: ticketLocationSchema,
			required: true,
		},
		status: {
			type: String,
			required: true,
			default: "WAITING",
			enum: ["WAITING", "MATCHED", "CANCELLED", "EXPIRED"],
		},
		matched_with: {
			type: Schema.Types.ObjectId,
			required: false,
			ref: "MatchmakingTicket",
			default: undefined,
		},
		match_id: {
			type: Schema.Types.ObjectId,
			required: false,
			ref: "Match",
			default: undefined,
		},
		expires_at: {
			type: Date,
			required: true,
		},
	},
	{
		timestamps: true,
		collection: "matchmaking_tickets",
	}
);

// Worker query: find all WAITING tickets grouped by court + sport
matchmakingTicketSchema.index({ status: 1, court_id: 1, sport: 1 });
// Check if user already has a WAITING ticket
matchmakingTicketSchema.index({ user_id: 1, status: 1 });
// Geospatial index for location-based queries
matchmakingTicketSchema.index({ location: "2dsphere" });

const MatchmakingTicket =
	mongoose.models.MatchmakingTicket ||
	mongoose.model<IMatchmakingTicket>("MatchmakingTicket", matchmakingTicketSchema);

export default MatchmakingTicket;
