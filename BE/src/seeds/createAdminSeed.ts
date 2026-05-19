import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdminSeed(): Promise<void> {
	if (!MONGODB_URI) {
		throw new Error("Missing MONGODB_URI in environment variables");
	}

	try {
		await mongoose.connect(MONGODB_URI);
		console.log("✅ Connected to MongoDB");

		// Check if admin already exists
		const existingAdmin = await User.findOne({ role: "admin" });
		if (existingAdmin) {
			console.log("⚠️ Admin account already exists!");
			console.log(`   Email: ${existingAdmin.email}`);
			console.log(`   Username: ${existingAdmin.userName}`);
			await mongoose.connection.close();
			return;
		}

		// Create admin account
		const adminUser = await User.create({
			email: "admin@arena.com",
			userName: "admin",
			name: "Admin",
			password: "admin", // Will be hashed by mongoose pre-save hook
			role: "admin",
			authProvider: "local",
		});

		console.log("✅ Admin account created successfully!");
		console.log(`   ID: ${adminUser._id}`);
		console.log(`   Email: ${adminUser.email}`);
		console.log(`   Username: ${adminUser.userName}`);
		console.log(`   Role: ${adminUser.role}`);
		console.log("\n🔐 Login Credentials:");
		console.log(`   Username: admin`);
		console.log(`   Password: admin`);

		await mongoose.connection.close();
	} catch (error) {
		console.error("❌ Error creating admin account:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

void createAdminSeed();
