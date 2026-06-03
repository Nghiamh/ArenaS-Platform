import { Request, Response } from "express";
import mongoose from "mongoose";
import Wallet from "../models/walletModel.js";
import WalletTransaction from "../models/walletTransactionModel.js";
import PaymentWebhookLog from "../models/paymentWebhookLogModel.js";
import { generateTransferCode, buildVietQRUrl } from "../utils/vietqr.js";
import { processSubscriptionCheckout } from "./webhookController.js";
import { createNotification } from "./notificationController.js";

const DEPOSIT_EXPIRY_MINUTES = 5;
const MIN_DEPOSIT_AMOUNT = 2_000;

/**
 * POST /api/payment/deposit
 * Creates a pending deposit transaction and returns a VietQR URL.
 */
export async function createDeposit(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
		const { amount } = req.body as { amount?: number };

		if (!amount || typeof amount !== "number" || amount < MIN_DEPOSIT_AMOUNT) {
			res.status(400).json({
				message: `minimum deposit is ${MIN_DEPOSIT_AMOUNT.toLocaleString("vi-VN")}đ`,
				error: "invalid_amount",
			});
			return;
		}

		// Find or create wallet
		let wallet = await Wallet.findOne({ userId: user._id });
		if (!wallet) {
			wallet = await Wallet.create({
				userId: user._id,
				balance: 0,
				status: "active",
			});
		}

		if (wallet.status === "frozen") {
			res.status(403).json({
				message: "wallet is frozen",
				error: "wallet_frozen",
			});
			return;
		}

		// Generate unique transfer code with retry
		let transferCode = "";
		let attempts = 0;
		const maxAttempts = 5;

		while (attempts < maxAttempts) {
			transferCode = generateTransferCode();
			const exists = await WalletTransaction.findOne({ transferCode });

			if (!exists) {
				break;
			}

			attempts++;
			if (attempts >= maxAttempts) {
				throw new Error("failed_to_generate_transfer_code");
			}
		}

		const expiredAt = new Date(Date.now() + DEPOSIT_EXPIRY_MINUTES * 60 * 1000);

		await WalletTransaction.create({
			walletId: wallet._id,
			amount,
			type: "deposit",
			status: "pending",
			transferCode,
			expiredAt,
		});

		const qrUrl = buildVietQRUrl(amount, transferCode);

		res.status(201).json({
			message: "deposit created successfully",
			transferCode,
			qrUrl,
			amount,
			expiredAt: expiredAt.toISOString(),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			message: "failed to create deposit",
			error: errorMessage,
		});
	}
}

/**
 * GET /api/payment/deposit/:transferCode
 * Returns the status of a deposit transaction for frontend polling.
 */
