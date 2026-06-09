import { Request, Response } from "express";
import { IUserRole } from "../models/userModel.js";
import Report from "../models/reportModel.js";
import User from "../models/userModel.js";

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
	address?: string;
	userName: string;
	role?: IUserRole;
	createdAt?: Date;
	points?: number;
	xp?: number;
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
		address: user.address?.trim() || "",
		userName: user.userName,
		role,
		redirectPath: resolveRedirectPathByRole(role),
		createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
		points: user.points ?? 0,
		xp: user.xp ?? 0,
	};
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
		const user = req.user!;

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
		const user = req.user!;
		const { name, phone, dateOfBirth, avatarUrl, address } = req.body as {
			name?: string;
			phone?: string;
			dateOfBirth?: string;
			avatarUrl?: string;
			address?: string;
		};

		const normalizedName = normalizeOptionalText(name);
		const normalizedPhone = normalizeOptionalText(phone);
		const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);
		const normalizedAddress = normalizeOptionalText(address);
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

		if (address !== undefined) {
			const nextAddress = normalizedAddress ?? undefined;
			if (user.address !== nextAddress) {
				user.address = nextAddress;
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
			if (normalizedAvatarUrl && normalizedAvatarUrl.length > 5_000_000) {
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

export async function getMyReports(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
		const reports = await Report.find({
			target_id: user._id,
			target_type: "user",
		})
		.populate({
			path: "reporter_id",
			select: "name userName avatarUrl",
			model: User,
		})
		.sort({ createdAt: -1 });

		res.status(200).json({
			message: "my reports loaded successfully",
			reports,
		});
	} catch (error: unknown) {
		console.error("getMyReports error:", error);
		res.status(500).json({
			message: "failed to load reports",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function appealReport(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
		const { reportId } = req.params;
		const { appealDescription } = req.body as { appealDescription: string };

		if (!appealDescription || !appealDescription.trim()) {
			res.status(400).json({
				message: "Nội dung kháng cáo không được để trống",
			});
			return;
		}

		const report = await Report.findOne({
			_id: reportId,
			target_id: user._id,
			target_type: "user",
		});

		if (!report) {
			res.status(404).json({
				message: "Không tìm thấy đơn tố cáo hoặc bạn không có quyền kháng cáo đơn này",
			});
			return;
		}

		if (report.appeal_description) {
			res.status(400).json({
				message: "Bạn đã kháng cáo đơn tố cáo này rồi",
			});
			return;
		}

		report.appeal_description = appealDescription.trim();
		report.appeal_created_at = new Date();
		await report.save();

		res.status(200).json({
			message: "Gửi kháng cáo đến Admin thành công!",
			report,
		});
	} catch (error: unknown) {
		console.error("appealReport error:", error);
		res.status(500).json({
			message: "Gửi kháng cáo thất bại",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}