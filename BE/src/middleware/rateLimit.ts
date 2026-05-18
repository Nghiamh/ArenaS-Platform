import rateLimit from "express-rate-limit";

export const forgotPasswordRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: "Too many forgot-password requests. Please try again later.",
	},
});

export const resetPasswordRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: "Too many reset-password attempts. Please try again later.",
	},
});
