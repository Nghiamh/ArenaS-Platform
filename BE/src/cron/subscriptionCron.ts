import cron from "node-cron";
import Subscription from "../models/subscriptionModel.js";

/**
 * Initializes and schedules the background cron task to automatically expire subscriptions.
 * Schedule: Runs daily at midnight (`0 0 * * *`).
 *
 * Logic:
 * - Queries active subscriptions whose end date is past or equal to the current server time.
 * - Atomically transitions their status to "expired".
 * - Logs telemetry/operation statistics for tracking.
 */
export function startSubscriptionCron(): void {
	// "0 0 * * *" schedules the task to execute every day at exactly 00:00:00 AM server time.
	cron.schedule("0 0 * * *", async () => {
		const now = new Date();
		console.log(`[Subscription Cron] Commencing daily subscription expiry check at: ${now.toISOString()}`);

		try {
			// a) & b) Execute an atomic query to update status of all expired documents to "expired".
			const result = await Subscription.updateMany(
				{
					status: "active",
					endDate: { $lte: now },
				},
				{
					$set: { status: "expired" },
				}
			);

			// c) Log the total number of affected and updated accounts to the console.
			console.log(
				`[Subscription Cron] Execution completed successfully. Matched active expired: ${result.matchedCount}, Successfully transitioned to expired: ${result.modifiedCount}`
			);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "unknown error";
			console.error("[Subscription Cron Error] Critical failure during automatic subscription extinction:", errorMessage);
		}
	});

	console.log("[Subscription Cron] Background schedule initialized successfully (Daily at midnight: '0 0 * * *').");
}
