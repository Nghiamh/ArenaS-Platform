import { Request, Response } from "express";
import mongoose from "mongoose";
import MatchmakingTicket from "../models/matchmakingTicketModel.js";
import Court from "../models/courtModel.js";
import Match from "../models/matchModel.js";
import MatchFeedback from "../models/matchFeedbackModel.js";
import User from "../models/userModel.js";
import UserSkill from "../models/userSkillModel.js";
import Report from "../models/reportModel.js";
import ChatMessage from "../models/chatMessageModel.js";
import { BookingModel } from "../models/bookingModel.js";

const TICKET_EXPIRY_MINUTES = 30;

/**
 * POST /api/matchmaking/join
 * Create a new matchmaking ticket for the authenticated user.
 * Body: { court_id?: string, sport: string, longitude: number, latitude: number }
 */
export async function joinMatchmaking(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { court_id, sport, longitude, latitude } = req.body;

		// Validate required fields
		if (!sport || typeof sport !== "string") {
			res.status(400).json({
				message: "validation_error",
				error: "sport is required",
			});
			return;
		}

		if (typeof longitude !== "number" || typeof latitude !== "number") {
			res.status(400).json({
				message: "validation_error",
				error: "longitude and latitude are required as numbers",
			});
			return;
		}

		// Check if user already has an active WAITING ticket
		const existingTicket = await MatchmakingTicket.findOne({
			user_id: user._id,
			status: "WAITING",
		});

		if (existingTicket) {
			res.status(409).json({
				message: "already_in_queue",
				error: "You already have an active matchmaking ticket",
				ticket: existingTicket,
			});
			return;
		}

		// If court_id is provided, validate the court exists and supports the sport
		if (court_id) {
			const court = await Court.findById(court_id);
			if (!court) {
				res.status(404).json({
					message: "court_not_found",
					error: "The specified court does not exist",
				});
				return;
			}

			const courtSports = court.sports.map((s: string) => s.toLowerCase());
			if (!courtSports.includes(sport.toLowerCase())) {
				res.status(400).json({
					message: "sport_not_available",
					error: `Sport "${sport}" is not available at this court. Available: ${court.sports.join(", ")}`,
				});
				return;
			}
		}

		// Create the ticket
		const expiresAt = new Date(Date.now() + TICKET_EXPIRY_MINUTES * 60 * 1000);

		const ticket = await MatchmakingTicket.create({
			user_id: user._id,
			court_id: court_id || undefined,
			sport: sport.toLowerCase(),
			location: {
				type: "Point",
				coordinates: [longitude, latitude],
			},
			status: "WAITING",
			expires_at: expiresAt,
		});

		res.status(201).json({
			success: true,
			message: "Joined matchmaking queue",
			ticket,
		});
	} catch (error: unknown) {
		console.error("joinMatchmaking error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to join matchmaking",
		});
	}
}

/**
 * POST /api/matchmaking/cancel
 * Cancel the user's current WAITING ticket.
 */
export async function cancelMatchmaking(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const ticket = await MatchmakingTicket.findOneAndUpdate(
			{ user_id: user._id, status: "WAITING" },
			{ status: "CANCELLED" },
			{ new: true }
		);

		if (!ticket) {
			res.status(404).json({
				message: "no_active_ticket",
				error: "No active matchmaking ticket found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Matchmaking cancelled",
			ticket,
		});
	} catch (error: unknown) {
		console.error("cancelMatchmaking error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to cancel matchmaking",
		});
	}
}

/**
 * GET /api/matchmaking/status
 * Get the current matchmaking status for the authenticated user.
 */
