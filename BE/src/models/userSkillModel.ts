import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUserSkill extends Document {
	user_id: Types.ObjectId;
	sport: string;
	note?: string;
	level: number;
	rating_score: number;
	createdAt?: Date;
	updatedAt?: Date;
}

interface IUserSkillModel extends Model<IUserSkill> {}

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
		rating_score: {
			type: Number,
			required: true,
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
