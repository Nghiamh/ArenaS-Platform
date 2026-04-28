import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Court, { CourtStatus, ICourtCoordinates } from "../models/courtModel.js";
import User, { IUserRole } from "../models/userModel.js";

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

function assertOwnerRole(user: { role?: IUserRole }) {
	if ((user.role ?? "user") !== "owner") {
		throw new Error("courts_disabled_for_role");
	}
}

function normalizeOptionalText(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const normalized = value.trim();
	return normalized || undefined;
}

function normalizeRequiredText(value: unknown, fieldName: string): string {
	const normalized = normalizeOptionalText(value);
	if (!normalized) {
		throw new Error(`invalid_${fieldName}`);
	}

	return normalized;
}

function normalizeTextArray(value: unknown, fieldName: string): string[] {
	if (!Array.isArray(value)) {
		throw new Error(`invalid_${fieldName}`);
	}

	const normalized = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter((item) => item.length > 0);

	if (normalized.length === 0) {
		throw new Error(`invalid_${fieldName}`);
	}

	return normalized;
}

function parsePricePerHour(value: unknown): number {
	const numericValue =
		typeof value === "number"
			? value
			: typeof value === "string"
				? Number(value.trim())
				: Number.NaN;

	if (!Number.isFinite(numericValue) || numericValue < 0) {
		throw new Error("invalid_price_per_hour");
	}

	return numericValue;
}

function normalizeCourtStatus(value: unknown): CourtStatus {
	if (value === undefined || value === null || value === "") {
		return "available";
	}

	if (value === "available" || value === "closed") {
		return value;
	}

	if (value === "open") {
		return "available";
	}

	throw new Error("invalid_status");
}

function parseStatus(value: unknown): CourtStatus {
	return normalizeCourtStatus(value);
}

function parseCoordinates(value: unknown): ICourtCoordinates | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value !== "object") {
		throw new Error("invalid_coordinates");
	}

	const maybeCoordinates = value as {
		type?: unknown;
		coordinates?: unknown;
		latitude?: unknown;
		longitude?: unknown;
	};

	if (maybeCoordinates.type === "Point" && Array.isArray(maybeCoordinates.coordinates)) {
		if (maybeCoordinates.coordinates.length !== 2) {
			throw new Error("invalid_coordinates");
		}

		const [longitude, latitude] = maybeCoordinates.coordinates;
		if (typeof longitude !== "number" || typeof latitude !== "number") {
			throw new Error("invalid_coordinates");
		}

		return {
			type: "Point",
			coordinates: [longitude, latitude],
		};
	}

	if (typeof maybeCoordinates.latitude === "number" && typeof maybeCoordinates.longitude === "number") {
		return {
			type: "Point",
			coordinates: [maybeCoordinates.longitude, maybeCoordinates.latitude],
		};
	}

	throw new Error("invalid_coordinates");
}

function toPublicCoordinates(coordinates?: ICourtCoordinates): { latitude: number; longitude: number } | null {
	if (!coordinates) {
		return null;
	}

	const [longitude, latitude] = coordinates.coordinates;
	return { latitude, longitude };
}

function buildCourtResponse(court: {
	_id: unknown;
	owner_id: unknown;
	name: string;
	sports: string[];
	price_per_hour: number;
	location: string;
	coordinates?: ICourtCoordinates;
	amenities: string[];
	images: string[];
	avg_rating: number;
	status: CourtStatus;
	createdAt?: Date;
	updatedAt?: Date;
}) {
	return {
		id: String(court._id),
		owner_id: String(court.owner_id),
		name: court.name.trim(),
		sports: court.sports,
		price_per_hour: court.price_per_hour,
		location: court.location.trim(),
		coordinates: toPublicCoordinates(court.coordinates),
		amenities: court.amenities,
		images: court.images,
		avg_rating: court.avg_rating,
		status: normalizeCourtStatus(court.status),
		createdAt: court.createdAt?.toISOString(),
		updatedAt: court.updatedAt?.toISOString(),
	};
}

