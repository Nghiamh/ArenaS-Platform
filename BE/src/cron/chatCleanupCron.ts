import cron from "node-cron";
import ChatMessage from "../models/chatMessageModel.js";
import Match from "../models/matchModel.js";

/**
 * Chạy mỗi giờ, xóa chat messages của các match đã COMPLETED hoặc CANCELLED.
 * Đây là lưới an toàn cho các messages cũ chưa bị xóa.
 */
export function startChatCleanupCron(): void {
	// Chạy mỗi giờ vào phút 30
	cron.schedule("30 * * * *", async () => {
		try {
			// Tìm tất cả match đã kết thúc (COMPLETED hoặc CANCELLED)
			const endedMatches = await Match.find({
				status: { $in: ["COMPLETED", "CANCELLED"] },
			}).select("_id").lean();

			if (endedMatches.length === 0) return;

			const matchIds = endedMatches.map(m => m._id);

			// Xóa tất cả chat messages thuộc các match đã kết thúc
			const result = await ChatMessage.deleteMany({
				match_id: { $in: matchIds },
			});

			if (result.deletedCount > 0) {
				console.log(`[ChatCleanup] Đã xóa ${result.deletedCount} chat messages cũ từ ${endedMatches.length} matches đã kết thúc.`);
			}
		} catch (error) {
			console.error("[ChatCleanup] Cron error:", error);
		}
	});

	console.log("[Cron] Chat cleanup cron job started (every hour at :30).");
}