export async function getMatchmakingStatus(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const ticket = await MatchmakingTicket.findOne({
			user_id: user._id,
			status: { $in: ["WAITING", "MATCHED"] },
		})
			.sort({ createdAt: -1 })
			.populate("court_id", "name location sports coordinates")
			.populate({
				path: "match_id",
				populate: [
					{ path: "participants", select: "name userName avatarUrl" },
					{ path: "court_id", select: "name location sports price_per_hour coordinates" },
					{ path: "owner_id", select: "name userName" }
				]
			});

		if (ticket && ticket.status === "MATCHED" && ticket.match_id) {
			const m = ticket.match_id as any;
			if (m && (m.status === "COMPLETED" || m.status === "CANCELLED")) {
				// Check if this user has already submitted feedback for this match
				const feedback = await MatchFeedback.findOne({
					match_id: m._id,
					reporter_id: user._id,
				});

				if (feedback || m.status === "CANCELLED") {
					// Clean up the ticket as it is stale
					ticket.status = "CANCELLED";
					await ticket.save();

					res.status(200).json({
						success: true,
						status: "IDLE",
						message: "No active matchmaking ticket",
						ticket: null,
					});
					return;
				}
			}
		}

		if (!ticket) {
			res.status(200).json({
				success: true,
				status: "IDLE",
				message: "No active matchmaking ticket",
				ticket: null,
			});
			return;
		}

		// Calculate wait time
		const waitMs = Date.now() - (ticket.createdAt?.getTime() ?? Date.now());
		const waitMinutes = Math.floor(waitMs / 60000);

		res.status(200).json({
			success: true,
			status: ticket.status,
			ticket,
			waitMinutes,
		});
	} catch (error: unknown) {
		console.error("getMatchmakingStatus error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to get matchmaking status",
		});
	}
}

/**
 * POST /api/matchmaking/match/:matchId/accept
 * Accept a pending match (Double Opt-in).
 */
export async function acceptMatch(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const userId = user._id.toString();

		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Verify user is a participant
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

		// Verify match is PENDING
		if (match.status !== "PENDING") {
			res.status(400).json({
				message: "invalid_match_status",
				error: `Match is already in ${match.status} status`,
			});
			return;
		}

		// Check if already accepted
		const alreadyAccepted = match.accepted_by.some(
			(id: any) => id.toString() === userId
		);

		if (alreadyAccepted) {
			await match.populate([
				{ path: "participants", select: "name userName avatarUrl" },
				{ path: "court_id", select: "name location sports price_per_hour" },
				{ path: "owner_id", select: "name userName" }
			]);
			res.status(200).json({
				success: true,
				message: "You have already accepted this match",
				match,
			});
			return;
		}

		// Record acceptance
		match.accepted_by.push(user._id as any);

		const io = req.app.get("io");

		if (match.accepted_by.length === 2) {
			match.status = "CONFIRMED";
			await match.save();

			const populatedMatch = await Match.findById(match._id)
				.populate("participants", "name userName avatarUrl")
				.populate("court_id", "name location sports price_per_hour coordinates")
				.populate("owner_id", "name userName")
				.lean();

			const matchPayload = {
				matchId: match._id,
				match: populatedMatch,
				sport: match.sport,
			};

			// Emit match_confirmed to both participants
			for (const p of match.participants) {
				io.to(`user:${p.toString()}`).emit("match_confirmed", matchPayload);
			}

			// Also notify the court owner
			io.to(`user:${match.owner_id.toString()}`).emit("match_confirmed", matchPayload);

			res.status(200).json({
				success: true,
				message: "Match successfully confirmed by both players!",
				match: populatedMatch,
			});
		} else {
			await match.save();

			// Notify the opponent
			const opponentId = match.participants
				.find((p: any) => p.toString() !== userId)
				?.toString();

			if (opponentId) {
				io.to(`user:${opponentId}`).emit("player_accepted", {
					matchId: match._id.toString(),
					playerId: userId,
				});
			}

			await match.populate([
				{ path: "participants", select: "name userName avatarUrl" },
				{ path: "court_id", select: "name location sports price_per_hour coordinates" },
				{ path: "owner_id", select: "name userName" }
			]);

			res.status(200).json({
				success: true,
				message: "Accepted, waiting for opponent to accept",
				match,
			});
		}
	} catch (error: unknown) {
		console.error("acceptMatch error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to accept match",
		});
	}
}

/**
 * POST /api/matchmaking/match/:matchId/decline
 * Decline a pending match (Double Opt-in).
 */
