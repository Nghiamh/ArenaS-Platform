import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
	email: string;
	userName: string;
	password?: string;
	googleId?: string;
	authProvider: "local" | "google";
	comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {}

const userSchema = new Schema<IUser, IUserModel>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		userName: {
			type: String,
			required: true,
			unique: true,
			trim: true,
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
