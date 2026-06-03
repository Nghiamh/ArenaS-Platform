import { Request, Response } from "express";
import crypto from "crypto";
import User, { IUserRole } from "../models/userModel.js";
import { generateAccessToken } from "../utils/token.js";
import { sendResetPasswordEmail, sendVerificationEmail } from "../utils/gmail.js";

const RESET_PASSWORD_TOKEN_EXPIRES_IN_MS = 15 * 60 * 1000;
const EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;

function isValidPassword(password: string): boolean {
	const minLength = 8;
	const hasUppercase = /[A-Z]/.test(password);
	const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
	return password.length >= minLength && hasUppercase && hasSpecialChar;
}

type GoogleTokenInfo = {
	aud?: string;
	email?: string;
	email_verified?: string;
	name?: string;
	picture?: string;
	sub?: string;
};

type GoogleUserInfo = {
	sub?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function normalizeUserName(userName: string): string {
	return userName.trim().replace(/\s+/g, " ");
}

function createBaseUserName(displayName: string, email: string): string {
	const normalizedDisplayName = normalizeUserName(displayName.normalize("NFKC"));

	if (normalizedDisplayName) {
		return normalizedDisplayName;
	}

	const emailPrefix = email.split("@")[0]?.trim() ?? "user";
	return normalizeUserName(emailPrefix.replace(/[._-]+/g, " ")) || "user";
}

function createLegacyBaseUserName(displayName: string, email: string): string {
	const normalizedDisplayName = displayName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

	if (normalizedDisplayName) {
		return normalizedDisplayName;
	}

	const emailPrefix = email.split("@")[0]?.trim().toLowerCase() ?? "user";
	return emailPrefix.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "user";
}

const ROLE_REDIRECT_PATHS: Record<IUserRole, string> = {
	user: "/home",
	owner: "/owner/dashboard",
	admin: "/admin/dashboard",
};

function resolveRedirectPathByRole(role: IUserRole): string {
	return ROLE_REDIRECT_PATHS[role];
}

async function ensureUniqueUserName(baseUserName: string): Promise<string> {
	const safeBaseUserName = baseUserName || "user";
	let candidate = safeBaseUserName;
	let suffix = 0;

	while (await User.exists({ userName: candidate })) {
		suffix += 1;
		candidate = `${safeBaseUserName}_${suffix}`;
	}

	return candidate;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
	const clientId = process.env.GOOGLE_CLIENT_ID;

	if (!clientId) {
		throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
	}

	const response = await fetch(
		`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
	);

	if (!response.ok) {
		throw new Error("invalid_google_token");
	}

	const payload = (await response.json()) as GoogleTokenInfo;

	if (
		payload.aud !== clientId ||
		!payload.sub ||
		!payload.email ||
		payload.email_verified !== "true"
	) {
		throw new Error("invalid_google_token");
	}

	return payload;
}

async function exchangeGoogleAuthorizationCode(code: string): Promise<GoogleUserInfo> {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const redirectUri =
		process.env.GOOGLE_REDIRECT_URI ?? process.env.FRONTEND_URL ?? process.env.CALLBACK_URL;

	if (!clientId) {
		throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
	}

	if (!clientSecret) {
		throw new Error("Missing GOOGLE_CLIENT_SECRET in environment variables");
	}

	if (!redirectUri) {
		throw new Error("Missing GOOGLE_REDIRECT_URI in environment variables");
	}

	const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
		}),
	});

	if (!tokenResponse.ok) {
		throw new Error("invalid_google_code");
	}

	const tokenPayload = (await tokenResponse.json()) as {
		access_token?: string;
		id_token?: string;
	};

	const accessToken = tokenPayload.access_token;
	if (!accessToken) {
		throw new Error("invalid_google_code");
	}

	const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!userInfoResponse.ok) {
		throw new Error("invalid_google_code");
	}

	const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

	if (!userInfo.sub || !userInfo.email || userInfo.email_verified !== true) {
		throw new Error("invalid_google_code");
	}

	return userInfo;
}

function buildAuthResponse(user: {
	_id: unknown;
	name?: string;
	dateOfBirth?: Date;
	avatarUrl?: string;
	email: string;
	phone?: string;
	userName: string;
	role?: IUserRole;
	createdAt?: Date;
}) {
	const userId = String(user._id);
	const role = user.role ?? "user";
	const redirectPath = resolveRedirectPathByRole(role);
	const name = user.name?.trim() || user.userName;

	return {
		token: generateAccessToken(userId, role),
		redirectPath,
		user: {
			id: userId,
			name,
			dateOfBirth: user.dateOfBirth?.toISOString(),
			avatarUrl: user.avatarUrl?.trim() || "",
			email: user.email,
			phone: user.phone?.trim() || "",
			userName: user.userName,
			role,
			createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
		},
	};
}

function hashResetToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(req: Request, res: Response): Promise<void> {
	try {
		const { email, userName, password } = req.body as {
			email?: string;
			userName?: string;
			password?: string;
		};

		if (!email || !userName || !password) {
			res.status(400).json({
				message: "email, userName and password are required",
			});
			return;
		}

		if (!isValidPassword(password)) {
			res.status(400).json({
				message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ in hoa và 1 ký tự đặc biệt",
			});
			return;
		}

		const { name, phone } = req.body as {
			name?: string;
			phone?: string;
		};
		const normalizedEmail = normalizeEmail(email);
		const normalizedUserName = normalizeUserName(userName);
		const normalizedName = normalizeUserName(name ?? userName);
		const normalizedPhone = phone?.trim() ?? "";

		const existedUser = await User.findOne({
			$or: [{ email: normalizedEmail }, { userName: normalizedUserName }],
		});

		if (existedUser) {
			if (existedUser.authProvider === "local" && existedUser.isEmailVerified === false) {
				// Nếu tồn tại user nhưng chưa xác nhận email -> Xóa user cũ để đăng ký lại
				await User.deleteOne({ _id: existedUser._id });
			} else {
				const conflictField =
					existedUser.email === normalizedEmail ? "email" : "userName";
				res.status(409).json({
					message: `${conflictField} already exists`,
				});
				return;
			}
		}

		const rawToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = hashResetToken(rawToken);
		const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS);

		let createdUser;
		try {
			createdUser = await User.create({
				name: normalizedName,
				email: normalizedEmail,
				phone: normalizedPhone || undefined,
				userName: normalizedUserName,
				password,
				authProvider: "local",
				isEmailVerified: false,
				emailVerificationTokenHash: tokenHash,
				emailVerificationExpiresAt: expiresAt,
			});

			const verificationBaseUrl =
				process.env.RESET_PASSWORD_BASE_URL?.trim() ||
				process.env.FRONTEND_URL?.trim() ||
				"http://localhost:5173";

			const verificationUrl = `${verificationBaseUrl.replace(/\/$/, "")}/verify-email?token=${rawToken}`;
			const preferredLanguage = req.headers["accept-language"];
			const locale = typeof preferredLanguage === "string" && preferredLanguage.toLowerCase().startsWith("en") ? "en" : "vi";

			await sendVerificationEmail({
				toEmail: createdUser.email,
				toName: createdUser.userName,
				verificationUrl,
				locale,
			});

			const authResponse = buildAuthResponse(createdUser);

			res.status(201).json({
				message: "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.",
				status: "pending_verification",
				user: authResponse.user,
				redirectPath: authResponse.redirectPath,
			});
		} catch (error: any) {
			if (createdUser && createdUser._id) {
				await User.deleteOne({ _id: createdUser._id });
			}
			throw error;
		}
	} catch (error: any) {
		console.error("Register error:", error);
		res.status(500).json({
			message: "failed to register",
			error: error?.response?.data || error?.message || String(error),
		});
	}
}

export async function login(req: Request, res: Response): Promise<void> {
	try {
		const { email, userName, identifier, password } = req.body as {
			email?: string;
			userName?: string;
			identifier?: string;
			password?: string;
		};

		if (!password) {
			res.status(400).json({ message: "password is required" });
			return;
		}

		const credential = (identifier ?? email ?? userName)?.trim();
		if (!credential) {
			res.status(400).json({
				message: "email or userName is required",
			});
			return;
		}

		const query = credential.includes("@")
			? { email: normalizeEmail(credential) }
			: { userName: normalizeUserName(credential) };

		const user = await User.findOne(query);
		if (!user) {
			res.status(401).json({ message: "invalid credentials" });
			return;
		}

		const isPasswordCorrect = await user.comparePassword(password);
		if (!isPasswordCorrect) {
			res.status(401).json({ message: "invalid credentials" });
			return;
		}

		if (user.authProvider === "local" && user.isEmailVerified === false && user.emailVerificationTokenHash) {
			res.status(403).json({ message: "Vui lòng xác nhận email trước khi đăng nhập" });
			return;
		}

		const authResponse = buildAuthResponse(user);

		res.status(200).json({
			message: "login successful",
			...authResponse,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "failed to login",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function loginWithGoogle(req: Request, res: Response): Promise<void> {
	try {
		const { code, credential, idToken } = req.body as {
			code?: string;
			credential?: string;
			idToken?: string;
		};

		const authorizationCode = code ?? credential ?? idToken;
		if (!authorizationCode) {
			res.status(400).json({ message: "Google authorization code is required" });
			return;
		}

		let googleProfile: GoogleUserInfo;

		if (code) {
			googleProfile = await exchangeGoogleAuthorizationCode(code);
		} else {
			const googleTokenProfile = await verifyGoogleIdToken(authorizationCode);
			if (!googleTokenProfile.sub || !googleTokenProfile.email || googleTokenProfile.email_verified !== "true") {
				throw new Error("invalid_google_token");
			}

			googleProfile = {
				sub: googleTokenProfile.sub,
				email: googleTokenProfile.email,
				email_verified: true,
				name: googleTokenProfile.name,
				picture: googleTokenProfile.picture,
			};
		}

		const googleEmail = googleProfile.email;
		if (!googleEmail) {
			throw new Error(code ? "invalid_google_code" : "invalid_google_token");
		}

		const normalizedEmail = normalizeEmail(googleEmail);
		const displayName = googleProfile.name?.trim() || normalizedEmail.split("@")[0] || "user";

		let user = await User.findOne({
			$or: [{ googleId: googleProfile.sub }, { email: normalizedEmail }],
		});

		if (!user) {
			const baseUserName = createBaseUserName(displayName, normalizedEmail);
			const uniqueUserName = await ensureUniqueUserName(baseUserName);

			user = await User.create({
				name: displayName,
				email: normalizedEmail,
				userName: uniqueUserName,
				phone: undefined,
				avatarUrl: googleProfile.picture,
				googleId: googleProfile.sub,
				authProvider: "google",
				isEmailVerified: true,
			});
		} else {
			let shouldSave = false;
			const preferredUserName = createBaseUserName(displayName, normalizedEmail);
			const legacyBaseUserName = createLegacyBaseUserName(displayName, normalizedEmail);

			if (!user.googleId) {
				user.googleId = googleProfile.sub;
				shouldSave = true;
			}

			if (user.authProvider !== "google") {
				user.authProvider = "google";
				shouldSave = true;
			}

			if (user.email !== normalizedEmail) {
				user.email = normalizedEmail;
				shouldSave = true;
			}

			if (!user.name || user.name.trim() !== displayName) {
				user.name = displayName;
				shouldSave = true;
			}

			if (googleProfile.picture && !user.avatarUrl?.trim()) {
				user.avatarUrl = googleProfile.picture;
				shouldSave = true;
			}

			const isLegacyGoogleUserName =
				user.userName === legacyBaseUserName ||
				user.userName.startsWith(`${legacyBaseUserName}_`);

			if (
				user.authProvider === "google" &&
				isLegacyGoogleUserName &&
				user.userName !== preferredUserName
			) {
				const uniqueUserName = await ensureUniqueUserName(preferredUserName);
				user.userName = uniqueUserName;
				shouldSave = true;
			}

			if (shouldSave) {
				await user.save();
			}
		}

		const authResponse = buildAuthResponse(user);

		res.status(200).json({
			message: "google login successful",
			...authResponse,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "invalid_google_token" || errorMessage === "invalid_google_code"
				? 401
				: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401 ? "invalid google credential" : "failed to login with google",
			error: errorMessage,
		});
	}
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
	try {
		const { email } = req.body as { email?: string };

		if (!email) {
			res.status(400).json({ message: "email is required" });
			return;
		}

		const normalizedEmail = normalizeEmail(email);
		const user = await User.findOne({ email: normalizedEmail });

		if (!user) {
			res.status(404).json({
				message: "Email không tồn tại trong hệ thống.",
			});
			return;
		}

		if (!user.password) {
			res.status(400).json({
				message: "Tài khoản này không sử dụng mật khẩu. Vui lòng đăng nhập bằng Google.",
			});
			return;
		}

		const rawToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = hashResetToken(rawToken);
		const expiresAt = new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_IN_MS);

		user.resetPasswordTokenHash = tokenHash;
		user.resetPasswordExpiresAt = expiresAt;
		await user.save();

		const resetBaseUrl =
			process.env.RESET_PASSWORD_BASE_URL?.trim() ||
			process.env.FRONTEND_URL?.trim() ||
			"http://localhost:5173";

		const resetUrl = `${resetBaseUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;
		const preferredLanguage = req.headers["accept-language"];
		const locale = typeof preferredLanguage === "string" && preferredLanguage.toLowerCase().startsWith("en") ? "en" : "vi";

		await sendResetPasswordEmail({
			toEmail: user.email,
			toName: user.userName,
			resetUrl,
			locale,
		});

		res.status(200).json({
			message: "Gửi email đặt lại mật khẩu thành công. Vui lòng kiểm tra hộp thư của bạn.",
		});
	} catch (error: any) {
		console.error("Forgot password error:", error);
		res.status(500).json({
			message: "failed to send reset email",
			error: error?.response?.data || error?.message || String(error),
		});
	}
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
	try {
		const { token, password } = req.body as {
			token?: string;
			password?: string;
		};

		if (!token || !password) {
			res.status(400).json({ message: "token and password are required" });
			return;
		}

		if (!isValidPassword(password)) {
			res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ in hoa và 1 ký tự đặc biệt" });
			return;
		}

		const tokenHash = hashResetToken(token);
		const user = await User.findOne({
			resetPasswordTokenHash: tokenHash,
			resetPasswordExpiresAt: { $gt: new Date() },
		});

		if (!user) {
			res.status(400).json({ message: "invalid or expired reset token" });
			return;
		}

		user.password = password;
		user.resetPasswordTokenHash = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		res.status(200).json({ message: "password reset successful" });
	} catch (error: unknown) {
		res.status(500).json({
			message: "failed to reset password",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
	try {
		const { token } = req.body as { token?: string };

		if (!token) {
			res.status(400).json({ message: "token is required" });
			return;
		}

		const tokenHash = hashResetToken(token);
		const user = await User.findOne({
			emailVerificationTokenHash: tokenHash,
			emailVerificationExpiresAt: { $gt: new Date() },
		});

		if (!user) {
			res.status(400).json({ message: "invalid or expired verification token" });
			return;
		}

		user.isEmailVerified = true;
		user.emailVerificationTokenHash = undefined;
		user.emailVerificationExpiresAt = undefined;
		await user.save();

		res.status(200).json({ message: "Xác nhận email thành công" });
	} catch (error: unknown) {
		res.status(500).json({
			message: "failed to verify email",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
	try {
		const { userName, password, email, name, adminSecret } = req.body as {
			userName?: string;
			password?: string;
			email?: string;
			name?: string;
			adminSecret?: string;
		};

		// Validate admin secret key
		const expectedSecret = process.env.ADMIN_SECRET_KEY;
		if (!expectedSecret || adminSecret !== expectedSecret) {
			res.status(403).json({
				message: "Invalid or missing admin secret key",
			});
			return;
		}

		// Validate required fields
		if (!userName || !password || !email) {
			res.status(400).json({
				message: "userName, password, and email are required",
			});
			return;
		}

		if (!isValidPassword(password)) {
			res.status(400).json({
				message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ in hoa và 1 ký tự đặc biệt",
			});
			return;
		}

		const normalizedEmail = normalizeEmail(email);
		const normalizedUserName = normalizeUserName(userName);
		const normalizedName = normalizeUserName(name ?? userName);

		// Check if user already exists
		const existedUser = await User.findOne({
			$or: [{ email: normalizedEmail }, { userName: normalizedUserName }],
		});

		if (existedUser) {
			const conflictField =
				existedUser.email === normalizedEmail ? "email" : "userName";
			res.status(409).json({
				message: `${conflictField} already exists`,
			});
			return;
		}

		// Check if admin already exists
		const existingAdmin = await User.findOne({ role: "admin" });
		if (existingAdmin) {
			res.status(409).json({
				message: "Admin account already exists",
			});
			return;
		}

		// Create admin user
		const createdAdmin = await User.create({
			name: normalizedName,
			email: normalizedEmail,
			userName: normalizedUserName,
			password,
			role: "admin",
			authProvider: "local",
		});

		const authResponse = buildAuthResponse(createdAdmin);

		res.status(201).json({
			message: "Admin account created successfully",
			...authResponse,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "failed to create admin account",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}
