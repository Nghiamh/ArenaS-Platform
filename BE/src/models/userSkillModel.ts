import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUserSkill extends Document {
	user_id: Types.ObjectId;
	sport: string;
	note?: string;
	level: number;
	play_frequency?: number;
	play_vibe?: "casual" | "balanced" | "competitive";
	rating_score: number;
	confidence_score?: number;
	survey_count?: number;
	rating_history?: number[];
	createdAt?: Date;
	updatedAt?: Date;
}

interface IUserSkillModel extends Model<IUserSkill> { }

const userSkillSchema = new Schema<IUserSkill, IUserSkillModel>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		sport: {
			type: String,
			required: true,
			trim: true,
		},
		note: {
			type: String,
			trim: true,
		},
		level: {
			type: Number,
			required: true,
		},
		play_frequency: {
			type: Number,
			enum: [1, 2, 3],
			default: 2,
		},
		play_vibe: {
			type: String,
			enum: ["casual", "balanced", "competitive"],
			default: "balanced",
		},
		rating_score: {
			type: Number,
			required: true,
		},
		confidence_score: {
			type: Number,
			required: true,
			default: 50,
			min: 10,
			max: 100,
		},
		survey_count: {
			type: Number,
			required: true,
			default: 0,
		},
		rating_history: {
			type: [Number],
			required: true,
			default: [],
		},
	},
	{
		timestamps: true,
		collection: "user_skills",
	}
);

userSkillSchema.index({ user_id: 1, sport: 1 }, { unique: true });

const UserSkill =
	mongoose.models.UserSkill || mongoose.model<IUserSkill>("UserSkill", userSkillSchema);

export default UserSkill;