export async function declineMatch(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const userId = user._id.toString();

		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Verify user is a participant
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

		// Verify match is PENDING or CONFIRMED (but not scheduled)
		if (match.status !== "PENDING" && match.status !== "CONFIRMED") {
			res.status(400).json({
				message: "invalid_match_status",
				error: `Match is already in ${match.status} status`,
			});
			return;
		}

		if (match.status === "CONFIRMED" && match.scheduled_at) {
			res.status(400).json({
				message: "match_already_scheduled",
				error: `Cannot decline a match that already has a court booked. Please cancel the booking first.`,
			});
			return;
		}

		// Cancel the match
		match.status = "CANCELLED";
		await match.save();

		// Xóa chat messages của match đã huỷ
		await ChatMessage.deleteMany({ match_id: match._id });

		const io = req.app.get("io");

		// Handle both participants' tickets
		const participantIds = match.participants.map((id: any) => id.toString());

		for (const pId of participantIds) {
			if (pId === userId) {
				// The one who declined
				const updatedTicket = await MatchmakingTicket.findOneAndUpdate(
					{ user_id: pId, status: "MATCHED", match_id: match._id },
					{ status: "CANCELLED" },
					{ new: true }
				);

				io.to(`user:${pId}`).emit("match_cancelled", {
					matchId: match._id.toString(),
					reason: "decline",
					isBackInQueue: false,
					ticket: updatedTicket,
				});
			} else {
				// The opponent (put back in queue)
				const updatedTicket = await MatchmakingTicket.findOneAndUpdate(
					{ user_id: pId, status: "MATCHED", match_id: match._id },
					{
						status: "WAITING",
						matched_with: undefined,
						match_id: undefined,
					},
					{ new: true }
				);

				io.to(`user:${pId}`).emit("match_cancelled", {
					matchId: match._id.toString(),
					reason: "decline",
					isBackInQueue: true,
					ticket: updatedTicket,
				});
			}
		}

		// Also notify court owner
		io.to(`user:${match.owner_id.toString()}`).emit("match_cancelled", {
			matchId: match._id.toString(),
			reason: "decline",
			isBackInQueue: false,
		});

		res.status(200).json({
			success: true,
			message: "Match declined and cancelled successfully",
		});
	} catch (error: unknown) {
		console.error("declineMatch error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to decline match",
		});
	}
}

/**
 * POST /api/matchmaking/match/:matchId/check-in
 * Allow a participant to check-in for the match.
 */
export async function checkInMatch(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const userId = user._id.toString();

		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Verify user is a participant
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

		// Verify match is CONFIRMED
		if (match.status !== "CONFIRMED") {
			res.status(400).json({
				message: "invalid_match_status",
				error: `Check-in is only available for CONFIRMED matches. Current status: ${match.status}`,
			});
			return;
		}

		// Add to checked_in_players if not already there
		const alreadyCheckedIn = match.checked_in_players.some(
			(id: any) => id.toString() === userId
		);

		if (!alreadyCheckedIn) {
			match.checked_in_players.push(user._id as any);
			await match.save();

			// Real-time update via Socket
			const io = req.app.get("io");
			const opponentId = match.participants
				.find((p: any) => p.toString() !== userId)
				?.toString();

			if (opponentId) {
				io.to(`user:${opponentId}`).emit("player_checked_in", {
					matchId: match._id.toString(),
					playerId: userId,
				});
			}
		}

		await match.populate([
			{ path: "participants", select: "name userName avatarUrl" },
			{ path: "court_id", select: "name location sports price_per_hour coordinates" },
			{ path: "owner_id", select: "name userName" }
		]);

		res.status(200).json({
			success: true,
			message: "Check-in successful",
			match,
		});
	} catch (error: unknown) {
		console.error("checkInMatch error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to check-in match",
		});
	}
}

/**
 * POST /api/matchmaking/match/:matchId/complete
 * Move match to COMPLETED status if conditions are met.
 */
