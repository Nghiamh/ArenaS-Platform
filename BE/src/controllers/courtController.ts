import { Request, Response } from "express";
import mongoose from "mongoose";
import Court, { CourtStatus, ICourtCoordinates, ISubCourt, SubCourtType, SubCourtStatus } from "../models/courtModel.js";


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

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function parseQueryNumber(value: unknown, fieldName: string): number {
	const numericValue =
		typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

	if (!Number.isFinite(numericValue)) {
		throw new Error(`invalid_${fieldName}`);
	}

	return numericValue;
}

function normalizeCourtStatus(value: unknown): CourtStatus {
	if (value === undefined || value === null || value === "") {
		return "pending";
	}

	if (value === "available" || value === "closed" || value === "pending") {
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

const VALID_SUB_COURT_TYPES = ["football_5", "football_7", "badminton", "tennis", "pickleball", "other"];
const VALID_SUB_COURT_STATUSES: SubCourtStatus[] = ["open", "closed"];

function parseSubCourts(value: unknown): ISubCourt[] {
	if (value === undefined || value === null) {
		return [];
	}

	if (!Array.isArray(value)) {
		throw new Error("invalid_sub_courts");
	}

	return value.map((item: unknown, idx: number) => {
		if (typeof item !== "object" || item === null) {
			throw new Error(`invalid_sub_courts[${idx}]`);
		}

		const { name, type, surface, price_per_hour, status } = item as Record<string, unknown>;

		if (typeof name !== "string" || !name.trim()) {
			throw new Error(`invalid_sub_courts[${idx}].name`);
		}

		if (!VALID_SUB_COURT_TYPES.includes(type as SubCourtType)) {
			throw new Error(`invalid_sub_courts[${idx}].type`);
		}

		const parsedPrice = typeof price_per_hour === "number" ? price_per_hour : Number(price_per_hour);
		if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
			throw new Error(`invalid_sub_courts[${idx}].price_per_hour`);
		}

		const parsedStatus: SubCourtStatus = VALID_SUB_COURT_STATUSES.includes(status as SubCourtStatus)
			? (status as SubCourtStatus)
			: "open";

		const subCourt: ISubCourt = {
			name: (name as string).trim(),
			type: type as SubCourtType,
			price_per_hour: parsedPrice,
			status: parsedStatus,
		};

		if (typeof surface === "string" && surface.trim()) {
			subCourt.surface = surface.trim();
		}

		return subCourt;
	});
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
	open_time?: string;
	close_time?: string;
	avg_rating: number;
	status: CourtStatus;
	number_of_courts?: number;
	sub_courts?: ISubCourt[];
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
		open_time: court.open_time,
		close_time: court.close_time,
		avg_rating: court.avg_rating,
		status: normalizeCourtStatus(court.status),
		number_of_courts: court.number_of_courts ?? 0,
		sub_courts: court.sub_courts ?? [],
		createdAt: court.createdAt?.toISOString(),
		updatedAt: court.updatedAt?.toISOString(),
	};
}

type CourtAggregate = {
	_id: unknown;
	owner_id: unknown;
	name: string;
	sports: string[];
	price_per_hour: number;
	location: string;
	coordinates?: ICourtCoordinates;
	amenities: string[];
	images: string[];
	open_time?: string;
	close_time?: string;
	avg_rating: number;
	status: CourtStatus;
	number_of_courts?: number;
	sub_courts?: ISubCourt[];
	createdAt?: Date;
	updatedAt?: Date;
	distance_m?: number;
};

function buildSportFilter(sportQuery?: string) {
	if (!sportQuery) {
		return {};
	}

	return {
		sports: { $elemMatch: { $regex: new RegExp(escapeRegex(sportQuery), "i") } },
	};
}

function getCourtIdErrorMessage(error: unknown): string {
	if (error instanceof mongoose.Error.CastError) {
		return "invalid_court_id";
	}

	return error instanceof Error ? error.message : "unknown error";
}

export async function getPublicCourts(req: Request, res: Response): Promise<void> {
	try {
		const sportQuery = normalizeOptionalText(req.query.sport);
		const filters: Record<string, unknown> = {
			status: { $in: ["available", "open"] },
		};

		Object.assign(filters, buildSportFilter(sportQuery));

		const courts = await Court.find(filters).sort({ createdAt: -1 });

		res.status(200).json({
			message: "courts loaded successfully",
			courts: courts.map(buildCourtResponse),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			message: "failed to load courts",
			error: errorMessage,
		});
	}
}

export async function getPublicCourtById(req: Request, res: Response): Promise<void> {
	try {
		const { courtId } = req.params as { courtId?: string };

		if (!courtId) {
			res.status(400).json({ message: "courtId is required" });
			return;
		}

		const court = await Court.findById(courtId);
		if (!court || court.status === "closed" || court.status === "pending") {
			res.status(404).json({ message: "court not found" });
			return;
		}

		res.status(200).json({
			message: "court loaded successfully",
			court: buildCourtResponse(court),
		});
	} catch (error: unknown) {
		const errorMessage = getCourtIdErrorMessage(error);
		res.status(errorMessage === "invalid_court_id" ? 400 : 500).json({
			message: errorMessage === "invalid_court_id" ? "invalid court id" : "failed to load court",
			error: errorMessage,
		});
	}
}

