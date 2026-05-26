import { Router } from "express";
import {
	joinMatchmaking,
	cancelMatchmaking,
	getMatchmakingStatus,
	acceptMatch,
	declineMatch,
	checkInMatch,
	completeMatch,
	submitMatchFeedback,
} from "../controllers/matchmakingController.js";
import { requireAuth } from "../middleware/auth.js";

const matchmakingRoutes = Router();

matchmakingRoutes.post("/join", requireAuth, joinMatchmaking);
matchmakingRoutes.post("/cancel", requireAuth, cancelMatchmaking);
matchmakingRoutes.get("/status", requireAuth, getMatchmakingStatus);
matchmakingRoutes.post("/match/:matchId/accept", requireAuth, acceptMatch);
matchmakingRoutes.post("/match/:matchId/decline", requireAuth, declineMatch);
matchmakingRoutes.post("/match/:matchId/check-in", requireAuth, checkInMatch);
matchmakingRoutes.post("/match/:matchId/complete", requireAuth, completeMatch);
matchmakingRoutes.post("/match/:matchId/feedback", requireAuth, submitMatchFeedback);

export default matchmakingRoutes;
