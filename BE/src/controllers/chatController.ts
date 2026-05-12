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

		// Check if user is a participant or owner
		const userId = user._id!.toString();
		const isParticipant = match.participants.some(
			(p: any) => p.toString() === userId
		);
		const isOwner = match.owner_id.toString() === userId;

		if (!isParticipant && !isOwner) {
			res.status(403).json({
				message: "forbidden",
				error: "You are not a member of this match",
			});
			return;
		}

		// Check if chat has been fully deleted
		const totalParties = match.participants.length + 1;
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
 * Vote to delete chat history. Requires all 3 parties (2 players + owner) to agree.
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

		// Check if user is a participant or owner
		const userId = user._id!.toString();
		const isParticipant = match.participants.some(
			(p: any) => p.toString() === userId
		);
		const isOwner = match.owner_id.toString() === userId;

		if (!isParticipant && !isOwner) {
			res.status(403).json({
				message: "forbidden",
				error: "You are not a member of this match",
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

		const totalParties = match.participants.length + 1; // 2 players + 1 owner
		const votesNeeded = totalParties - match.chat_deleted_by.length;

		// If all parties have voted, delete the messages
		if (votesNeeded <= 0) {
			await ChatMessage.deleteMany({ match_id: matchId });

			res.status(200).json({
				success: true,
				message: "All parties agreed. Chat history has been deleted.",
				deleted: true,
				votesRemaining: 0,
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: `Vote recorded. ${votesNeeded} more vote(s) needed to delete chat.`,
			deleted: false,
			votesRemaining: votesNeeded,
		});
	} catch (error: unknown) {
		console.error("voteChatDelete error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to process chat deletion vote",
		});
	}
}
