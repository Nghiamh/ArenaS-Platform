import { Request, Response } from "express";
import User from "../models/userModel.js";
import { generateAccessToken } from "../utils/token.js";

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

function buildAuthResponse(user: { _id: unknown; email: string; userName: string }) {
	const userId = String(user._id);

	return {
		token: generateAccessToken(userId),
		user: {
			id: userId,
			email: user.email,
			userName: user.userName,
		},
	};
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

		if (password.length < 6) {
			res.status(400).json({
				message: "password must be at least 6 characters",
			});
			return;
		}

		const normalizedEmail = normalizeEmail(email);
		const normalizedUserName = normalizeUserName(userName);

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

		const createdUser = await User.create({
			email: normalizedEmail,
			userName: normalizedUserName,
			password,
			authProvider: "local",
		});

		const authResponse = buildAuthResponse(createdUser);

		res.status(201).json({
			message: "register successful",
			...authResponse,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "failed to register",
			error: error instanceof Error ? error.message : "unknown error",
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
				email: normalizedEmail,
				userName: uniqueUserName,
				googleId: googleProfile.sub,
				authProvider: "google",
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
