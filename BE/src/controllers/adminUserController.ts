import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import OwnerApplication from "../models/ownerApplicationModel.js";
import Wallet from "../models/walletModel.js";
import WalletTransaction from "../models/walletTransactionModel.js";
import PaymentWebhookLog from "../models/paymentWebhookLogModel.js";
import Notification from "../models/notificationModel.js";
import UserSkill from "../models/userSkillModel.js";
import Voucher from "../models/voucherModel.js";
import WithdrawalRequest from "../models/withdrawalRequestModel.js";
import SubscriptionCheckout from "../models/subscriptionCheckoutModel.js";
import Subscription from "../models/subscriptionModel.js";
import Court from "../models/courtModel.js";
import { CourtSlotModel } from "../models/courtSlotModel.js";
import { CourtDashboardModel } from "../models/courtDashboardModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { ReviewModel } from "../models/reviewModel.js";
import Match from "../models/matchModel.js";
import MatchFeedback from "../models/matchFeedbackModel.js";
import MatchmakingTicket from "../models/matchmakingTicketModel.js";
import ChatMessage from "../models/chatMessageModel.js";
import Report from "../models/reportModel.js";

// Deletes every record that references a user, directly or via courts they
// own, so no orphaned data survives an admin hard-delete.
async function cascadeDeleteUserData(
	userId: mongoose.Types.ObjectId,
	session: mongoose.ClientSession
): Promise<void> {
	const owned = await Court.find({ owner_id: userId }).select("_id").session(session);
	const courtIds = owned.map((court) => court._id);

	if (courtIds.length > 0) {
		const ownedMatches = await Match.find({ court_id: { $in: courtIds } })
			.select("_id")
			.session(session);
		const ownedMatchIds = ownedMatches.map((match) => match._id);

		if (ownedMatchIds.length > 0) {
			await ChatMessage.deleteMany({ match_id: { $in: ownedMatchIds } }).session(session);
			await MatchFeedback.deleteMany({ match_id: { $in: ownedMatchIds } }).session(session);
			await MatchmakingTicket.deleteMany({ match_id: { $in: ownedMatchIds } }).session(session);
		}

		await Match.deleteMany({ court_id: { $in: courtIds } }).session(session);
		await MatchmakingTicket.deleteMany({ court_id: { $in: courtIds } }).session(session);
		await BookingModel.deleteMany({ court_id: { $in: courtIds } }).session(session);
		await ReviewModel.deleteMany({ court_id: { $in: courtIds } }).session(session);
		await CourtSlotModel.deleteMany({ court_id: { $in: courtIds } }).session(session);
		await CourtDashboardModel.deleteMany({ court_id: { $in: courtIds } }).session(session);
		await Subscription.deleteMany({ ownerId: userId }).session(session);
		await SubscriptionCheckout.deleteMany({ ownerId: userId }).session(session);
		await Court.deleteMany({ _id: { $in: courtIds } }).session(session);
	}

	const wallet = await Wallet.findOne({ userId }).session(session);
	if (wallet) {
		const transactions = await WalletTransaction.find({ walletId: wallet._id })
			.select("transferCode")
			.session(session);
		const transferCodes = transactions
			.map((tx) => tx.transferCode)
			.filter((code): code is string => !!code);

		if (transferCodes.length > 0) {
			await PaymentWebhookLog.deleteMany({ transferCode: { $in: transferCodes } }).session(session);
		}
		await WalletTransaction.deleteMany({ walletId: wallet._id }).session(session);
		await Wallet.deleteOne({ _id: wallet._id }).session(session);
	}

	const directMatches = await Match.find({
		$or: [{ participants: userId }, { owner_id: userId }, { accepted_by: userId }, { checked_in_players: userId }],
	})
		.select("_id")
		.session(session);
	const directMatchIds = directMatches.map((match) => match._id);
	if (directMatchIds.length > 0) {
		await ChatMessage.deleteMany({ match_id: { $in: directMatchIds } }).session(session);
		await MatchFeedback.deleteMany({ match_id: { $in: directMatchIds } }).session(session);
		await MatchmakingTicket.deleteMany({ match_id: { $in: directMatchIds } }).session(session);
	}
	await Match.deleteMany({
		$or: [{ participants: userId }, { owner_id: userId }, { accepted_by: userId }, { checked_in_players: userId }],
	}).session(session);

	await ChatMessage.deleteMany({ sender_id: userId }).session(session);
	await MatchFeedback.deleteMany({ $or: [{ reporter_id: userId }, { target_id: userId }] }).session(session);
	await MatchmakingTicket.deleteMany({ user_id: userId }).session(session);
	await BookingModel.deleteMany({
		$or: [{ user_id: userId }, { "participants.userId": userId }],
	}).session(session);
	await ReviewModel.deleteMany({ user_id: userId }).session(session);
	await Report.deleteMany({
		$or: [{ reporter_id: userId }, { target_id: userId }, { "chat_logs.sender_id": userId }],
	}).session(session);
	await WithdrawalRequest.deleteMany({ ownerId: userId }).session(session);
	await OwnerApplication.deleteMany({ userId }).session(session);
	await UserSkill.deleteMany({ user_id: userId }).session(session);
	await Notification.deleteMany({ recipientId: userId }).session(session);
	await Voucher.updateMany({ usedBy: userId }, { $pull: { usedBy: userId } }).session(session);
}

// Safe projection — never expose sensitive fields
const SAFE_SELECT = "-password -resetPasswordTokenHash -resetPasswordExpiresAt -googleId";

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Query: keyword, role (all|user|owner|admin), status (all|active|banned), page, limit

