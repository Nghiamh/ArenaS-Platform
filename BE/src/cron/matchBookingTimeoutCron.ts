import cron from "node-cron";
import mongoose from "mongoose";
import { BookingModel } from "../models/bookingModel.js";
import Wallet from "../models/walletModel.js";
import WalletTransaction from "../models/walletTransactionModel.js";
import Match from "../models/matchModel.js";
import ChatMessage from "../models/chatMessageModel.js";

/**
 * Runs every minute to check for matchmaking bookings where the opponent
 * failed to pay within the 30-minute deadline.
 * If expired: cancel booking, refund 100% to the booker.
 */
export function startMatchBookingTimeoutCron(io?: any): void {
	// Chạy mỗi phút, tại giây thứ 30 (lệch pha với slotLockTimeoutCron chạy lúc :00)
	// để tránh tranh chấp connection pool MongoDB.
	// node-cron v3 hỗ trợ 6 fields: seconds minutes hours day month weekday
	cron.schedule("30 * * * * *", async () => {
		try {
			const now = new Date();

			// Find all bookings waiting for opponent payment that have expired
			const expiredBookings = await BookingModel.find({
				status: "waiting_opponent",
				opponent_deadline: { $lte: now },
			});

			if (expiredBookings.length === 0) return;

			for (const booking of expiredBookings) {
				const session = await mongoose.startSession();
				try {
					await session.withTransaction(async () => {
						// Refresh booking inside transaction
						const freshBooking = await BookingModel.findById(booking._id).session(session);
						if (!freshBooking || freshBooking.status !== "waiting_opponent") return;

						// Cancel the booking
						freshBooking.status = "cancelled";
						await freshBooking.save({ session });

						// Refund 100% to the booker
						const bookerParticipant = freshBooking.participants?.find(p => p.status === "paid");
						if (bookerParticipant) {
							const wallet = await Wallet.findOne({ userId: bookerParticipant.userId }).session(session);
							if (wallet) {
								wallet.balance += bookerParticipant.amount;
								await wallet.save({ session });
								await new WalletTransaction({
									walletId: wallet._id,
									bookingId: freshBooking._id,
									type: "refund",
									amount: bookerParticipant.amount,
									status: "completed",
								}).save({ session });
							}
							bookerParticipant.status = "refunded";
							freshBooking.markModified("participants");
							await freshBooking.save({ session });
						}

						// Mark owner pending deposit as failed
						const pendingOwnerTx = await WalletTransaction.findOne({
							bookingId: freshBooking._id,
							type: "deposit",
							status: "pending",
						}).session(session);
						if (pendingOwnerTx) {
							pendingOwnerTx.status = "failed";
							await pendingOwnerTx.save({ session });
						}

						// Free court slots
						const { CourtSlotModel } = await import("../models/courtSlotModel.js");
						const { CourtDashboardModel } = await import("../models/courtDashboardModel.js");
						const courtSlot = await CourtSlotModel.findOne({
							court_id: freshBooking.court_id,
							sub_court_id: freshBooking.sub_court_id,
							date: freshBooking.date,
						}).session(session);

						if (courtSlot) {
							let slotsFreed = 0;
							courtSlot.slots.forEach((s: any) => {
								if (s.start >= freshBooking.start_time && s.end <= freshBooking.end_time && s.status === "booked") {
									s.status = "available";
									slotsFreed++;
								}
							});
							courtSlot.markModified("slots");
							await courtSlot.save({ session });

							if (slotsFreed > 0) {
								const targetDate = new Date(freshBooking.date as any);
								targetDate.setHours(0, 0, 0, 0);
								await CourtDashboardModel.updateOne(
									{ court_id: freshBooking.court_id, sub_court_id: freshBooking.sub_court_id, date: targetDate },
									{ $inc: { available_slots: slotsFreed } },
									{ session }
								);
							}
						}

						// Chat notify + socket
						if (freshBooking.match_id) {
							const match = await Match.findById(freshBooking.match_id).session(session);
							if (match) {
								const Court = (await import("../models/courtModel.js")).default;
								const court = await Court.findById(freshBooking.court_id).session(session);
								const courtName = court?.name || "Sân";

								const newMsg = new ChatMessage({
									match_id: freshBooking.match_id,
									sender_id: bookerParticipant?.userId,
									message: `⏰ Hết thời hạn thanh toán (30 phút). Đặt sân "${courtName}" đã bị huỷ tự động.\nTiền cọc đã được hoàn 100%.`,
								});
								await newMsg.save({ session });

								// Clear scheduled_at
								match.scheduled_at = undefined;
								await match.save({ session });

								if (io) {
									io.to(`match:${freshBooking.match_id}`).emit("receive_message", {
										_id: newMsg._id,
										match_id: freshBooking.match_id.toString(),
										sender_id: bookerParticipant?.userId?.toString() || "",
										message: newMsg.message,
										createdAt: newMsg.createdAt,
									});

									for (const p of match.participants) {
										io.to(`user:${p.toString()}`).emit("court_cancelled", {
											matchId: freshBooking.match_id.toString(),
											cancelledByUserId: "system",
											courtName,
											date: freshBooking.date,
											start_time: freshBooking.start_time,
											end_time: freshBooking.end_time,
											reason: "opponent_timeout",
										});
									}
								}
							}
						}
					});

					console.log(`[MatchBookingTimeout] Cancelled expired booking ${booking._id}`);
				} catch (err) {
					console.error(`[MatchBookingTimeout] Error processing booking ${booking._id}:`, err);
				} finally {
					await session.endSession();
				}
			}
		} catch (error) {
			console.error("[MatchBookingTimeout] Cron error:", error);
		}
	});

	console.log("[Cron] Match booking timeout cron job started (every 1 min).");
}