function getCourtIdErrorMessage(error: unknown): string {
	if (error instanceof mongoose.Error.CastError) {
		return "invalid_court_id";
	}

	return error instanceof Error ? error.message : "unknown error";
}

export async function getOwnerCourts(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertOwnerRole(user);

		const courts = await Court.find({ owner_id: user._id }).sort({ createdAt: -1 });

		res.status(200).json({
			message: "owner courts loaded successfully",
			courts: courts.map(buildCourtResponse),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "courts_disabled_for_role"
					? 403
					: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "courts are only available for owner accounts"
						: "failed to load courts",
			error: errorMessage,
		});
	}
}

export async function getOwnerCourtById(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertOwnerRole(user);
		const { courtId } = req.params as { courtId?: string };

		if (!courtId) {
			res.status(400).json({ message: "courtId is required" });
			return;
		}

		const court = await Court.findOne({ _id: courtId, owner_id: user._id });
		if (!court) {
			res.status(404).json({ message: "court not found" });
			return;
		}

		res.status(200).json({
			message: "court loaded successfully",
			court: buildCourtResponse(court),
		});
	} catch (error: unknown) {
		const errorMessage = getCourtIdErrorMessage(error);
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "courts_disabled_for_role"
					? 403
					: errorMessage === "invalid_court_id"
						? 400
						: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "courts are only available for owner accounts"
						: statusCode === 400
							? "invalid court id"
							: "failed to load court",
			error: errorMessage,
		});
	}
}

export async function createOwnerCourt(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertOwnerRole(user);

		const { name, sports, price_per_hour, location, coordinates, amenities, images, status } = req.body as {
			name?: string;
			sports?: unknown;
			price_per_hour?: number | string;
			location?: string;
			coordinates?: unknown;
			amenities?: unknown;
			images?: unknown;
			status?: CourtStatus;
		};

		const normalizedName = normalizeRequiredText(name, "name");
		const normalizedSports = normalizeTextArray(sports, "sports");
		const parsedPricePerHour = parsePricePerHour(price_per_hour);
		const normalizedLocation = normalizeRequiredText(location, "location");
		const parsedCoordinates = parseCoordinates(coordinates);
		const normalizedAmenities = amenities === undefined ? [] : normalizeTextArray(amenities, "amenities");
		const normalizedImages = images === undefined ? [] : normalizeTextArray(images, "images");
		const parsedStatus = parseStatus(status);

		const createdCourt = await Court.create({
			owner_id: user._id,
			name: normalizedName,
			sports: normalizedSports,
			price_per_hour: parsedPricePerHour,
			location: normalizedLocation,
			coordinates: parsedCoordinates,
			amenities: normalizedAmenities,
			images: normalizedImages,
			avg_rating: 0,
			status: parsedStatus,
		});

		res.status(201).json({
			message: "court created successfully",
			court: buildCourtResponse(createdCourt),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const mongooseError = error as { code?: number };

		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "courts_disabled_for_role"
					? 403
					: errorMessage.startsWith("invalid_")
						? 400
						: mongooseError.code === 11000
							? 409
							: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "courts are only available for owner accounts"
						: statusCode === 400
							? "invalid court data"
							: statusCode === 409
								? "court name already exists for this owner"
								: "failed to create court",
			error: errorMessage,
		});
	}
}

