import { Router } from "express";
import {
	forgotPassword,
	login,
	loginWithGoogle,
	register,
	resetPassword,
	createAdmin,
} from "../controllers/authController.js";
import {
	forgotPasswordRateLimiter,
	resetPasswordRateLimiter,
} from "../middleware/rateLimit.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google", loginWithGoogle);
authRoutes.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
authRoutes.post("/reset-password", resetPasswordRateLimiter, resetPassword);
authRoutes.post("/create-admin", createAdmin);

export default authRoutes;
