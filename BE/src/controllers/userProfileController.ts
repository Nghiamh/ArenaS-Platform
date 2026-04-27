import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUserRole } from "../models/userModel.js";

function resolveRedirectPathByRole(role: IUserRole): string {
	if (role === "owner") {
		return "/owner/dashboard";
	}

	if (role === "admin") {
		return "/admin/dashboard";
	}

	return "/home";
}

function buildUserProfileResponse(user: {
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

	return {
		id: userId,
		name: user.name?.trim() || user.userName,
		dateOfBirth: user.dateOfBirth?.toISOString(),
		avatarUrl: user.avatarUrl?.trim() || "",
		email: user.email,
		phone: user.phone?.trim() || "",
		userName: user.userName,
		role,
		redirectPath: resolveRedirectPathByRole(role),
		createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
	};
}

function parseBearerToken(authorizationHeader: string | undefined): string | null {
	if (!authorizationHeader) {
		return null;
	}

	const [scheme, token] = authorizationHeader.split(" ");
	if (scheme !== "Bearer" || !token) {
		return null;
	}

	return token;
}

async function findUserFromAuthorizationHeader(authorizationHeader: string | undefined) {
	const token = parseBearerToken(authorizationHeader);
	if (!token) {
		throw new Error("missing_token");
	}

	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("Missing JWT_SECRET in environment variables");
	}

	let payload: jwt.JwtPayload;

	try {
		payload = jwt.verify(token, secret) as jwt.JwtPayload;
	} catch (error: unknown) {
		if (error instanceof jwt.JsonWebTokenError) {
			throw new Error("invalid_token");
		}

		throw error;
	}

	const userId = payload.sub;

	if (typeof userId !== "string" || !userId) {
		throw new Error("invalid_token");
	}

	const user = await User.findById(userId);
	if (!user) {
		throw new Error("user_not_found");
	}

	return user;
}

function parseDateOfBirth(value: unknown): Date | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const normalized = value.trim();
	if (!normalized) {
		return undefined;
	}

	const parsed = new Date(normalized);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error("invalid_date_of_birth");
	}

	return parsed;
}

function normalizeOptionalText(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const normalized = value.trim();
	return normalized || undefined;
}

export async function getCurrentUserProfile(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);

		res.status(200).json({
			message: "current user profile loaded",
			user: buildUserProfileResponse(user),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: 500;

		res.status(statusCode).json({
			message: statusCode === 401 ? "unauthorized" : "failed to load profile",
			error: errorMessage,
		});
	}
}

export async function updateCurrentUserProfile(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		const { name, phone, dateOfBirth, avatarUrl } = req.body as {
			name?: string;
			phone?: string;
			dateOfBirth?: string;
			avatarUrl?: string;
		};

		const normalizedName = normalizeOptionalText(name);
		const normalizedPhone = normalizeOptionalText(phone);
		const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);
		let shouldSave = false;

		if (normalizedName && user.name !== normalizedName) {
			user.name = normalizedName;
			shouldSave = true;
		}

		if (phone !== undefined) {
			const nextPhone = normalizedPhone ?? undefined;
			if (user.phone !== nextPhone) {
				user.phone = nextPhone;
				shouldSave = true;
			}
		}

		if (dateOfBirth !== undefined) {
			const nextDate = parsedDateOfBirth;
			const currentValue = user.dateOfBirth?.toISOString() ?? "";
			const nextValue = nextDate?.toISOString() ?? "";

			if (currentValue !== nextValue) {
				user.dateOfBirth = nextDate;
				shouldSave = true;
			}
		}

		if (avatarUrl !== undefined) {
			const normalizedAvatarUrl = normalizeOptionalText(avatarUrl);
			if (normalizedAvatarUrl && normalizedAvatarUrl.length > 2_000_000) {
				throw new Error("avatar_too_large");
			}

			const nextAvatarUrl = normalizedAvatarUrl ?? undefined;
			if (user.avatarUrl !== nextAvatarUrl) {
				user.avatarUrl = nextAvatarUrl;
				shouldSave = true;
			}
		}

		if (shouldSave) {
			await user.save();
		}

		res.status(200).json({
			message: "profile updated successfully",
			user: buildUserProfileResponse(user),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "invalid_date_of_birth" || errorMessage === "avatar_too_large"
				? 400
				:
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 400
						? "invalid profile data"
						: "failed to update profile",
			error: errorMessage,
		});
	}
}