export async function updateOwnerCourt(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertOwnerRole(user);
		const { courtId } = req.params as { courtId?: string };

		if (!courtId) {
			res.status(400).json({ message: "courtId is required" });
			return;
		}

		const court = await Court.findOne({ _id: courtId, owner_id: user._id });
		if (!court) {
			res.status(404).json({ message: "court not found" });
			return;
		}

		const { name, sports, price_per_hour, location, coordinates, amenities, images, status } = req.body as {
			name?: string;
			sports?: unknown;
			price_per_hour?: number | string;
			location?: string;
			coordinates?: unknown;
			amenities?: unknown;
			images?: unknown;
			status?: CourtStatus;
		};

		let shouldSave = false;

		if (name !== undefined) {
			const normalizedName = normalizeRequiredText(name, "name");
			if (court.name !== normalizedName) {
				court.name = normalizedName;
				shouldSave = true;
			}
		}

		if (sports !== undefined) {
			const normalizedSports = normalizeTextArray(sports, "sports");
			const currentSports = JSON.stringify(court.sports);
			const nextSports = JSON.stringify(normalizedSports);
			if (currentSports !== nextSports) {
				court.sports = normalizedSports;
				shouldSave = true;
			}
		}

		if (price_per_hour !== undefined) {
			const parsedPricePerHour = parsePricePerHour(price_per_hour);
			if (court.price_per_hour !== parsedPricePerHour) {
				court.price_per_hour = parsedPricePerHour;
				shouldSave = true;
			}
		}

		if (location !== undefined) {
			const normalizedLocation = normalizeRequiredText(location, "location");
			if (court.location !== normalizedLocation) {
				court.location = normalizedLocation;
				shouldSave = true;
			}
		}

		if (coordinates !== undefined) {
			const parsedCoordinates = parseCoordinates(coordinates);
			const currentCoordinates = JSON.stringify(court.coordinates ?? null);
			const nextCoordinates = JSON.stringify(parsedCoordinates ?? null);
			if (currentCoordinates !== nextCoordinates) {
				court.coordinates = parsedCoordinates;
				shouldSave = true;
			}
		}

		if (amenities !== undefined) {
			const normalizedAmenities = normalizeTextArray(amenities, "amenities");
			const currentAmenities = JSON.stringify(court.amenities);
			const nextAmenities = JSON.stringify(normalizedAmenities);
			if (currentAmenities !== nextAmenities) {
				court.amenities = normalizedAmenities;
				shouldSave = true;
			}
		}

		if (images !== undefined) {
			const normalizedImages = normalizeTextArray(images, "images");
			const currentImages = JSON.stringify(court.images);
			const nextImages = JSON.stringify(normalizedImages);
			if (currentImages !== nextImages) {
				court.images = normalizedImages;
				shouldSave = true;
			}
		}

		if (status !== undefined) {
			const parsedStatus = parseStatus(status);
			if (court.status !== parsedStatus) {
				court.status = parsedStatus;
				shouldSave = true;
			}
		}

		if (shouldSave) {
			await court.save();
		}

		res.status(200).json({
			message: "court updated successfully",
			court: buildCourtResponse(court),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const mongooseError = error as { code?: number };
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "courts_disabled_for_role"
					? 403
					: errorMessage === "invalid_court_id"
						? 400
						: errorMessage.startsWith("invalid_")
							? 400
							: mongooseError.code === 11000
								? 409
								: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "courts are only available for owner accounts"
						: statusCode === 400
							? "invalid court data"
							: statusCode === 409
								? "court name already exists for this owner"
								: "failed to update court",
			error: errorMessage,
		});
	}
}

export async function deleteOwnerCourt(req: Request, res: Response): Promise<void> {
	try {
		const user = await findUserFromAuthorizationHeader(req.headers.authorization);
		assertOwnerRole(user);
		const { courtId } = req.params as { courtId?: string };

		if (!courtId) {
			res.status(400).json({ message: "courtId is required" });
			return;
		}

		const court = await Court.findOneAndDelete({ _id: courtId, owner_id: user._id });
		if (!court) {
			res.status(404).json({ message: "court not found" });
			return;
		}

		res.status(200).json({
			message: "court deleted successfully",
			court: buildCourtResponse(court),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: errorMessage === "courts_disabled_for_role"
					? 403
					: errorMessage === "invalid_court_id"
						? 400
						: 500;

		res.status(statusCode).json({
			message:
				statusCode === 401
					? "unauthorized"
					: statusCode === 403
						? "courts are only available for owner accounts"
						: statusCode === 400
							? "invalid court id"
							: "failed to delete court",
			error: errorMessage,
		});
	}
}