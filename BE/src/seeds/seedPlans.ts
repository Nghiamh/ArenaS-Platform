/**
 * Seed script: populates the `plans` collection with the four ArenaS tiers.
 *
 * Run with:
 *   npx ts-node --esm src/seeds/seedPlans.ts
 *   (or add an npm script "seed:plans": "ts-node --esm src/seeds/seedPlans.ts")
 */

import "dotenv/config";
import mongoose from "mongoose";
import Plan, { IPlan } from "../models/planModel.js";

const MONGODB_URI = process.env.MONGODB_URI;

const plans: Omit<IPlan, keyof mongoose.Document>[] = [
	{
		name: "starter",
		displayName: "Khởi Nghiệp",
		description: "Dành cho chủ sân mới bắt đầu, muốn trải nghiệm nền tảng.",
		pricing: {
			monthly: 0,
			// yearly is a virtual: Math.round(0 * 12 * 0.83) = 0
		},
		features: {
			max_locations: 1,
			max_courts: 3,
			max_bookings_per_month: 50,
			online_booking: true,
			ai_matchmaking: false,
			api_integration: false,
			analytics_dashboard: false,
			priority_support: false,
			custom_branding: false,
		},
		isCustom: false,
		isActive: true,
		sortOrder: 1,
	},
	{
		name: "basic",
		displayName: "Cơ Bản",
		description: "Phù hợp cho cơ sở thể thao nhỏ đang phát triển.",
		pricing: {
			monthly: 299_000,
			// yearly is a virtual: Math.round(299000 * 12 * 0.83) = 2_978_040
		},
		features: {
			max_locations: 1,
			max_courts: 10,
			max_bookings_per_month: 300,
			online_booking: true,
			ai_matchmaking: false,
			api_integration: false,
			analytics_dashboard: true,
			priority_support: false,
			custom_branding: false,
		},
		isCustom: false,
		isActive: true,
		sortOrder: 2,
	},
	{
		name: "professional",
		displayName: "Chuyên Nghiệp",
		description: "Giải pháp toàn diện cho cơ sở thể thao chuyên nghiệp.",
		pricing: {
			monthly: 799_000,
			// yearly is a virtual: Math.round(799000 * 12 * 0.83) = 7_954_440
		},
		features: {
			max_locations: 5,
			max_courts: 50,
			max_bookings_per_month: -1, // unlimited
			online_booking: true,
			ai_matchmaking: true,
			api_integration: true,
			analytics_dashboard: true,
			priority_support: true,
			custom_branding: false,
		},
		isCustom: false,
		isActive: true,
		sortOrder: 3,
	},
	{
		name: "enterprise",
		displayName: "Doanh Nghiệp",
		description: "Cho hệ thống sân thể thao lớn và tập đoàn quản lý nhiều cơ sở.",
		pricing: {
			monthly: 0, // Negotiated per customer
			// yearly is a virtual: 0
		},
		features: {
			max_locations: -1, // unlimited
			max_courts: -1,    // unlimited
			max_bookings_per_month: -1,
			online_booking: true,
			ai_matchmaking: true,
			api_integration: true,
			analytics_dashboard: true,
			priority_support: true,
			custom_branding: true,
		},
		isCustom: true,
		isActive: true,
		sortOrder: 4,
	},
];

async function seed(): Promise<void> {
	if (!MONGODB_URI) {
		throw new Error("Missing MONGODB_URI in environment variables");
	}

	await mongoose.connect(MONGODB_URI);
	console.log("✅ Connected to MongoDB");

	for (const planData of plans) {
		const existing = await Plan.findOne({ name: planData.name });

		if (existing) {
			// Update features/pricing in place without changing the _id.
			await Plan.findByIdAndUpdate(existing._id, planData, { new: true });
			console.log(`↻  Updated plan: ${planData.displayName}`);
		} else {
			await Plan.create(planData);
			console.log(`✨ Created plan: ${planData.displayName}`);
		}
	}

	console.log("\n🎉 Plan seeding complete!");
	await mongoose.disconnect();
}

void seed().catch((error: unknown) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