export async function completeMatch(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const userId = user._id.toString();

		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Verify user is a participant
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

		// Verify match is CONFIRMED
		if (match.status !== "CONFIRMED") {
			if (match.status === "COMPLETED") {
				// Already completed, just return success and the match details
				const populatedMatch = await Match.findById(match._id)
					.populate("participants", "name userName avatarUrl")
					.populate("court_id", "name location sports price_per_hour coordinates")
					.populate("owner_id", "name userName")
					.lean();

				res.status(200).json({
					success: true,
					message: "Match is already marked as completed",
					match: populatedMatch,
				});
				return;
			}

			res.status(400).json({
				message: "invalid_match_status",
				error: `Only CONFIRMED matches can be completed. Current status: ${match.status}`,
			});
			return;
		}

		// Find the booking associated with this match to check the end time
		const booking = await BookingModel.findOne({ match_id: match._id });
		if (!booking) {
			res.status(400).json({
				message: "booking_not_found",
				error: "Cannot complete match because no booking was found for this match.",
			});
			return;
		}

		// Validate time: Can only complete if current time is within 15 minutes of booking end_time or after
		let dateStr = "";
		if (typeof booking.date === "string") {
			dateStr = booking.date.split("T")[0];
		} else {
			const d = new Date(booking.date as any);
			const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
			dateStr = vnTime.toISOString().split("T")[0];
		}
		
		const endDateTime = new Date(`${dateStr}T${booking.end_time}:00+07:00`);
		const now = new Date();
		
		// Allow complete 15 minutes before end time
		const allowedCompleteTime = new Date(endDateTime.getTime() - 15 * 60 * 1000);

		if (now < allowedCompleteTime) {
			res.status(400).json({
				message: "too_early_to_complete",
				error: "You can only complete the match from 15 minutes before the booked time ends.",
			});
			return;
		}

		// Set status to COMPLETED
		match.status = "COMPLETED";
		await match.save();

		// Xóa chat messages sau khi match hoàn thành
		await ChatMessage.deleteMany({ match_id: match._id });

		// Increment completed_matches_count and award points for both participants
		for (const pId of match.participants) {
			await User.findByIdAndUpdate(pId, {
				$inc: { completed_matches_count: 1, points: 20, xp: 30 }
			});
		}

		// Real-time update via Socket to both players
		const io = req.app.get("io");
		const populatedMatch = await Match.findById(match._id)
			.populate("participants", "name userName avatarUrl")
			.populate("court_id", "name location sports price_per_hour coordinates")
			.populate("owner_id", "name userName")
			.lean();

		for (const p of match.participants) {
			io.to(`user:${p.toString()}`).emit("match_completed", {
				matchId: match._id.toString(),
				match: populatedMatch,
			});
		}

		// Also notify court owner
		io.to(`user:${match.owner_id.toString()}`).emit("match_completed", {
			matchId: match._id.toString(),
			match: populatedMatch,
		});

		res.status(200).json({
			success: true,
			message: "Match successfully marked as completed",
			match: populatedMatch,
		});
	} catch (error: unknown) {
		console.error("completeMatch error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to complete match",
		});
	}
}

/**
 * Reputation Engine - Process Blind Reviews
 * Triggered when both players have submitted feedback, or after 24 hours.
 */
