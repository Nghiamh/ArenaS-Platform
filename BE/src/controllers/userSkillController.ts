import { Request, Response } from "express";
import UserSkill from "../models/userSkillModel.js";

const ALLOWED_SKILL_SPORTS = new Set(["Bóng đá", "Tennis", "Pickleball", "Cầu lông"]);
const ALLOWED_SKILL_LEVELS = new Set([1, 2, 3, 4, 5]);
const ALLOWED_SKILL_RATING_SCORES = new Set([1, 2, 3, 4, 5]);
const ALLOWED_PLAY_FREQUENCIES = new Set([1, 2, 3]);
const ALLOWED_PLAY_VIBES = new Set(["casual", "balanced", "competitive"]);


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
	play_frequency?: number;
	play_vibe?: string;
	rating_score: number;
	createdAt?: Date;
	updatedAt?: Date;
}) {
	return {
		id: String(skill._id),
		sport: skill.sport,
		note: skill.note?.trim() || "",
		level: skill.level,
		play_frequency: skill.play_frequency ?? 2,
		play_vibe: skill.play_vibe ?? "balanced",
		rating_score: skill.rating_score,
		createdAt: skill.createdAt?.toISOString(),
		updatedAt: skill.updatedAt?.toISOString(),
	};
}

export async function getCurrentUserSkills(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
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
		const user = req.user!;
		const { sport, note, level, rating_score, play_frequency, play_vibe } = req.body as {
			sport?: string;
			note?: string;
			level?: number | string;
			rating_score?: number | string;
			play_frequency?: number | string;
			play_vibe?: string;
		};

		const normalizedSport = normalizeOptionalText(sport);
		if (!normalizedSport || !ALLOWED_SKILL_SPORTS.has(normalizedSport)) {
			res.status(400).json({ message: "sport is invalid" });
			return;
		}

		const parsedLevel = parseSkillInteger(level, "level", ALLOWED_SKILL_LEVELS);
		const parsedRatingScore = parseSkillInteger(rating_score, "rating_score", ALLOWED_SKILL_RATING_SCORES);
		const normalizedNote = normalizeOptionalNote(note);

		// Parse optional play_frequency (default 2)
		let parsedPlayFrequency = 2;
		if (play_frequency !== undefined && play_frequency !== null) {
			const freqNum = typeof play_frequency === "number" ? play_frequency : Number(play_frequency);
			if (ALLOWED_PLAY_FREQUENCIES.has(freqNum)) {
				parsedPlayFrequency = freqNum;
			}
		}

		// Parse optional play_vibe (default "balanced")
		let parsedPlayVibe: string = "balanced";
		if (typeof play_vibe === "string" && ALLOWED_PLAY_VIBES.has(play_vibe.trim())) {
			parsedPlayVibe = play_vibe.trim();
		}

		const createdSkill = await UserSkill.create({
			user_id: user._id,
			sport: normalizedSport,
			note: normalizedNote,
			level: parsedLevel,
			play_frequency: parsedPlayFrequency,
			play_vibe: parsedPlayVibe,
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
		const user = req.user!;
		const { skillId } = req.params as { skillId?: string };
		const { sport, note, level, rating_score, play_frequency, play_vibe } = req.body as {
			sport?: string;
			note?: string;
			level?: number | string;
			rating_score?: number | string;
			play_frequency?: number | string;
			play_vibe?: string;
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

		// Update play_frequency if provided
		if (play_frequency !== undefined && play_frequency !== null) {
			const freqNum = typeof play_frequency === "number" ? play_frequency : Number(play_frequency);
			if (ALLOWED_PLAY_FREQUENCIES.has(freqNum)) {
				skill.play_frequency = freqNum;
			}
		}

		// Update play_vibe if provided
		if (typeof play_vibe === "string" && ALLOWED_PLAY_VIBES.has(play_vibe.trim())) {
			skill.play_vibe = play_vibe.trim() as "casual" | "balanced" | "competitive";
		}

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
		const user = req.user!;
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