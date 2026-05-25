import cron from "node-cron";
import mongoose from "mongoose";
import WalletTransaction from "../models/walletTransactionModel.js";
import { BookingModel } from "../models/bookingModel.js";
import Wallet from "../models/walletModel.js";

/**
 * Runs every 5 minutes to release pending deposits to court owners
 * once the booking end time has passed.
 */
export function startPayoutCron(): void {
	// Schedule to run every 5 minutes
	cron.schedule("*/5 * * * *", async () => {
		try {
			// Find all pending deposit transactions that are linked to a booking
			const pendingTxs = await WalletTransaction.find({
				type: "deposit",
				status: "pending",
				bookingId: { $exists: true }
			});

			if (pendingTxs.length === 0) {
				return;
			}

			const now = new Date();

			for (const tx of pendingTxs) {
				const session = await mongoose.startSession();
				
				try {
					await session.withTransaction(async () => {
						const booking = await BookingModel.findById(tx.bookingId).session(session);
						
						if (!booking) {
							// If booking is deleted or missing, we mark the transaction as failed
							tx.status = "failed";
							await tx.save({ session });
							return;
						}

						if (booking.status === "cancelled") {
							// The logic in cancelBooking already updates the tx, 
							// so we just ignore it if it's somehow still pending.
							return;
						}

						// Parse booking end time in Vietnam Time (+07:00)
						let bookingDateStr = '';
						if (typeof booking.date === 'string') {
							bookingDateStr = booking.date.split('T')[0];
						} else {
							const d = new Date(booking.date as any);
							const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
							bookingDateStr = vnTime.toISOString().split('T')[0];
						}
						
						const endTimeDate = new Date(`${bookingDateStr}T${booking.end_time}:00+07:00`);

						// If match has ended
						if (endTimeDate < now) {
							const ownerWallet = await Wallet.findById(tx.walletId).session(session);
							if (ownerWallet) {
								// Cộng tiền cho chủ sân
								ownerWallet.balance += tx.amount;
								await ownerWallet.save({ session });

								// Hoàn tất giao dịch
								tx.status = "completed";
								await tx.save({ session });
							}
						}
					});
				} catch (err) {
					console.error(`[Payout Cron] Lỗi xử lý giao dịch ${tx._id}:`, err);
				} finally {
					await session.endSession();
				}
			}

		} catch (error) {
			console.error("[Payout Cron] Lỗi khi chạy cron job:", error);
		}
	});
	
	console.log("[Cron] Owner payout cron job started.");
}
