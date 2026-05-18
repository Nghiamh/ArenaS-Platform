import { Router } from "express";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../controllers/userProfileController.js";
import { requireAuth } from "../middleware/auth.js";

const userProfileRoutes = Router();

userProfileRoutes.get("/me", requireAuth, getCurrentUserProfile);
userProfileRoutes.put("/me", requireAuth, updateCurrentUserProfile);

export default userProfileRoutes;