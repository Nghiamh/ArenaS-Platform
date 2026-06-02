import { Request, Response } from "express";
import OwnerApplication from "../models/ownerApplicationModel.js";
import User from "../models/userModel.js";

export async function submitOwnerApplication(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;

		if (user.role === "owner" || user.role === "admin") {
			res.status(400).json({ message: "Bạn đã là chủ sân hoặc quản trị viên." });
			return;
		}

		const existing = await OwnerApplication.findOne({ userId: user._id }).sort({ createdAt: -1 });

		if (existing && existing.status === "pending") {
			res.status(400).json({ message: "Hồ sơ của bạn đang chờ duyệt." });
			return;
		}

		if (existing && existing.status === "approved") {
			res.status(400).json({ message: "Hồ sơ của bạn đã được duyệt." });
			return;
		}

		const { businessName, businessAddress, phone, identityCard, bankAccount, description, largeCourts, smallCourts } =
			req.body as {
				businessName?: string;
				businessAddress?: string;
				phone?: string;
				identityCard?: string;
				bankAccount?: string;
				description?: string;
				largeCourts?: number;
				smallCourts?: number;
			};

		if (!businessName || !businessAddress || !phone || !identityCard) {
			res.status(400).json({
				message: "businessName, businessAddress, phone và identityCard là bắt buộc.",
			});
			return;
		}

		if (existing && existing.status === "rejected") {
			existing.businessName = businessName.trim();
			existing.businessAddress = businessAddress.trim();
			existing.phone = phone.trim();
			existing.identityCard = identityCard.trim();
			existing.bankAccount = bankAccount?.trim() || undefined;
			existing.description = description?.trim() || undefined;
			existing.largeCourts = largeCourts !== undefined ? Number(largeCourts) : undefined;
			existing.smallCourts = smallCourts !== undefined ? Number(smallCourts) : undefined;
			existing.status = "pending";
			existing.rejectionReason = undefined;
			await existing.save();

			res.status(200).json({
				message: "Gửi lại hồ sơ thành công. Đang chờ admin duyệt.",
				application: existing,
			});
			return;
		}

		const application = await OwnerApplication.create({
			userId: user._id,
			businessName: businessName.trim(),
			businessAddress: businessAddress.trim(),
			phone: phone.trim(),
			identityCard: identityCard.trim(),
			bankAccount: bankAccount?.trim() || undefined,
			description: description?.trim() || undefined,
			largeCourts: largeCourts !== undefined ? Number(largeCourts) : undefined,
			smallCourts: smallCourts !== undefined ? Number(smallCourts) : undefined,
		});

		res.status(201).json({
			message: "Nộp hồ sơ thành công. Đang chờ admin duyệt.",
			application,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể nộp hồ sơ.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function getMyOwnerApplication(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
		const application = await OwnerApplication.findOne({ userId: user._id }).sort({
			createdAt: -1,
		});

		res.status(200).json({
			message: "ok",
			application: application ?? null,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể lấy thông tin hồ sơ.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function adminGetAllOwnerApplications(req: Request, res: Response): Promise<void> {
	try {
		const { status, page = 1, limit = 20 } = req.query as {
			status?: string;
			page?: string | number;
			limit?: string | number;
		};

		const filter: Record<string, unknown> = {};
		if (status && status !== "all") {
			filter.status = status;
		}

		const pageNum = Number(page);
		const limitNum = Number(limit);
		const skip = (pageNum - 1) * limitNum;

		const [applications, total] = await Promise.all([
			OwnerApplication.find(filter)
				.populate("userId", "name userName email phone avatarUrl createdAt address")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum),
			OwnerApplication.countDocuments(filter),
		]);

		res.status(200).json({
			message: "ok",
			applications,
			total,
			page: pageNum,
			limit: limitNum,
			totalPages: Math.ceil(total / limitNum),
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể lấy danh sách hồ sơ.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function adminApproveOwnerApplication(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const application = await OwnerApplication.findById(id);

		if (!application) {
			res.status(404).json({ message: "Không tìm thấy hồ sơ." });
			return;
		}

		if (application.status !== "pending") {
			res.status(400).json({ message: "Chỉ có thể duyệt hồ sơ đang chờ duyệt." });
			return;
		}

		application.status = "approved";
		await application.save();

		await User.findByIdAndUpdate(application.userId, { role: "owner" });

		const populated = await application.populate(
			"userId",
			"name userName email phone avatarUrl"
		);

		res.status(200).json({
			message: "Duyệt hồ sơ thành công. Tài khoản đã được nâng cấp lên chủ sân.",
			application: populated,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể duyệt hồ sơ.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function adminRejectOwnerApplication(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const { reason } = req.body as { reason?: string };

		const application = await OwnerApplication.findById(id);

		if (!application) {
			res.status(404).json({ message: "Không tìm thấy hồ sơ." });
			return;
		}

		if (application.status !== "pending") {
			res.status(400).json({ message: "Chỉ có thể từ chối hồ sơ đang chờ duyệt." });
			return;
		}

		application.status = "rejected";
		application.rejectionReason = reason?.trim() || "Hồ sơ không đạt yêu cầu.";
		await application.save();

		const populated = await application.populate(
			"userId",
			"name userName email phone avatarUrl"
		);

		res.status(200).json({
			message: "Đã từ chối hồ sơ.",
			application: populated,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể từ chối hồ sơ.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}