async function processMatchRatings(matchId: string): Promise<void> {
	const feedbacks = await MatchFeedback.find({ match_id: matchId, is_processed: false });
	if (feedbacks.length === 0) return;

	const match = await Match.findById(matchId);
	if (!match) return;

	// We only process if both players have submitted, OR if the match completed > 24 hours ago
	const isBothSubmitted = feedbacks.length === 2;
	const isExpired = match.updatedAt && (Date.now() - new Date(match.updatedAt).getTime() > 24 * 60 * 60 * 1000);

	if (!isBothSubmitted && !isExpired) {
		// Keep it blind for now
		return;
	}

	for (const feedback of feedbacks) {
		const targetId = feedback.target_id;
		const sport = feedback.sport;

		// 1. Calculate thô score (0-100) based on review parameters
		// Punctual: Yes = 100, No = 30 (Weight 20%)
		const punctualScore = feedback.punctual ? 100 : 30;
		// Attitude: Friendly = 100, Neutral = 70, Bad = 10 (Weight 30%)
		let attitudeScore = 70;
		if (feedback.attitude === "friendly") attitudeScore = 100;
		if (feedback.attitude === "bad") attitudeScore = 10;
		// Skill Accuracy: Yes = 100, No = 50 (Weight 25%)
		const skillScore = feedback.skill_as_described ? 100 : 50;
		// Play Again: Yes = 100, No = 20 (Weight 25%)
		const playAgainScore = feedback.play_again ? 100 : 20;

		const rawScore = 0.2 * punctualScore + 0.3 * attitudeScore + 0.25 * skillScore + 0.25 * playAgainScore;

		// 2. Outlier Detection
		let weight = 1.0;
		const userSkill = await UserSkill.findOne({ user_id: targetId, sport: sport.toLowerCase() });

		if (userSkill && userSkill.survey_count && userSkill.survey_count >= 3 && userSkill.rating_history && userSkill.rating_history.length > 0) {
			const sum = userSkill.rating_history.reduce((a: number, b: number) => a + b, 0);
			const avgHistory = sum / userSkill.rating_history.length;

			// If historical score is high (avg >= 75 / 100) and this rating is extremely low (raw < 45 / 100), flag as outlier
			if (avgHistory >= 75 && rawScore < 45) {
				weight = 0.2; // Dampen the impact of this toxic rating
				console.log(`[ReputationEngine] Outlier detected for user ${targetId} on match ${matchId}. Weight set to 0.2.`);
			}
		}

		// 3. Update User overall reliability score
		const user = await User.findById(targetId);
		if (user) {
			const currentReliability = user.reliability_score ?? 100;
			// Formula: new = 0.85 * old + 0.15 * punctualScore
			// Plus check-in reward: if user checked in, slight boost (+2)
			// Check-in has been removed from the flow; neutralize its effect on reliability
			const checkInReward = 0;

			const newReliability = Math.max(0, Math.min(100, Math.round(0.85 * currentReliability + 0.15 * punctualScore + checkInReward)));
			user.reliability_score = newReliability;
			await user.save();
		}

		// 4. Update UserSkill rating_score & confidence_score
		if (userSkill) {
			// Update confidence score
			const currentConfidence = userSkill.confidence_score ?? 50;
			let confidenceDelta = 0;
			let skillRatingDelta = 0;

			if (feedback.play_again && feedback.skill_as_described) {
				confidenceDelta = 3;
				skillRatingDelta = 5; // Slight ELO boost for accurate skills
			} else if (!feedback.play_again && !feedback.skill_as_described) {
				confidenceDelta = -1;
				skillRatingDelta = -12; // ELO drop for inaccurate skills
			} else if (feedback.play_again && !feedback.skill_as_described) {
				confidenceDelta = 1;
				skillRatingDelta = 8; // Higher ELO boost if they played really well and want to play again
			}

			const newConfidence = Math.max(10, Math.min(100, currentConfidence + confidenceDelta));
			const newRatingScore = Math.max(100, Math.round(userSkill.rating_score + skillRatingDelta * weight));

			// Save to rating history (cap at 10)
			const history = userSkill.rating_history ?? [];
			history.push(rawScore);
			if (history.length > 10) {
				history.shift();
			}

			userSkill.confidence_score = newConfidence;
			userSkill.rating_score = newRatingScore;
			userSkill.survey_count = (userSkill.survey_count ?? 0) + 1;
			userSkill.rating_history = history;
			await userSkill.save();
		}

		// Mark feedback as processed
		feedback.is_processed = true;
		await feedback.save();
	}
}

/**
 * POST /api/matchmaking/match/:matchId/feedback
 * Submit blind survey for the match opponent.
 */
