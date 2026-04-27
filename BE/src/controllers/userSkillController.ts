import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUserRole } from "../models/userModel.js";
import UserSkill from "../models/userSkillModel.js";

const ALLOWED_SKILL_SPORTS = new Set(["Bóng đá", "Tennis", "Pickleball", "Cầu lông"]);
const ALLOWED_SKILL_LEVELS = new Set([1, 2, 3, 4, 5]);
const ALLOWED_SKILL_RATING_SCORES = new Set([1, 2, 3, 4, 5]);

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

function assertSkillOwnerIsRegularUser(user: { role?: IUserRole }) {
	if ((user.role ?? "user") !== "user") {
		throw new Error("skills_disabled_for_role");
	}
}

function normalizeOptionalText(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const normalized = value.trim();
	return normalized || undefined;
}

function normalizeOptionalNote(value: unknown): string | undefined {
	return normalizeOptionalText(value);
}

function parseSkillInteger(
	value: unknown,
	fieldName: "level" | "rating_score",
	allowedValues: Set<number>
): number {
	const numericValue =
		typeof value === "number"
			? value
			: typeof value === "string"
				? Number(value.trim())
				: Number.NaN;

	if (!Number.isInteger(numericValue) || !allowedValues.has(numericValue)) {
		throw new Error(`invalid_${fieldName}`);
	}

	return numericValue;
}

function buildUserSkillResponse(skill: {
	_id: unknown;
	sport: string;
	note?: string;
	level: number;
	rating_score: number;
	createdAt?: Date;
	updatedAt?: Date;
}) {
	return {
		id: String(skill._id),
		sport: skill.sport,
		note: skill.note?.trim() || "",
		level: skill.level,
		rating_score: skill.rating_score,
		createdAt: skill.createdAt?.toISOString(),
		updatedAt: skill.updatedAt?.toISOString(),
	};
}

export async function getCurrentUserSkills(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertSkillOwnerIsRegularUser(user);
		const skills = await UserSkill.find({ user_id: user._id }).sort({ createdAt: -1 });

		res.status(200).json({
			message: "current user skills loaded",
			skills: skills.map(buildUserSkillResponse),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "skills_disabled_for_role"
					? 403
					: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "skills are only available for regular users"
						: "failed to load user skills",
			error: errorMessage,
		});
	}
}

export async function createCurrentUserSkill(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertSkillOwnerIsRegularUser(user);
		const { sport, note, level, rating_score } = req.body as {
			sport?: string;
			note?: string;
			level?: number | string;
			rating_score?: number | string;
		};

		const normalizedSport = normalizeOptionalText(sport);
		if (!normalizedSport || !ALLOWED_SKILL_SPORTS.has(normalizedSport)) {
			res.status(400).json({ message: "sport is invalid" });
			return;
		}

		const parsedLevel = parseSkillInteger(level, "level", ALLOWED_SKILL_LEVELS);
		const parsedRatingScore = parseSkillInteger(rating_score, "rating_score", ALLOWED_SKILL_RATING_SCORES);
		const normalizedNote = normalizeOptionalNote(note);

		const createdSkill = await UserSkill.create({
			user_id: user._id,
			sport: normalizedSport,
			note: normalizedNote,
			level: parsedLevel,
			rating_score: parsedRatingScore,
		});

		res.status(201).json({
			message: "user skill created successfully",
			skill: buildUserSkillResponse(createdSkill),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const mongooseError = error as { code?: number };

		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "skills_disabled_for_role"
					? 403
					: errorMessage === "invalid_level" || errorMessage === "invalid_rating_score" || errorMessage === "sport_is_invalid"
						? 400
						: mongooseError.code === 11000
							? 409
							: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "skills are only available for regular users"
						: statusCode === 400
							? "invalid skill data"
							: statusCode === 409
								? "sport already exists for this user"
								: "failed to create user skill",
			error: errorMessage,
		});
	}
}

export async function updateCurrentUserSkill(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertSkillOwnerIsRegularUser(user);
		const { skillId } = req.params as { skillId?: string };
		const { sport, note, level, rating_score } = req.body as {
			sport?: string;
			note?: string;
			level?: number | string;
			rating_score?: number | string;
		};

		if (!skillId) {
			res.status(400).json({ message: "skillId is required" });
			return;
		}

		const normalizedSport = normalizeOptionalText(sport);
		if (!normalizedSport || !ALLOWED_SKILL_SPORTS.has(normalizedSport)) {
			res.status(400).json({ message: "sport is invalid" });
			return;
		}

		const parsedLevel = parseSkillInteger(level, "level", ALLOWED_SKILL_LEVELS);
		const parsedRatingScore = parseSkillInteger(rating_score, "rating_score", ALLOWED_SKILL_RATING_SCORES);
		const normalizedNote = normalizeOptionalNote(note);

		const skill = await UserSkill.findOne({ _id: skillId, user_id: user._id });
		if (!skill) {
			res.status(404).json({ message: "skill not found" });
			return;
		}

		skill.sport = normalizedSport;
		skill.note = normalizedNote;
		skill.level = parsedLevel;
		skill.rating_score = parsedRatingScore;
		await skill.save();

		res.status(200).json({
			message: "user skill updated successfully",
			skill: buildUserSkillResponse(skill),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const mongooseError = error as { code?: number };

		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "skills_disabled_for_role"
					? 403
					: errorMessage === "invalid_level" || errorMessage === "invalid_rating_score" || errorMessage === "sport_is_invalid"
						? 400
						: mongooseError.code === 11000
							? 409
							: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "skills are only available for regular users"
						: statusCode === 400
							? "invalid skill data"
							: statusCode === 409
								? "sport already exists for this user"
								: "failed to update user skill",
			error: errorMessage,
		});
	}
}

export async function deleteCurrentUserSkill(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertSkillOwnerIsRegularUser(user);
		const { skillId } = req.params as { skillId?: string };

		if (!skillId) {
			res.status(400).json({ message: "skillId is required" });
			return;
		}

		const deletedSkill = await UserSkill.findOneAndDelete({ _id: skillId, user_id: user._id });
		if (!deletedSkill) {
			res.status(404).json({ message: "skill not found" });
			return;
		}

		res.status(200).json({ message: "user skill deleted successfully" });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "skills_disabled_for_role"
					? 403
					: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "skills are only available for regular users"
						: "failed to delete user skill",
			error: errorMessage,
		});
	}
}