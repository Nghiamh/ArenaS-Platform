import { Request, Response } from "express";
import ChatMessage from "../models/chatMessageModel.js";
import Match from "../models/matchModel.js";

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

		// Verify match exists
		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Check if user is a participant
		const userId = user._id!.toString();
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

		// Check if chat has been fully deleted
		const totalParties = match.participants.length; // only the 2 players
		if (match.chat_deleted_by.length >= totalParties) {
			res.status(200).json({
				success: true,
				messages: [],
				deleted: true,
				message: "Chat history has been deleted",
			});
			return;
		}

		// Pagination
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
		const skip = (page - 1) * limit;

		const [messages, total] = await Promise.all([
			ChatMessage.find({ match_id: matchId })
				.sort({ createdAt: 1 })
				.skip(skip)
				.limit(limit)
				.populate("sender_id", "name userName avatarUrl"),
			ChatMessage.countDocuments({ match_id: matchId }),
		]);

		res.status(200).json({
			success: true,
			messages,
			deleted: false,
			votesRemaining: Math.max(0, totalParties - match.chat_deleted_by.length),
			chat_deleted_by: match.chat_deleted_by.map((id: any) => id.toString()),
			canVote: isParticipant, // only participants can vote, not the court owner
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

/**
 * POST /api/chat/:matchId/delete
 * Vote to delete chat history. Requires all participants (2 players) to agree.
 */
export async function voteChatDelete(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;

		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Only match participants can vote to delete chat (not the court owner)
		const userId = user._id!.toString();
		const isParticipant = match.participants.some(
			(p: any) => p.toString() === userId
		);

		if (!isParticipant) {
			res.status(403).json({
				message: "forbidden",
				error: "Only match participants can vote to delete chat",
			});
			return;
		}

		// Check if user already voted
		const alreadyVoted = match.chat_deleted_by.some(
			(id: any) => id.toString() === userId
		);

		if (alreadyVoted) {
			res.status(409).json({
				message: "already_voted",
				error: "You have already voted to delete chat",
			});
			return;
		}

		// Add user's vote
		match.chat_deleted_by.push(user._id as any);
		await match.save();

		const totalParties = match.participants.length; // 2 players
		const votesNeeded = totalParties - match.chat_deleted_by.length;

		const io = req.app.get("io");

		// If all parties have voted, delete the messages
		if (votesNeeded <= 0) {
			await ChatMessage.deleteMany({ match_id: matchId });

			if (io) {
				io.to(`match:${matchId}`).emit("chat_vote_updated", {
					matchId,
					chat_deleted_by: match.chat_deleted_by.map((id: any) => id.toString()),
					deleted: true,
					votesRemaining: 0,
				});
			}

			res.status(200).json({
				success: true,
				message: "All parties agreed. Chat history has been deleted.",
				deleted: true,
				votesRemaining: 0,
				chat_deleted_by: match.chat_deleted_by.map((id: any) => id.toString()),
			});
			return;
		}

		if (io) {
			io.to(`match:${matchId}`).emit("chat_vote_updated", {
				matchId,
				chat_deleted_by: match.chat_deleted_by.map((id: any) => id.toString()),
				deleted: false,
				votesRemaining: votesNeeded,
			});
		}

		res.status(200).json({
			success: true,
			message: `Vote recorded. ${votesNeeded} more vote(s) needed to delete chat.`,
			deleted: false,
			votesRemaining: votesNeeded,
			chat_deleted_by: match.chat_deleted_by.map((id: any) => id.toString()),
		});
	} catch (error: unknown) {
		console.error("voteChatDelete error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to process chat deletion vote",
		});
	}
}
