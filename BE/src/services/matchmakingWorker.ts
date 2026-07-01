import { Server as SocketServer } from "socket.io";
import MatchmakingTicket, { IMatchmakingTicket } from "../models/matchmakingTicketModel.js";
import Match from "../models/matchModel.js";
import UserSkill, { IUserSkill } from "../models/userSkillModel.js";
import Court, { ICourt } from "../models/courtModel.js";
import ChatMessage from "../models/chatMessageModel.js";
import { Types } from "mongoose";

const WORKER_INTERVAL_MS = 5000;
const TICKET_EXPIRY_MINUTES = 30;

// Dynamic threshold: starts at 95, decreases to 65 over 30 minutes
const THRESHOLD_MAX = 95;
const THRESHOLD_MIN = 65;
const THRESHOLD_RANGE = THRESHOLD_MAX - THRESHOLD_MIN; // 30

/**
 * Mapping between court sport names (English) and user skill sport names (Vietnamese).
 * Court model uses English names; UserSkill model uses Vietnamese names.
 */
const SPORT_NAME_MAP: Record<string, string> = {
	badminton: "Cầu lông",
	football: "Bóng đá",
	tennis: "Tennis",
	pickleball: "Pickleball",
};

function getSkillSportName(ticketSport: string): string {
	return SPORT_NAME_MAP[ticketSport.toLowerCase()] ?? ticketSport;
}

/**
 * Calculate the dynamic match threshold based on how long a ticket has been waiting.
 * - At 0 minutes: 95
 * - At 15 minutes: ~80
 * - At 30 minutes: 65
 */
function calculateDynamicThreshold(waitMinutes: number): number {
	const clampedMinutes = Math.min(waitMinutes, TICKET_EXPIRY_MINUTES);
	const threshold = THRESHOLD_MAX - (clampedMinutes / TICKET_EXPIRY_MINUTES) * THRESHOLD_RANGE;
	return Math.max(threshold, THRESHOLD_MIN);
}

/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
function haversineDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Calculate the match score between two players.
 *
 * Prerequisites: Both players must be queuing for the SAME sport (enforced by grouping).
 *
 * Scoring breakdown (max 100):
 * 1. Level difference (40 points) — closer levels = higher score
 * 2. Rating difference (40 points) — closer ratings = higher score
 * 3. Distance to court (20 points) — closer to court = higher score (average of both)
 */
