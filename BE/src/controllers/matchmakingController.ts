import { Request, Response } from "express";
import MatchmakingTicket from "../models/matchmakingTicketModel.js";
import Court from "../models/courtModel.js";

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
			.populate("court_id", "name location sports")
			.populate("match_id");

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
