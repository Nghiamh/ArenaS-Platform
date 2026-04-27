import { Router } from "express";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../controllers/userProfileController.js";

const userProfileRoutes = Router();

userProfileRoutes.get("/me", getCurrentUserProfile);
userProfileRoutes.put("/me", updateCurrentUserProfile);

export default userProfileRoutes;