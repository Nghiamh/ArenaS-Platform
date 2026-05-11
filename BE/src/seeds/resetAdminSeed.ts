import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function resetAdminSeed(): Promise<void> {
	if (!MONGODB_URI) {
		throw new Error("Missing MONGODB_URI in environment variables");
	}

	try {
		await mongoose.connect(MONGODB_URI);
		console.log("✅ Connected to MongoDB");

		// Delete existing admin
		const existingAdmin = await User.findOne({ role: "admin" });
		if (existingAdmin) {
			await User.deleteOne({ _id: existingAdmin._id });
			console.log(`✅ Deleted old admin account: ${existingAdmin.userName}`);
		}

		// Create new admin account
		const adminUser = await User.create({
			email: "admin@arena.com",
			userName: "admin",
			name: "Admin",
			password: "admin123", // Will be hashed by mongoose pre-save hook
			role: "admin",
			authProvider: "local",
		});

		console.log("✅ New admin account created successfully!");
		console.log(`   ID: ${adminUser._id}`);
		console.log(`   Email: ${adminUser.email}`);
		console.log(`   Username: ${adminUser.userName}`);
		console.log(`   Role: ${adminUser.role}`);
		console.log("\n🔐 Login Credentials:");
		console.log(`   Username: admin`);
		console.log(`   Password: admin123`);

		await mongoose.connection.close();
	} catch (error) {
		console.error("❌ Error resetting admin account:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

void resetAdminSeed();