export function calculateMatchScore(
	skillA: IUserSkill | null,
	skillB: IUserSkill | null,
	locationA: [number, number], // [lng, lat]
	locationB: [number, number], // [lng, lat]
	courtCoordinates?: [number, number] // [lng, lat]
): number {
	let score = 0;

	// --- 1. Level difference (40 points) ---
	// If either skill is missing, give a neutral score (20/40)
	if (skillA && skillB) {
		const maxLevel = 5; // Level ranges from 1-5 (per ALLOWED_SKILL_LEVELS)
		const levelDiff = Math.abs(skillA.level - skillB.level);
		const levelScore = Math.max(0, 1 - levelDiff / maxLevel) * 40;
		score += levelScore;
	} else {
		score += 20; // Neutral score when skill data is unavailable
	}

	// --- 2. Rating difference (40 points) ---
	if (skillA && skillB) {
		const maxRating = 5; // Assuming rating ranges from 0-5
		const ratingDiff = Math.abs(skillA.rating_score - skillB.rating_score);
		const ratingScore = Math.max(0, 1 - ratingDiff / maxRating) * 40;
		score += ratingScore;
	} else {
		score += 20; // Neutral score
	}

	// --- 3. Distance to court (20 points) ---
	// Average distance of both players to the court; closer = higher score
	if (courtCoordinates) {
		const distA = haversineDistance(
			locationA[1],
			locationA[0],
			courtCoordinates[1],
			courtCoordinates[0]
		);
		const distB = haversineDistance(
			locationB[1],
			locationB[0],
			courtCoordinates[1],
			courtCoordinates[0]
		);
		const avgDist = (distA + distB) / 2;

		// 0 km = 20 points, 50+ km = 0 points (linear scale)
		const maxDistKm = 50;
		const distScore = Math.max(0, 1 - avgDist / maxDistKm) * 20;
		score += distScore;
	} else {
		score += 10; // Neutral when no court coordinates
	}

	return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Process all WAITING tickets and attempt to match pairs.
 * PERFORMANCE: Batch-fetches all skills and courts upfront to avoid N+1 queries.
 */
async function processMatchmaking(io: SocketServer): Promise<void> {
	try {
		// 1. Expire old tickets
		const now = new Date();
		await MatchmakingTicket.updateMany(
			{ status: "WAITING", expires_at: { $lte: now } },
			{ status: "EXPIRED" }
		);

		// 2. Fetch all WAITING tickets
		const waitingTickets = await MatchmakingTicket.find({ status: "WAITING" })
			.sort({ createdAt: 1 }) // Oldest first (priority)
			.lean<IMatchmakingTicket[]>();

		if (waitingTickets.length < 2) {
			return; // Need at least 2 tickets to match
		}

		// 3. PERF: Batch-fetch all unique sports across all tickets
		const uniqueSports = [...new Set(waitingTickets.map(t => getSkillSportName(t.sport)))];
		const uniqueUserIds = [...new Set(waitingTickets.map(t => t.user_id.toString()))];

		// Single query to get ALL skills for ALL waiting users across ALL relevant sports
		const allSkills = await UserSkill.find({
			user_id: { $in: uniqueUserIds },
			sport: { $in: uniqueSports },
		}).lean<IUserSkill[]>();

		// Build an in-memory Map for O(1) skill lookup: "userId:sport" -> IUserSkill
		const skillMap = new Map<string, IUserSkill>();
		for (const skill of allSkills) {
			skillMap.set(`${skill.user_id.toString()}:${skill.sport}`, skill);
		}

		// 4. Group tickets by court_id + sport
		const groups = new Map<string, IMatchmakingTicket[]>();
		for (const ticket of waitingTickets) {
			const courtKey = ticket.court_id?.toString() ?? "any";
			const groupKey = `${courtKey}:${ticket.sport.toLowerCase()}`;

			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey)!.push(ticket);
		}

		// 5. PERF: Batch-fetch all unique courts needed for scoring
		const uniqueCourtIds = [...new Set(
			[...groups.keys()]
				.map(k => k.split(":")[0])
				.filter(id => id !== "any")
		)];
		const courts = uniqueCourtIds.length > 0
			? await Court.find({ _id: { $in: uniqueCourtIds } }).lean<ICourt[]>()
			: [];
		const courtMap = new Map<string, ICourt>();
		for (const c of courts) {
			courtMap.set((c._id as Types.ObjectId).toString(), c);
		}

		// 6. Process each group
		for (const [groupKey, tickets] of groups) {
			if (tickets.length < 2) {
				continue;
			}

			// Lookup court from cache — no extra DB query
			const courtIdStr = groupKey.split(":")[0];
			const court: ICourt | null = courtIdStr !== "any"
				? (courtMap.get(courtIdStr) ?? null)
				: null;

			// Track which tickets have been matched in this cycle
			const matchedTicketIds = new Set<string>();

			// Try to match pairs (oldest-first priority)
			for (let i = 0; i < tickets.length; i++) {
				const ticketA = tickets[i];
				const ticketIdA = (ticketA._id as Types.ObjectId).toString();

				if (matchedTicketIds.has(ticketIdA)) {
					continue;
				}

				// Calculate wait time for ticketA (the older one)
				const waitMs = now.getTime() - (ticketA.createdAt?.getTime() ?? now.getTime());
				const waitMinutes = waitMs / 60000;
				const threshold = calculateDynamicThreshold(waitMinutes);

				// Lookup skillA from in-memory cache — zero DB query
				const skillSportName = getSkillSportName(ticketA.sport);
				const skillA = skillMap.get(`${ticketA.user_id.toString()}:${skillSportName}`) ?? null;

				const courtCoords = court?.coordinates?.coordinates as [number, number] | undefined;

				for (let j = i + 1; j < tickets.length; j++) {
					const ticketB = tickets[j];
					const ticketIdB = (ticketB._id as Types.ObjectId).toString();

					if (matchedTicketIds.has(ticketIdB)) {
						continue;
					}

					// Lookup skillB from in-memory cache — zero DB query
					const skillB = skillMap.get(`${ticketB.user_id.toString()}:${skillSportName}`) ?? null;

					// Calculate match score
					const score = calculateMatchScore(
						skillA,
						skillB,
						ticketA.location.coordinates,
						ticketB.location.coordinates,
						courtCoords
					);

					if (score >= threshold) {
						// MATCH FOUND! Process the match
						await createMatch(
							io,
							ticketA,
							ticketB,
							court,
							score
						);

						matchedTicketIds.add(ticketIdA);
						matchedTicketIds.add(ticketIdB);
						break; // Move to next ticketA
					}
				}
			}
		}
	} catch (error: unknown) {
		console.error("Matchmaking worker error:", error);
	}
}

/**
 * Create a match from two matched tickets.
 */
