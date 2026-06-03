import { Request, Response } from "express";
import OwnerApplication from "../models/ownerApplicationModel.js";
import User from "../models/userModel.js";
import { createNotification } from "./notificationController.js";

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
			// Inconsistent state: user role was downgraded but application wasn't cleaned up.
			// Delete the stale approved application so they can resubmit.
			await OwnerApplication.findByIdAndDelete(existing._id);
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

			// Notify admin of resubmission
			void createNotification({
				recipientRole: "admin",
				type: "owner_application_submitted",
				title: "Hồ sơ chủ sân mới",
				message: `Người dùng đã gửi lại hồ sơ đăng ký làm chủ sân.`,
				link: "/admin/owner-applications",
				metadata: { applicationId: String(existing._id) },
			});

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

		// Notify admin of new application
		void createNotification({
			recipientRole: "admin",
			type: "owner_application_submitted",
			title: "Hồ sơ chủ sân mới",
			message: `Người dùng đã gửi hồ sơ đăng ký làm chủ sân cho "${application.businessName}".`,
			link: "/admin/owner-applications",
			metadata: { applicationId: String(application._id) },
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

		// Notify user: application approved
		void createNotification({
			recipientId: application.userId,
			type: "owner_application_approved",
			title: "Hồ sơ được duyệt ✓",
			message: `Chúc mừng! Hồ sơ đăng ký làm chủ sân của bạn đã được Admin phê duyệt. Tài khoản đã được nâng cấp lên Chủ sân.`,
			link: "/owner/dashboard",
			metadata: { applicationId: String(application._id) },
		});

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

		const rejectionReason = reason?.trim() || "Hồ sơ không đạt yêu cầu.";
		application.status = "rejected";
		application.rejectionReason = rejectionReason;
		await application.save();

		// Notify user: application rejected
		void createNotification({
			recipientId: application.userId,
			type: "owner_application_rejected",
			title: "Hồ sơ bị từ chối",
			message: `Hồ sơ đăng ký chủ sân của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
			link: "/profile",
			metadata: { applicationId: String(application._id) },
		});

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

export async function adminRevokeOwnerApplication(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		const application = await OwnerApplication.findById(id);
		if (!application) {
			res.status(404).json({ message: "Không tìm thấy hồ sơ." });
			return;
		}

		if (application.status !== "approved") {
			res.status(400).json({ message: "Chỉ có thể thu hồi hồ sơ đã được duyệt." });
			return;
		}

		const userId = application.userId;

		// Downgrade user role back to "user"
		await User.findByIdAndUpdate(userId, { role: "user" });

		// Delete the application so the widget clears on ProfilePage
		await OwnerApplication.findByIdAndDelete(id);

		// Notify user
		void createNotification({
			recipientId: userId,
			type: "owner_application_rejected",
			title: "Vai trò chủ sân đã bị thu hồi",
			message: "Tài khoản của bạn đã được chuyển về vai trò người dùng thông thường. Bạn có thể đăng ký lại bất kỳ lúc nào.",
			link: "/profile",
		});

		res.status(200).json({
			message: "Đã thu hồi quyền chủ sân. Tài khoản đã về lại vai trò người dùng.",
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể thu hồi quyền chủ sân.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}
