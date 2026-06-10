import { Request, Response } from "express";
import mongoose from "mongoose";
import WithdrawalRequest from "../models/withdrawalRequestModel.js";
import Wallet from "../models/walletModel.js";
import WalletTransaction from "../models/walletTransactionModel.js";
import { createNotification } from "./notificationController.js";
import User from "../models/userModel.js";

// 1. Owner requests withdrawal
export async function requestWithdrawal(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const ownerId = req.user!._id;
		const { amount, bankName, bankAccountName, bankAccountNumber } = req.body;

		if (!amount || amount < 10000) {
			throw new Error("invalid_amount");
		}
		if (!bankName || !bankAccountName || !bankAccountNumber) {
			throw new Error("missing_bank_info");
		}

		const wallet = await Wallet.findOne({ userId: ownerId }).session(session);
		if (!wallet) {
			throw new Error("wallet_not_found");
		}
		// Calculate total pending withdrawals to ensure they don't request more than they have
		const pendingRequests = await WithdrawalRequest.find({ ownerId, status: "pending" }).session(session);
		const totalPending = pendingRequests.reduce((sum, req) => sum + req.amount, 0);

		if (wallet.balance < totalPending + amount) {
			throw new Error("insufficient_balance");
		}

		if (wallet.status === "frozen") {
			throw new Error("wallet_frozen");
		}

		// DO NOT deduct from wallet here. We deduct when admin approves.
		
		// Create withdrawal request
		const request = new WithdrawalRequest({
			ownerId,
			amount,
			bankName,
			bankAccountName,
			bankAccountNumber,
			status: "pending",
		});
		await request.save({ session });

		// Create transaction log
		await new WalletTransaction({
			walletId: wallet._id,
			amount,
			type: "withdraw",
			status: "pending",
		}).save({ session });

		await session.commitTransaction();
		session.endSession();

		// Notify Admin
		const user = await User.findById(ownerId);
		void createNotification({
			recipientRole: "admin",
			type: "withdrawal_requested",
			title: "Yêu cầu rút tiền mới 💰",
			message: `Chủ sân ${user?.name || user?.userName} yêu cầu rút ${new Intl.NumberFormat('vi-VN').format(amount)} đ.`,
			link: "/admin/withdrawals", // Assuming this will be built
		});

		return res.status(201).json({
			message: "Tạo yêu cầu rút tiền thành công",
			request,
		});
	} catch (error: any) {
		await session.abortTransaction();
		session.endSession();

		const errorMap: Record<string, any> = {
			invalid_amount: { status: 400, message: "Số tiền tối thiểu là 10.000đ" },
			missing_bank_info: { status: 400, message: "Thiếu thông tin ngân hàng" },
			wallet_not_found: { status: 404, message: "Không tìm thấy ví" },
			insufficient_balance: { status: 400, message: "Số dư không đủ" },
			wallet_frozen: { status: 403, message: "Ví đang bị khóa" },
		};

		const mapped = errorMap[error.message];
		if (mapped) {
			return res.status(mapped.status).json({ error: mapped.message });
		}

		console.error("requestWithdrawal error:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}

// 2. Admin processes withdrawal (approve or reject)
export async function processWithdrawal(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { id } = req.params;
		const { status, adminNote } = req.body;

		if (!["approved", "rejected"].includes(status)) {
			throw new Error("invalid_status");
		}

		const request = await WithdrawalRequest.findById(id).session(session);
		if (!request) {
			throw new Error("request_not_found");
		}
		if (request.status !== "pending") {
			throw new Error("request_already_processed");
		}

		request.status = status;
		if (adminNote) request.adminNote = adminNote;
		await request.save({ session });

		const wallet = await Wallet.findOne({ userId: request.ownerId }).session(session);
		if (!wallet) {
			throw new Error("wallet_not_found");
		}

		const transaction = await WalletTransaction.findOne({
			walletId: wallet._id,
			amount: request.amount,
			type: "withdraw",
			status: "pending",
		}).sort({ createdAt: -1 }).session(session);

		if (status === "approved") {
			// Now we deduct the balance
			if (wallet.balance < request.amount) {
				throw new Error("insufficient_balance_at_approval");
			}
			wallet.balance -= request.amount;
			await wallet.save({ session });

			if (transaction) {
				transaction.status = "completed";
				await transaction.save({ session });
			}
		} else if (status === "rejected") {
			// We didn't deduct, so no need to refund the balance
			if (transaction) {
				transaction.status = "failed";
				await transaction.save({ session });
			}
		}

		await session.commitTransaction();
		session.endSession();

		// Notify Owner
		if (status === "approved") {
			void createNotification({
				recipientId: request.ownerId,
				type: "withdrawal_approved",
				title: "Yêu cầu rút tiền được duyệt ✅",
				message: `Yêu cầu rút ${new Intl.NumberFormat('vi-VN').format(request.amount)} đ đã được duyệt. Tiền sẽ sớm chuyển vào tài khoản của bạn.`,
				link: "/owner/wallet",
			});
		} else {
			void createNotification({
				recipientId: request.ownerId,
				type: "withdrawal_rejected",
				title: "Yêu cầu rút tiền bị từ chối ❌",
				message: `Yêu cầu rút ${new Intl.NumberFormat('vi-VN').format(request.amount)} đ đã bị từ chối. Lời nhắn: ${adminNote || "Không có"}. Số tiền đã được hoàn lại vào ví.`,
				link: "/owner/wallet",
			});
		}

		return res.status(200).json({
			message: "Xử lý yêu cầu thành công",
			request,
		});
	} catch (error: any) {
		await session.abortTransaction();
		session.endSession();

		const errorMap: Record<string, any> = {
			invalid_status: { status: 400, message: "Trạng thái không hợp lệ" },
			request_not_found: { status: 404, message: "Không tìm thấy yêu cầu rút tiền" },
			request_already_processed: { status: 400, message: "Yêu cầu này đã được xử lý" },
			wallet_not_found: { status: 404, message: "Không tìm thấy ví" },
			insufficient_balance_at_approval: { status: 400, message: "Số dư ví hiện tại không đủ để duyệt yêu cầu này" },
		};

		const mapped = errorMap[error.message];
		if (mapped) {
			return res.status(mapped.status).json({ error: mapped.message });
		}

		console.error("processWithdrawal error:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}

// 3. Get withdrawal requests (Admin can see all, Owner sees theirs)
export async function getWithdrawalRequests(req: Request, res: Response) {
	try {
		const user = req.user!;
		const query: any = {};

		if (user.role === "owner") {
			query.ownerId = user._id;
		}

		const requests = await WithdrawalRequest.find(query)
			.sort({ createdAt: -1 })
			.populate("ownerId", "name userName email phone");

		return res.status(200).json({
			message: "Thành công",
			requests,
		});
	} catch (error) {
		console.error("getWithdrawalRequests error:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}

// 4. Owner reports an approved withdrawal they haven't received
export async function reportWithdrawal(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const { message } = req.body;
		const user = req.user!;

		const request = await WithdrawalRequest.findById(id);
		if (!request) {
			return res.status(404).json({ error: "Không tìm thấy yêu cầu rút tiền" });
		}

		if (request.ownerId.toString() !== user._id.toString()) {
			return res.status(403).json({ error: "Không có quyền báo cáo" });
		}

		if (request.status !== "approved") {
			return res.status(400).json({ error: "Chỉ có thể báo cáo đơn đã được duyệt" });
		}

		if (request.isReported && !request.isReportResolved) {
			return res.status(400).json({ error: "Đơn này đang được báo cáo và chờ xử lý" });
		}

		request.isReported = true;
		if (request.isReportResolved) {
			request.isReportResolved = false;
			request.reportMessage = `${request.reportMessage}\n\n[Báo cáo lại]: ${message || "Chưa nhận được tiền"}`;
		} else {
			request.reportMessage = message || "Chưa nhận được tiền";
		}
		await request.save();

		// Notify Admin
		void createNotification({
			recipientRole: "admin",
			type: "withdrawal_reported",
			title: "Báo cáo lỗi rút tiền ⚠️",
			message: `Chủ sân ${user.name || user.userName} báo cáo chưa nhận được tiền cho mã giao dịch ${request._id.toString().slice(-8)}.`,
			link: "/admin/withdrawals",
		});

		return res.status(200).json({
			message: "Gửi báo cáo thành công",
			request,
		});
	} catch (error) {
		console.error("reportWithdrawal error:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}

// 5. Admin resolves a reported withdrawal
export async function resolveReport(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const { message } = req.body;

		if (!message) {
			return res.status(400).json({ error: "Vui lòng nhập lời nhắn xử lý" });
		}

		const request = await WithdrawalRequest.findById(id);
		if (!request) {
			return res.status(404).json({ error: "Không tìm thấy yêu cầu rút tiền" });
		}

		if (!request.isReported) {
			return res.status(400).json({ error: "Yêu cầu này chưa được báo cáo lỗi" });
		}

		if (request.isReportResolved) {
			return res.status(400).json({ error: "Báo cáo này đã được xử lý" });
		}

		request.isReportResolved = true;
		request.reportResolutionMessage = message;
		await request.save();

		// Notify Owner
		void createNotification({
			recipientId: request.ownerId,
			type: "withdrawal_report_resolved",
			title: "Báo cáo rút tiền đã được xử lý 🛠️",
			message: `Admin đã xử lý báo cáo của bạn với lời nhắn: "${message}".`,
			link: "/owner/wallet",
		});

		return res.status(200).json({
			message: "Xử lý báo cáo thành công",
			request,
		});
	} catch (error) {
		console.error("resolveReport error:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}

// 6. Owner confirms they received the money
export async function confirmReceipt(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const user = req.user!;

		const request = await WithdrawalRequest.findById(id);
		if (!request) {
			return res.status(404).json({ error: "Không tìm thấy yêu cầu rút tiền" });
		}

		if (request.ownerId.toString() !== user._id.toString()) {
			return res.status(403).json({ error: "Không có quyền xác nhận" });
		}

		if (request.status !== "approved") {
			return res.status(400).json({ error: "Chỉ có thể xác nhận đơn đã được duyệt" });
		}

		request.isReceiptConfirmed = true;
		await request.save();

		// Notify Admin
		void createNotification({
			recipientRole: "admin",
			type: "withdrawal_receipt_confirmed",
			title: "Chủ sân đã nhận được tiền ✅",
			message: `Chủ sân ${user.name || user.userName} đã xác nhận nhận được tiền cho mã giao dịch ${request._id.toString().slice(-8)}.`,
			link: "/admin/withdrawals",
		});

		return res.status(200).json({
			message: "Xác nhận thành công",
			request,
		});
	} catch (error) {
		console.error("confirmReceipt error:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}
