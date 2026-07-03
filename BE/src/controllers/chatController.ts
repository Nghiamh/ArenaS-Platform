import { Request, Response } from "express";
import ChatMessage from "../models/chatMessageModel.js";
import Match from "../models/matchModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { getIo } from "../services/socketHandler.js";

/**
 * POST /api/chat/:matchId/send
 * REST fallback to send a message when socket is unreliable.
 * Saves to DB and broadcasts via socket if available.
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const { message } = req.body;
		const userId = user._id!.toString();

		if (!message?.trim()) {
			res.status(400).json({ message: "message is required" });
			return;
		}

		const match = await Match.findById(matchId).select("participants");
		if (!match) {
			res.status(404).json({ message: "match_not_found" });
			return;
		}

		const isParticipant = match.participants.some((p: any) => p.toString() === userId);
		if (!isParticipant) {
			res.status(403).json({ message: "forbidden" });
			return;
		}

		const chatMessage = await ChatMessage.create({
			match_id: matchId,
			sender_id: userId,
			message: message.trim(),
		});

		// Broadcast via socket if available
		const io = getIo();
		if (io) {
			io.to(`match:${matchId}`).emit("receive_message", {
				_id: chatMessage._id,
				match_id: matchId,
				sender_id: userId,
				message: chatMessage.message,
				createdAt: chatMessage.createdAt,
			});
		}

		res.status(201).json({
			success: true,
			message: {
				_id: chatMessage._id,
				sender_id: userId,
				message: chatMessage.message,
				createdAt: chatMessage.createdAt,
			},
		});
	} catch (error) {
		console.error("sendMessage REST error:", error);
		res.status(500).json({ message: "internal_error" });
	}
}


/**
 * GET /api/chat/:matchId/history
 * Get chat history for a specific match.
 * Only participants and the court owner can view chat history.
 */
export async function getChatHistory(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const userId = user._id!.toString();

		// select() chỉ fetch các field cần thiết để giảm payload từ MongoDB
		const match = await Match.findById(matchId)
			.select("participants court_id");

		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Check if user is a participant
		const isParticipant = match.participants.some(
			(p: any) => p.toString() === userId
		);

		if (!isParticipant) {
			res.status(403).json({
				message: "forbidden",
				error: "You are not a participant of this match",
			});
			return;
		}

		// Pagination
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
		const skip = (page - 1) * limit;

		// PERF: Chạy song song cả 3 query thay vì tuần tự (tiết kiệm ~1-2 DB round trips)
		const [messages, total, pendingBooking] = await Promise.all([
			ChatMessage.find({ match_id: matchId })
				.sort({ createdAt: 1 })
				.skip(skip)
				.limit(limit)
				.populate("sender_id", "name userName avatarUrl"),
			ChatMessage.countDocuments({ match_id: matchId }),
			BookingModel.findOne({
				match_id: matchId,
				status: "waiting_opponent",
			}).lean(),
		]);

		// Check for pending deposit
		let pending_deposit: {
			bookingId: string;
			amount: number;
			deadline: string;
		} | undefined;

		if (pendingBooking && pendingBooking.participants) {
			const unpaidEntry = pendingBooking.participants.find(
				(p) => p.userId.toString() === userId && p.status === "unpaid"
			);

			if (unpaidEntry) {
				const deadline = pendingBooking.opponent_deadline;
				if (deadline && new Date() < deadline) {
					pending_deposit = {
						bookingId: (pendingBooking._id as any).toString(),
						amount: unpaidEntry.amount,
						deadline: deadline.toISOString(),
					};
				}
			}
		}

		const courtId = match.court_id;
		const courtIdStr = courtId
			? typeof courtId === "object" && "_id" in (courtId as any)
				? (courtId as any)._id.toString()
				: (courtId as any).toString()
			: undefined;

		res.status(200).json({
			success: true,
			messages,
			court_id: courtIdStr,
			pending_deposit,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error: unknown) {
		console.error("getChatHistory error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to get chat history",
		});
	}
}


