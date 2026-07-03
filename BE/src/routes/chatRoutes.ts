import { Router } from "express";
import { getChatHistory, sendMessage } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";

const chatRoutes = Router();

chatRoutes.get("/:matchId/history", requireAuth, getChatHistory);
chatRoutes.post("/:matchId/send", requireAuth, sendMessage);

export default chatRoutes;
