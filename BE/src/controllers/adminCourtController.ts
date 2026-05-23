import { Request, Response } from "express";
import mongoose from "mongoose";
import Court, { CourtStatus, ICourtCoordinates, ISubCourt } from "../models/courtModel.js";

// ─── Helpers (mirrored from courtController, kept local to avoid coupling) ────

function toPublicCoordinates(
	coordinates?: ICourtCoordinates,
): { latitude: number; longitude: number } | null {
	if (!coordinates) return null;
	const [longitude, latitude] = coordinates.coordinates;
	return { latitude, longitude };
}

function normalizeCourtStatus(value: unknown): CourtStatus {
	if (value === "available" || value === "closed") return value;
	if (value === "open") return "available";
	return "available";
}

function buildAdminCourtResponse(court: {
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

// ─── GET /api/admin/courts ────────────────────────────────────────────────────
// Admin sees ALL courts regardless of owner or status.
// Query params: status, sport, keyword, page (1-based), limit (default 50)

export async function adminGetAllCourts(req: Request, res: Response): Promise<void> {
	try {
		const { status, sport, keyword, page = "1", limit = "50" } = req.query as Record<string, string>;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const filter: Record<string, any> = {};

		if (status && ["available", "closed", "open"].includes(status)) {
			filter.status = status === "open" ? "available" : status;
		}

		if (sport) {
			filter.sports = { $in: [sport] };
		}

		if (keyword) {
			const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			filter.$or = [
				{ name: { $regex: escaped, $options: "i" } },
				{ location: { $regex: escaped, $options: "i" } },
			];
		}

		const pageNum  = Math.max(1, parseInt(page, 10) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
		const skip     = (pageNum - 1) * limitNum;

		const [courts, total] = await Promise.all([
			Court.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
			Court.countDocuments(filter),
		]);

		res.status(200).json({
			message: "Courts loaded successfully.",
			total,
			page: pageNum,
			limit: limitNum,
			totalPages: Math.ceil(total / limitNum),
			courts: courts.map(buildAdminCourtResponse),
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ message: "Failed to load courts.", error: errorMessage });
	}
}

// ─── POST /api/admin/courts/:id/approve ──────────────────────────────────────
// Approve a pending court → status becomes "available"

export async function adminApproveCourt(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			res.status(400).json({ message: "Invalid court ID.", error: "invalid_id" });
			return;
		}

		const court = await Court.findById(id);
		if (!court) {
			res.status(404).json({ message: "Court not found.", error: "court_not_found" });
			return;
		}

		if (court.status !== "pending") {
			res.status(400).json({ message: "Only pending courts can be approved.", error: "not_pending" });
			return;
		}

		court.status = "available";
		await court.save();

		res.status(200).json({
			message: "Court approved successfully.",
			court: buildAdminCourtResponse(court),
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ message: "Failed to approve court.", error: errorMessage });
	}
}

// ─── POST /api/admin/courts/:id/reject ───────────────────────────────────────
// Reject a pending court → status becomes "closed"

export async function adminRejectCourt(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			res.status(400).json({ message: "Invalid court ID.", error: "invalid_id" });
			return;
		}

		const court = await Court.findById(id);
		if (!court) {
			res.status(404).json({ message: "Court not found.", error: "court_not_found" });
			return;
		}

		if (court.status !== "pending") {
			res.status(400).json({ message: "Only pending courts can be rejected.", error: "not_pending" });
			return;
		}

		court.status = "closed";
		await court.save();

		res.status(200).json({
			message: "Court rejected successfully.",
			court: buildAdminCourtResponse(court),
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ message: "Failed to reject court.", error: errorMessage });
	}
}

// ─── PUT /api/admin/courts/:id/status ────────────────────────────────────────
// Body: { status: "available" | "closed" }

export async function adminUpdateCourtStatus(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			res.status(400).json({ message: "Invalid court ID.", error: "invalid_id" });
			return;
		}

		const { status } = req.body as { status?: unknown };

		if (status !== "available" && status !== "closed" && status !== "pending") {
			res.status(400).json({
				message: "Status must be 'available', 'closed', or 'pending'.",
				error: "invalid_status",
			});
			return;
		}

		const court = await Court.findByIdAndUpdate(
			id,
			{ status: status as CourtStatus },
			{ new: true },
		);

		if (!court) {
			res.status(404).json({ message: "Court not found.", error: "court_not_found" });
			return;
		}

		res.status(200).json({
			message: "Court status updated successfully.",
			court: buildAdminCourtResponse(court),
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ message: "Failed to update court status.", error: errorMessage });
	}
}