export async function adminGetAllUsers(req: Request, res: Response): Promise<void> {
	try {
		const {
			keyword,
			role,
			status,
			page  = "1",
			limit = "20",
		} = req.query as Record<string, string | undefined>;

		const filter: Record<string, unknown> = {};

		if (role && role !== "all") {
			filter.role = role;
		}

		if (status === "banned") {
			filter.isBanned = true;
		} else if (status === "active") {
			filter.isBanned = { $ne: true };
		}

		if (keyword?.trim()) {
			const q = { $regex: keyword.trim(), $options: "i" };
			filter.$or = [{ name: q }, { email: q }, { userName: q }, { phone: q }];
		}

		const pageNum  = Math.max(1, Number(page));
		const limitNum = Math.min(100, Math.max(1, Number(limit)));
		const skip     = (pageNum - 1) * limitNum;

		const [users, total] = await Promise.all([
			User.find(filter)
				.select(SAFE_SELECT)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum),
			User.countDocuments(filter),
		]);

		res.status(200).json({
			message:    "ok",
			users,
			total,
			page:       pageNum,
			limit:      limitNum,
			totalPages: Math.ceil(total / limitNum),
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể tải danh sách người dùng.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────
// Body: name, email, userName, password, phone?, role?

export async function adminCreateUser(req: Request, res: Response): Promise<void> {
	try {
		const { name, email, userName, password, phone, role = "user" } = req.body as {
			name?: string;
			email?: string;
			userName?: string;
			password?: string;
			phone?: string;
			role?: string;
		};

		if (!name?.trim() || !email?.trim() || !userName?.trim() || !password) {
			res.status(400).json({ message: "name, email, userName, password là bắt buộc." });
			return;
		}

		if (password.length < 6) {
			res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
			return;
		}

		if (!["user", "owner", "admin"].includes(role)) {
			res.status(400).json({ message: "Role không hợp lệ." });
			return;
		}

		const normalEmail    = email.toLowerCase().trim();
		const normalUserName = userName.toLowerCase().trim();

		const exists = await User.findOne({
			$or: [{ email: normalEmail }, { userName: normalUserName }],
		});

		if (exists) {
			const field = exists.email === normalEmail ? "Email" : "Tên đăng nhập";
			res.status(400).json({ message: `${field} đã tồn tại.` });
			return;
		}

		const user = new User({
			name:         name.trim(),
			email:        normalEmail,
			userName:     normalUserName,
			password,            // hashed by pre-save hook
			phone:        phone?.trim() || undefined,
			role,
			authProvider: "local",
		});

		await user.save();

		const safe = user.toObject() as Record<string, unknown>;
		delete safe.password;
		delete safe.resetPasswordTokenHash;
		delete safe.resetPasswordExpiresAt;
		delete safe.googleId;

		res.status(201).json({ message: "Tạo tài khoản thành công.", user: safe });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể tạo tài khoản.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────
// Body: name?, phone?, address?, role?, isBanned?, password?

export async function adminUpdateUser(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ message: "ID không hợp lệ." });
			return;
		}

		const { name, phone, address, role, isBanned, password } = req.body as {
			name?:     string;
			phone?:    string;
			address?:  string;
			role?:     string;
			isBanned?: boolean;
			password?: string;
		};

		// Prevent admin from changing their own role or banning themselves
		if (req.user!._id.toString() === id) {
			if (role !== undefined && role !== "admin") {
				res.status(400).json({ message: "Không thể tự thay đổi vai trò của mình." });
				return;
			}
			if (isBanned === true) {
				res.status(400).json({ message: "Không thể tự khóa tài khoản của mình." });
				return;
			}
		}

		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "Không tìm thấy người dùng." });
			return;
		}

		if (name     !== undefined) user.name     = name.trim()    || undefined;
		if (phone    !== undefined) user.phone    = phone.trim()   || undefined;
		if (address  !== undefined) user.address  = address.trim() || undefined;
		if (isBanned !== undefined) user.isBanned = isBanned;

		if (role !== undefined) {
			if (!["user", "owner", "admin"].includes(role)) {
				res.status(400).json({ message: "Role không hợp lệ." });
				return;
			}

			// When demoting owner → user, clean up the approved OwnerApplication
			// so the "Hồ sơ đã được duyệt" widget disappears from their ProfilePage
			if (user.role === "owner" && role === "user") {
				await OwnerApplication.deleteMany({ userId: user._id });
			}

			user.role = role as "user" | "owner" | "admin";
		}

		if (password) {
			if (password.length < 6) {
				res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
				return;
			}
			user.password = password; // hashed by pre-save hook
		}

		await user.save();

		const updated = await User.findById(id).select(SAFE_SELECT);
		res.status(200).json({ message: "Cập nhật thành công.", user: updated });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể cập nhật người dùng.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────

export async function adminDeleteUser(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ message: "ID không hợp lệ." });
			return;
		}

		if (req.user!._id.toString() === id) {
			res.status(400).json({ message: "Không thể xóa tài khoản của chính mình." });
			return;
		}

		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "Không tìm thấy người dùng." });
			return;
		}

		const session = await mongoose.startSession();
		try {
			await session.withTransaction(async () => {
				await cascadeDeleteUserData(user._id as mongoose.Types.ObjectId, session);
				await User.deleteOne({ _id: user._id }).session(session);
			});
		} finally {
			await session.endSession();
		}

		res.status(200).json({ message: `Đã xóa tài khoản "${user.name ?? user.userName}" và toàn bộ dữ liệu liên quan.` });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể xóa người dùng.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}