async function createMatch(
	io: SocketServer,
	ticketA: IMatchmakingTicket,
	ticketB: IMatchmakingTicket,
	court: ICourt | null,
	score: number
): Promise<void> {
	// Determine court_id (prefer ticketA's court, then ticketB's)
	const courtId = ticketA.court_id ?? ticketB.court_id;
	if (!courtId) {
		console.warn("Cannot create match: no court_id found on either ticket");
		return;
	}

	// Fetch court to get owner_id if not already loaded
	const courtDoc = court ?? (await Court.findById(courtId).lean<ICourt>());
	if (!courtDoc) {
		console.warn("Cannot create match: court not found", courtId);
		return;
	}

	// Create the match
	const confirmationDeadline = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes deadline

	const match = await Match.create({
		participants: [ticketA.user_id, ticketB.user_id],
		owner_id: courtDoc.owner_id,
		court_id: courtId,
		sport: ticketA.sport,
		match_score: score,
		accepted_by: [],
		confirmation_deadline: confirmationDeadline,
		status: "PENDING",
	});

	// Update both tickets to MATCHED
	await MatchmakingTicket.updateMany(
		{ _id: { $in: [ticketA._id, ticketB._id] } },
		{
			status: "MATCHED",
			matched_with: null, // Will be set individually below
			match_id: match._id,
		}
	);

	// Set matched_with references
	await MatchmakingTicket.findByIdAndUpdate(ticketA._id, {
		matched_with: ticketB._id,
	});
	await MatchmakingTicket.findByIdAndUpdate(ticketB._id, {
		matched_with: ticketA._id,
	});

	// Populate match for socket emission
	const populatedMatch = await Match.findById(match._id)
		.populate("participants", "name userName avatarUrl")
		.populate("court_id", "name location sports price_per_hour coordinates")
		.populate("owner_id", "name userName")
		.lean();

	// Emit match_found to both players via Socket.IO
	const matchPayload = {
		matchId: match._id,
		match: populatedMatch,
		sport: ticketA.sport,
	};

	const userIdA = ticketA.user_id.toString();
	const userIdB = ticketB.user_id.toString();

	io.to(`user:${userIdA}`).emit("match_found", matchPayload);
	io.to(`user:${userIdB}`).emit("match_found", matchPayload);

	// Also notify the court owner
	const ownerId = courtDoc.owner_id.toString();
	io.to(`user:${ownerId}`).emit("match_found", matchPayload);

	console.log(
		`Match created: ${userIdA} vs ${userIdB} at court ${courtId} (score: ${score})`
	);
}

/**
 * Scan for and expire PENDING matches that have passed their confirmation deadline.
 */
async function expirePendingMatches(io: SocketServer): Promise<void> {
	try {
		const now = new Date();
		// Find pending matches that expired
		const expiredMatches = await Match.find({
			status: "PENDING",
			confirmation_deadline: { $lte: now },
		});

		for (const match of expiredMatches) {
			match.status = "CANCELLED";
			await match.save();

			// Xóa chat messages của match đã hết hạn
			await ChatMessage.deleteMany({ match_id: match._id });

			const participantIds = match.participants.map((id: any) => id.toString());
			const acceptedSet = new Set(match.accepted_by.map((id: any) => id.toString()));

			for (const pId of participantIds) {
				const hasAccepted = acceptedSet.has(pId);

				if (hasAccepted) {
					// Player accepted but match expired (due to other player AFK).
					// Reactivate their ticket.
					const updatedTicket = await MatchmakingTicket.findOneAndUpdate(
						{ user_id: pId, status: "MATCHED", match_id: match._id },
						{
							status: "WAITING",
							matched_with: undefined,
							match_id: undefined,
						},
						{ new: true }
					);

					// Emit match_cancelled socket event to reactivated user
					io.to(`user:${pId}`).emit("match_cancelled", {
						matchId: match._id.toString(),
						reason: "timeout",
						isBackInQueue: true,
						ticket: updatedTicket,
					});
				} else {
					// Player did not accept (AFK / timed out)
					const updatedTicket = await MatchmakingTicket.findOneAndUpdate(
						{ user_id: pId, status: "MATCHED", match_id: match._id },
						{ status: "EXPIRED" },
						{ new: true }
					);

					// Emit match_cancelled socket event to AFK user
					io.to(`user:${pId}`).emit("match_cancelled", {
						matchId: match._id.toString(),
						reason: "timeout",
						isBackInQueue: false,
						ticket: updatedTicket,
					});
				}
			}

			// Also notify court owner
			const ownerId = match.owner_id.toString();
			io.to(`user:${ownerId}`).emit("match_cancelled", {
				matchId: match._id.toString(),
				reason: "timeout",
				isBackInQueue: false,
			});

			console.log(`Match ${match._id} cancelled due to confirmation timeout`);
		}
	} catch (error) {
		console.error("Error in expirePendingMatches worker:", error);
	}
}

/**
 * Start the matchmaking worker that runs every 5 seconds.
 */
export function startMatchmakingWorker(io: SocketServer): void {
	console.log(`Matchmaking worker started (interval: ${WORKER_INTERVAL_MS}ms)`);

	setInterval(() => {
		void processMatchmaking(io);
		void expirePendingMatches(io);
	}, WORKER_INTERVAL_MS);
}