export async function submitMatchFeedback(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const userId = user._id.toString();
		const { punctual, attitude, skill_as_described, play_again } = req.body;

		// Validation
		if (punctual === undefined || !attitude || skill_as_described === undefined || play_again === undefined) {
			res.status(400).json({
				message: "validation_error",
				error: "All feedback fields (punctual, attitude, skill_as_described, play_again) are required",
			});
			return;
		}

		if (!["friendly", "neutral", "bad"].includes(attitude)) {
			res.status(400).json({
				message: "validation_error",
				error: "attitude must be friendly, neutral, or bad",
			});
			return;
		}

		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Match must be COMPLETED to submit feedback
		if (match.status !== "COMPLETED") {
			res.status(400).json({
				message: "invalid_match_status",
				error: `Feedback can only be submitted for COMPLETED matches. Current status: ${match.status}`,
			});
			return;
		}

		// Verify user is a participant
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

		// Note: check-in is no longer required to submit feedback.

		// Get target opponent ID
		const targetId = match.participants
			.find((p: any) => p.toString() !== userId)
			?.toString();

		if (!targetId) {
			res.status(400).json({
				message: "opponent_not_found",
				error: "Could not identify opponent for feedback",
			});
			return;
		}

		// Check if already submitted feedback
		const existingFeedback = await MatchFeedback.findOne({
			match_id: match._id,
			reporter_id: user._id,
		});

		if (existingFeedback) {
			res.status(409).json({
				message: "already_feedbacked",
				error: "You have already submitted feedback for this match",
			});
			return;
		}

		// Create feedback
		const feedback = await MatchFeedback.create({
			match_id: match._id,
			reporter_id: user._id,
			target_id: new mongoose.Types.ObjectId(targetId),
			sport: match.sport,
			punctual,
			attitude,
			skill_as_described,
			play_again,
			is_processed: false,
		});

		// Clean up the ticket for the reporter
		await MatchmakingTicket.findOneAndUpdate(
			{ user_id: user._id, match_id: match._id, status: "MATCHED" },
			{ status: "CANCELLED" }
		);

		// Gamification Rewards: Award +10 XP and +5 points to the reporter immediately!
		const currentXP = user.xp ?? 0;
		const currentPoints = user.points ?? 0;
		const currentReliability = user.reliability_score ?? 100;

		await User.findByIdAndUpdate(user._id, {
			$inc: { xp: 10, points: 5 },
			// Also reward active community participation by restoring 1% reliability up to 100%
			$set: { reliability_score: Math.min(100, currentReliability + 1) }
		});

		// Trigger reputation calculation
		await processMatchRatings(match._id.toString());

		res.status(201).json({
			success: true,
			message: "Feedback submitted successfully! You received +10 XP and +5 points.",
			feedback,
			rewards: {
				xpGained: 10,
				pointsGained: 5,
				newXp: currentXP + 10,
				newPoints: currentPoints + 5,
			}
		});
	} catch (error: unknown) {
		console.error("submitMatchFeedback error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to submit feedback",
		});
	}
}

/**
 * POST /api/matchmaking/match/:matchId/report
 * Report match opponent and save chat logs snapshot.
 * Body: { reason: string, description: string }
 */