export async function getDepositStatus(req: Request, res: Response): Promise<void> {
	try {
		const { transferCode } = req.params as { transferCode?: string };

		if (!transferCode) {
			res.status(400).json({
				message: "transferCode is required",
				error: "missing_transfer_code",
			});
			return;
		}

		const transaction = await WalletTransaction.findOne({ transferCode });

		if (!transaction) {
			res.status(404).json({
				message: "transaction not found",
				error: "transaction_not_found",
			});
			return;
		}

		// Auto-expire if past expiredAt and still pending
		if (
			transaction.status === "pending" &&
			transaction.expiredAt &&
			new Date() > transaction.expiredAt
		) {
			transaction.status = "expired";
			await transaction.save();
		}

		res.status(200).json({
			message: "deposit status loaded",
			transaction: {
				id: String(transaction._id),
				amount: transaction.amount,
				status: transaction.status,
				transferCode: transaction.transferCode,
				expiredAt: transaction.expiredAt?.toISOString(),
				createdAt: transaction.createdAt?.toISOString(),
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			message: "failed to get deposit status",
			error: errorMessage,
		});
	}
}

/**
 * Core logic for processing a webhook transfer confirmation.
 * Used by both real webhook and fake webhook endpoints.
 */
async function processWebhookTransfer(transferCode: string): Promise<{
	success: boolean;
	message: string;
	alreadyProcessed?: boolean;
}> {
	const session = await mongoose.startSession();

	try {
		let result: { success: boolean; message: string; alreadyProcessed?: boolean } = {
			success: false,
			message: "",
		};

		await session.withTransaction(async () => {
			// Try exact match first (fast)
			let transaction = await WalletTransaction.findOne({ transferCode }).session(session);

			// If not found, try a dash-insensitive search (some banks/apps strip hyphens)
			if (!transaction) {
				const normalized = transferCode.replace(/-/g, "");
				const dashInsensitiveRegex = new RegExp(normalized.split("").join("-?"), "i");
				transaction = await WalletTransaction.findOne({
					transferCode: { $regex: dashInsensitiveRegex },
				}).session(session);
			}

			if (!transaction) {
				result = { success: false, message: "transaction_not_found" };
				return;
			}

			// Idempotent: if already completed, return success without processing again
			if (transaction.status === "completed") {
				result = {
					success: true,
					message: "already_processed",
					alreadyProcessed: true,
				};
				return;
			}

			if (transaction.status !== "pending") {
				result = { success: false, message: `transaction_status_is_${transaction.status}` };
				return;
			}

			// Check expiry
			if (transaction.expiredAt && new Date() > transaction.expiredAt) {
				transaction.status = "expired";
				await transaction.save({ session });
				result = { success: false, message: "transaction_expired" };
				return;
			}

			// Update transaction to completed
			transaction.status = "completed";
			await transaction.save({ session });

			// Add balance to wallet ONLY IF it is a deposit
			if (transaction.type === "deposit") {
				const wallet = await Wallet.findById(transaction.walletId).session(session);
				if (!wallet) {
					throw new Error("wallet_not_found");
				}

				wallet.balance += transaction.amount;
				await wallet.save({ session });

				// Notify user: deposit confirmed
				void createNotification({
					recipientId: wallet.userId as mongoose.Types.ObjectId,
					type: "deposit_received",
					title: "Nạp tiền thành công ✓",
					message: `Ví của bạn đã được cộng ${transaction.amount.toLocaleString("vi-VN")}đ. Số dư mới: ${wallet.balance.toLocaleString("vi-VN")}đ.`,
					link: "/wallet",
					metadata: { amount: String(transaction.amount), txId: String(transaction._id) },
				});
			}

			result = { success: true, message: transaction.type === "deposit" ? "deposit_confirmed" : "payment_confirmed" };
		});

		return result;
	} finally {
		await session.endSession();
	}
}

/**
 * POST /api/payment/webhook
 * External webhook endpoint for payment providers.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
	try {
		const rawData = req.body;

		// Log the webhook
		let transferCode: string | undefined;

		// Attempt to extract transferCode (format: (DEP|PAY)-YYYYMMDD-XXXXX or (DEP|PAY)YYYYMMDDXXXXX) from common SEPay/Bank webhook fields
		const codeRegex = /(?:DEP|PAY)-?\d{8}-?[A-Z0-9]{5}/i;
		const searchFields = [
			rawData?.transferCode,
			rawData?.addInfo,
			rawData?.content,
			rawData?.description,
		];

		for (const field of searchFields) {
			if (typeof field === "string") {
				const match = field.match(codeRegex);
				if (match) {
					// Normalize: strip dashes and uppercase (banks may insert dashes)
					transferCode = match[0].replace(/-/g, "").toUpperCase();
					break;
				}
			}
		}

		await PaymentWebhookLog.create({
			provider: "vietqr",
			rawData,
			transferCode,
			processedAt: new Date(),
		});

		if (!transferCode) {
			res.status(200).json({
				message: "webhook received but no transferCode found",
			});
			return;
		}

		// Smart fallback: try wallet transaction first, if not found try subscription checkout
		const walletResult = await processWebhookTransfer(transferCode);

		if (walletResult.success || walletResult.message !== "transaction_not_found") {
			// Wallet transaction was found (or had a non-missing error like expired)
			res.status(200).json({
				message: walletResult.message,
				success: walletResult.success,
			});
			return;
		}

		// Not found in wallet — try subscription checkout
		const transferAmount = Number(rawData?.transferAmount || rawData?.amount) || 0;
		const subResult = await processSubscriptionCheckout(transferCode, transferAmount);

		res.status(200).json({
			message: subResult.message,
			success: subResult.success,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		console.error("Webhook processing error:", errorMessage);
		// Always return 200 to prevent webhook retries
		res.status(200).json({
			message: "webhook received with error",
			error: errorMessage,
		});
	}
}



/**
 * POST /api/payment/create-order
 * Mock order creation for checkout page
 */
export async function createOrderPayment(req: Request, res: Response): Promise<void> {
	try {
		const { totalAmount, userId } = req.body as { totalAmount?: number; userId?: string };

		if (!totalAmount || typeof totalAmount !== "number") {
			res.status(400).json({
				success: false,
				message: "totalAmount is required and must be a number",
			});
			return;
		}

		let targetWallet;
		const targetUserId = userId || (req.user ? String(req.user._id) : null);

		if (targetUserId) {
			targetWallet = await Wallet.findOne({ userId: targetUserId });
		}

		if (!targetWallet) {
			// Fallback to system wallet
			let systemWallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId("000000000000000000000000") });
			if (!systemWallet) {
				systemWallet = await Wallet.create({
					userId: new mongoose.Types.ObjectId("000000000000000000000000"),
					balance: 0,
					status: "active",
				});
			}
			targetWallet = systemWallet;
		}

		const paymentCode = generateTransferCode("payment");
		const qrUrl = buildVietQRUrl(totalAmount, paymentCode);
		const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

		await WalletTransaction.create({
			walletId: targetWallet._id,
			amount: totalAmount,
			type: "payment",
			status: "pending",
			transferCode: paymentCode,
			expiredAt,
		});

		res.status(200).json({
			success: true,
			orderId: new mongoose.Types.ObjectId().toString(),
			paymentCode,
			qrUrl,
			totalAmount,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			success: false,
			message: "failed to create order",
			error: errorMessage,
		});
	}
}

export async function getOrderPaymentStatus(req: Request, res: Response): Promise<void> {
	try {
		const { transferCode } = req.params as { transferCode?: string };

		if (!transferCode) {
			res.status(400).json({
				message: "transferCode is required",
				error: "missing_transfer_code",
			});
			return;
		}

		const transaction = await WalletTransaction.findOne({ transferCode });

		if (!transaction) {
			res.status(404).json({
				message: "transaction not found",
				error: "transaction_not_found",
			});
			return;
		}

		res.status(200).json({
			message: "order status loaded",
			transaction: {
				id: String(transaction._id),
				amount: transaction.amount,
				status: transaction.status,
				transferCode: transaction.transferCode,
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			message: "failed to get order status",
			error: errorMessage,
		});
	}
}
