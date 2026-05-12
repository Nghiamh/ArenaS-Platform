import { Router } from "express";
import {
	joinMatchmaking,
	cancelMatchmaking,
	getMatchmakingStatus,
} from "../controllers/matchmakingController.js";
import { requireAuth } from "../middleware/auth.js";

const matchmakingRoutes = Router();

matchmakingRoutes.post("/join", requireAuth, joinMatchmaking);
matchmakingRoutes.post("/cancel", requireAuth, cancelMatchmaking);
matchmakingRoutes.get("/status", requireAuth, getMatchmakingStatus);

export default matchmakingRoutes;
