import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type IUserRole = "user" | "owner" | "admin";

export interface IUser extends Document {
	name?: string;
	dateOfBirth?: Date;
	avatarUrl?: string;
	email: string;
	phone?: string;
	address?: string;
	userName: string;
	role: IUserRole;
	isBanned?: boolean;
	password?: string;
	googleId?: string;
	authProvider: "local" | "google";
	resetPasswordTokenHash?: string;
	resetPasswordExpiresAt?: Date;
	xp?: number;
	points?: number;
	reliability_score?: number;
	completed_matches_count?: number;
	canceled_matches_count?: number;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> { }

const userSchema = new Schema<IUser, IUserModel>(
	{
		name: {
			type: String,
			required: false,
			trim: true,
		},
		dateOfBirth: {
			type: Date,
			required: false,
		},
		avatarUrl: {
			type: String,
			required: false,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: String,
			required: false,
			trim: true,
		},
		address: {
			type: String,
			required: false,
			trim: true,
		},
		userName: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		role: {
			type: String,
			required: true,
			default: "user",
			enum: ["user", "owner", "admin"],
		},
		isBanned: {
			type: Boolean,
			required: false,
			default: false,
		},
		password: {
			type: String,
			required: false,
			minlength: 6,
		},
		googleId: {
			type: String,
			unique: true,
			sparse: true,
			trim: true,
		},
		authProvider: {
			type: String,
			required: true,
			default: "local",
			enum: ["local", "google"],
		},
		resetPasswordTokenHash: {
			type: String,
			required: false,
		},
		resetPasswordExpiresAt: {
			type: Date,
			required: false,
		},
		xp: {
			type: Number,
			required: true,
			default: 0,
		},
		points: {
			type: Number,
			required: true,
			default: 0,
		},
		reliability_score: {
			type: Number,
			required: true,
			default: 100,
			min: 0,
			max: 100,
		},
		completed_matches_count: {
			type: Number,
			required: true,
			default: 0,
		},
		canceled_matches_count: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.pre("save", async function hashPassword(next) {
	if (!this.isModified("password")) {
		next();
		return;
	}

	if (!this.password) {
		next();
		return;
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

userSchema.methods.comparePassword = async function comparePassword(
	candidatePassword: string
): Promise<boolean> {
	if (!this.password) {
		return false;
	}

	return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
