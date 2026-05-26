import { Router } from "express";
import {
	getCurrentUserProfile,
	updateCurrentUserProfile,
	getMyReports,
	appealReport,
} from "../controllers/userProfileController.js";
import { requireAuth } from "../middleware/auth.js";

const userProfileRoutes = Router();

userProfileRoutes.get("/me", requireAuth, getCurrentUserProfile);
userProfileRoutes.put("/me", requireAuth, updateCurrentUserProfile);
userProfileRoutes.get("/me/reports", requireAuth, getMyReports);
userProfileRoutes.post("/me/reports/:reportId/appeal", requireAuth, appealReport);

export default userProfileRoutes;