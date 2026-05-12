import { Router } from "express";
import { getChatHistory, voteChatDelete } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";

const chatRoutes = Router();

chatRoutes.get("/:matchId/history", requireAuth, getChatHistory);
chatRoutes.post("/:matchId/delete", requireAuth, voteChatDelete);

export default chatRoutes;
