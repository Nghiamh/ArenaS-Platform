import cron from "node-cron";
import MatchmakingTicket from "../models/matchmakingTicketModel.js";
import Match from "../models/matchModel.js";

/**
 * Chạy mỗi ngày lúc 02:00 sáng, xóa các ticket đã hoàn thành hoặc hủy.
 *
 * Điều kiện xóa:
 * 1. Ticket status = CANCELLED hoặc EXPIRED (và đã qua hơn 1 ngày kể từ updatedAt)
 * 2. Ticket status = MATCHED nhưng match liên kết đã COMPLETED hoặc CANCELLED
 */
export function startTicketCleanupCron(): void {
	// Mỗi ngày lúc 02:00 sáng
	cron.schedule("0 2 * * *", async () => {
		try {
			const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

			// --- Bước 1: Xóa ticket CANCELLED / EXPIRED cũ hơn 1 ngày ---
			const step1 = await MatchmakingTicket.deleteMany({
				status: { $in: ["CANCELLED", "EXPIRED"] },
				updatedAt: { $lte: oneDayAgo },
			});

			// --- Bước 2: Xóa ticket MATCHED có match đã kết thúc ---
			// Tìm các match đã COMPLETED hoặc CANCELLED
			const endedMatches = await Match.find({
				status: { $in: ["COMPLETED", "CANCELLED"] },
			})
				.select("_id")
				.lean();

			let step2Count = 0;
			if (endedMatches.length > 0) {
				const endedMatchIds = endedMatches.map((m) => m._id);
				const step2 = await MatchmakingTicket.deleteMany({
					status: "MATCHED",
					match_id: { $in: endedMatchIds },
				});
				step2Count = step2.deletedCount;
			}

			const total = step1.deletedCount + step2Count;
			if (total > 0) {
				console.log(
					`[TicketCleanup] Đã xóa ${total} ticket cũ (${step1.deletedCount} CANCELLED/EXPIRED + ${step2Count} MATCHED-done).`
				);
			} else {
				console.log("[TicketCleanup] Không có ticket cũ nào cần xóa.");
			}
		} catch (error) {
			console.error("[TicketCleanup] Cron error:", error);
		}
	});

	console.log("[Cron] Ticket cleanup cron job started (daily at 02:00).");
}