export async function getNearbyCourts(req: Request, res: Response): Promise<void> {
	try {
		const lat = parseQueryNumber(req.query.lat, "lat");
		const lng = parseQueryNumber(req.query.lng, "lng");
		const radius = req.query.radius ? parseQueryNumber(req.query.radius, "radius") : 5000;

		if (radius <= 0) {
			throw new Error("invalid_radius");
		}

		const sportQuery = normalizeOptionalText(req.query.sport);
		const query = {
			status: { $in: ["available", "open"] },
			...buildSportFilter(sportQuery),
		};

		const courts = await Court.aggregate([
			{
				$geoNear: {
					near: {
						type: "Point",
						coordinates: [lng, lat],
					},
					distanceField: "distance_m",
					maxDistance: radius,
					spherical: true,
					query,
				},
			},
			{ $sort: { distance_m: 1 } },
		]);

		res.status(200).json({
			message: "courts loaded successfully",
			total: courts.length,
			courts: courts.map((court) => {
				const mapped = buildCourtResponse(court as CourtAggregate);
				return {
					...mapped,
					distance_m: typeof court.distance_m === "number" ? Math.round(court.distance_m) : undefined,
				};
			}),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode = errorMessage.startsWith("invalid_") ? 400 : 500;

		res.status(statusCode).json({
			message: statusCode === 400 ? "invalid query params" : "failed to load courts",
			error: errorMessage,
		});
	}
}

export async function getCourtsByArea(req: Request, res: Response): Promise<void> {
	try {
		const minLng = parseQueryNumber(req.query.minLng, "minLng");
		const minLat = parseQueryNumber(req.query.minLat, "minLat");
		const maxLng = parseQueryNumber(req.query.maxLng, "maxLng");
		const maxLat = parseQueryNumber(req.query.maxLat, "maxLat");
		const sportQuery = normalizeOptionalText(req.query.sport);

		const filters: Record<string, unknown> = {
			status: { $in: ["available", "open"] },
			coordinates: {
				$geoWithin: {
					$box: [
						[minLng, minLat],
						[maxLng, maxLat],
					],
				},
			},
		};

		Object.assign(filters, buildSportFilter(sportQuery));

		const courts = await Court.find(filters).sort({ createdAt: -1 });

		res.status(200).json({
			message: "courts loaded successfully",
			total: courts.length,
			courts: courts.map(buildCourtResponse),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode = errorMessage.startsWith("invalid_") ? 400 : 500;

		res.status(statusCode).json({
			message: statusCode === 400 ? "invalid query params" : "failed to load courts",
			error: errorMessage,
		});
	}
}

export async function getOwnerCourts(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;

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
		const user = req.user!;
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
		const user = req.user!;

		const { name, sports, price_per_hour, location, coordinates, amenities, images, open_time, close_time, sub_courts } = req.body as {
			name?: string;
			sports?: unknown;
			price_per_hour?: number | string;
			location?: string;
			coordinates?: unknown;
			amenities?: unknown;
			images?: unknown;
			open_time?: string;
			close_time?: string;
			sub_courts?: unknown;
		};

		const normalizedName = normalizeRequiredText(name, "name");
		const normalizedSports = normalizeTextArray(sports, "sports");
		const parsedPricePerHour = parsePricePerHour(price_per_hour);
		const normalizedLocation = normalizeRequiredText(location, "location");
		const parsedCoordinates = parseCoordinates(coordinates);
		const normalizedAmenities = amenities === undefined ? [] : normalizeTextArray(amenities, "amenities");
		const normalizedImages = images === undefined ? [] : normalizeTextArray(images, "images");
		const normalizedOpenTime = open_time ? open_time.trim() : "06:00";
		const normalizedCloseTime = close_time ? close_time.trim() : "22:00";
		const parsedSubCourts = parseSubCourts(sub_courts);

		// New courts always start as "pending" — admin must approve before going public
		const createdCourt = await Court.create({
			owner_id: user._id,
			name: normalizedName,
			sports: normalizedSports,
			price_per_hour: parsedPricePerHour,
			location: normalizedLocation,
			coordinates: parsedCoordinates,
			amenities: normalizedAmenities,
			images: normalizedImages,
			open_time: normalizedOpenTime,
			close_time: normalizedCloseTime,
			avg_rating: 0,
			status: "pending",
			number_of_courts: parsedSubCourts.length,
			sub_courts: parsedSubCourts,
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
		const user = req.user!;
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

		const { name, sports, price_per_hour, location, coordinates, amenities, images, open_time, close_time, status, sub_courts } = req.body as {
			name?: string;
			sports?: unknown;
			price_per_hour?: number | string;
			location?: string;
			coordinates?: unknown;
			amenities?: unknown;
			images?: unknown;
			open_time?: string;
			close_time?: string;
			status?: CourtStatus;
			sub_courts?: unknown;
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

		if (open_time !== undefined) {
			const normalizedOpenTime = open_time.trim();
			if (court.open_time !== normalizedOpenTime) {
				court.open_time = normalizedOpenTime;
				shouldSave = true;
			}
		}

		if (close_time !== undefined) {
			const normalizedCloseTime = close_time.trim();
			if (court.close_time !== normalizedCloseTime) {
				court.close_time = normalizedCloseTime;
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

		if (sub_courts !== undefined) {
			const parsedSubCourts = parseSubCourts(sub_courts);
			const currentSubCourts = JSON.stringify(court.sub_courts ?? []);
			const nextSubCourts = JSON.stringify(parsedSubCourts);
			if (currentSubCourts !== nextSubCourts) {
				court.sub_courts = parsedSubCourts;
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
		const user = req.user!;
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