export async function reportOpponent(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		const { matchId } = req.params;
		const userId = user._id.toString();
		const { reason, description, simulatedTimeOffset } = req.body;

		// Validation
		if (!reason || !description) {
			res.status(400).json({
				message: "validation_error",
				error: "Both reason and description are required",
			});
			return;
		}

		const match = await Match.findById(matchId);
		if (!match) {
			res.status(404).json({
				message: "match_not_found",
				error: "Match does not exist",
			});
			return;
		}

		// Verify user is a participant
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

		// Get target opponent ID
		const targetId = match.participants
			.find((p: any) => p.toString() !== userId)
			?.toString();

		if (!targetId) {
			res.status(400).json({
				message: "opponent_not_found",
				error: "Could not identify opponent for report",
			});
			return;
		}

		// If match is not COMPLETED yet, it must be CONFIRMED or PENDING, check AFK rules
		if (match.status !== "COMPLETED") {
			// [REMOVED AS REQUESTED] Bỏ các điều kiện kiểm tra điểm danh và thời gian chờ khi tố cáo
			/*
			// 1. Verify reporter has checked in
			const isReporterCheckedIn = match.checked_in_players.some(
				(id: any) => id.toString() === userId
			);
			if (!isReporterCheckedIn) {
				res.status(400).json({
					message: "reporter_not_checked_in",
					error: "Bạn phải điểm danh tại sân trước mới có thể tố cáo đối thủ vắng mặt.",
				});
				return;
			}

			// 2. Verify opponent has NOT checked in
			const isOpponentCheckedIn = match.checked_in_players.some(
				(id: any) => id.toString() === targetId
			);
			if (isOpponentCheckedIn) {
				res.status(400).json({
					message: "opponent_already_checked_in",
					error: "Đối thủ đã điểm danh thành công, bạn không thể tố cáo vắng mặt.",
				});
				return;
			}

			// 3. Verify match scheduled time (or 15 mins wait time) has passed
			const matchTime = match.scheduled_at
				? new Date(match.scheduled_at).getTime()
				: new Date((match as any).createdAt || Date.now()).getTime() + 15 * 60 * 1000;

			const offset = typeof simulatedTimeOffset === "number" ? simulatedTimeOffset : 0;
			if (Date.now() + offset < matchTime) {
				const waitDiff = Math.ceil((matchTime - (Date.now() + offset)) / 60000);
				res.status(400).json({
					message: "match_time_not_passed",
					error: `Chưa hết giờ hẹn hoặc thời gian chờ tối thiểu. Vui lòng đợi thêm ${waitDiff} phút nữa để điểm danh và báo cáo.`,
				});
				return;
			}
			*/

			// Cancel the match and notify players
			match.status = "CANCELLED";
			await match.save();

			await MatchmakingTicket.updateMany(
				{ match_id: match._id, status: "MATCHED" },
				{ status: "CANCELLED" }
			);

			const io = req.app.get("io");
			if (io) {
				const participantIds = match.participants.map((id: any) => id.toString());
				for (const pId of participantIds) {
					io.to(`user:${pId}`).emit("match_cancelled", {
						matchId: match._id.toString(),
						reason: "report",
						isBackInQueue: false,
					});
				}
			}
		}

		// Fetch chat messages for this match as a snapshot for the admin
		const messages = await ChatMessage.find({ match_id: match._id })
			.sort({ createdAt: 1 })
			.populate("sender_id", "name userName");

		const chat_logs = messages.map((msg) => {
			const sender = msg.sender_id as any;
			return {
				sender_id: sender._id,
				sender_name: sender.name || sender.userName || "Unknown",
				message: msg.message,
				createdAt: msg.createdAt || new Date(),
			};
		});

		// Create Report
		const report = await Report.create({
			reporter_id: user._id,
			target_id: new mongoose.Types.ObjectId(targetId),
			target_type: "user",
			reason,
			description,
			status: "pending",
			chat_logs,
		});

		// Xóa chat messages sau khi đã lưu snapshot vào report
		await ChatMessage.deleteMany({ match_id: match._id });

		// Clean up the ticket for the reporter so they return to IDLE search state cleanly
		await MatchmakingTicket.findOneAndUpdate(
			{ user_id: user._id, match_id: match._id, status: "MATCHED" },
			{ status: "CANCELLED" }
		);

		// Notify the reported player via socket so they can see and appeal
		const ioReport = req.app.get("io");
		if (ioReport) {
			ioReport.to(`user:${targetId}`).emit("player_reported", {
				matchId: match._id.toString(),
				reportId: report._id.toString(),
				reporterName: user.name || user.userName || "Người chơi",
				reason,
				description,
				createdAt: new Date().toISOString(),
			});
		}

		res.status(201).json({
			success: true,
			message: "Report submitted successfully to Admin.",
			report,
		});
	} catch (error: unknown) {
		console.error("reportOpponent error:", error);
		res.status(500).json({
			message: "internal_error",
			error: "Failed to submit report",
		});
	}
}

