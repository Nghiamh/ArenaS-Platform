import { Request, Response } from "express";
import mongoose from "mongoose";
import Wallet from "../models/walletModel.js";
import WalletTransaction from "../models/walletTransactionModel.js";

function buildWalletResponse(wallet: {
	_id: unknown;
	userId: unknown;
	balance: number;
	status: string;
	createdAt?: Date;
	updatedAt?: Date;
}) {
	return {
		id: String(wallet._id),
		userId: String(wallet.userId),
		balance: wallet.balance,
		status: wallet.status,
		createdAt: wallet.createdAt?.toISOString(),
		updatedAt: wallet.updatedAt?.toISOString(),
	};
}

function buildTransactionResponse(tx: {
	_id: unknown;
	walletId: unknown;
	bookingId?: unknown;
	amount: number;
	type: string;
	status: string;
	transferCode?: string;
	expiredAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}) {
	return {
		id: String(tx._id),
		walletId: String(tx.walletId),
		bookingId: tx.bookingId ? String(tx.bookingId) : undefined,
		amount: tx.amount,
		type: tx.type,
		status: tx.status,
		transferCode: tx.transferCode,
		expiredAt: tx.expiredAt?.toISOString(),
		createdAt: tx.createdAt?.toISOString(),
		updatedAt: tx.updatedAt?.toISOString(),
	};
}

/**
 * GET /api/wallet
 * Returns the current user's wallet and recent transactions.
 */
export async function getMyWallet(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;

		let wallet = await Wallet.findOne({ userId: user._id });

		if (!wallet) {
			wallet = await Wallet.create({ userId: user._id, balance: 0, status: "active" });
		}

		const transactions = await WalletTransaction.find({ walletId: wallet._id })
			.sort({ createdAt: -1 })
			.limit(50);

		res.status(200).json({
			message: "wallet loaded successfully",
			wallet: buildWalletResponse(wallet),
			transactions: transactions.map(buildTransactionResponse),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({
			message: "failed to load wallet",
			error: errorMessage,
		});
	}
}

/**
 * POST /api/wallet/deduct
 * Deducts balance for a booking. Uses MongoDB session for atomicity.
 */
export async function deductBalance(req: Request, res: Response): Promise<void> {
	const session = await mongoose.startSession();

	try {
		const user = req.user!;
		const { amount, bookingId } = req.body as {
			amount?: number;
			bookingId?: string;
		};

		if (!amount || typeof amount !== "number" || amount <= 0) {
			res.status(400).json({ message: "invalid amount", error: "invalid_amount" });
			return;
		}

		await session.withTransaction(async () => {
			const wallet = await Wallet.findOne({ userId: user._id }).session(session);

			if (!wallet) {
				throw new Error("wallet_not_found");
			}

			if (wallet.status === "frozen") {
				throw new Error("wallet_frozen");
			}

			if (wallet.balance < amount) {
				throw new Error("insufficient_balance");
			}

			wallet.balance -= amount;
			await wallet.save({ session });

			await WalletTransaction.create(
				[
					{
						walletId: wallet._id,
						bookingId: bookingId
							? new mongoose.Types.ObjectId(bookingId)
							: undefined,
						amount,
						type: "payment",
						status: "completed",
					},
				],
				{ session }
			);
		});

		const updatedWallet = await Wallet.findOne({ userId: user._id });

		res.status(200).json({
			message: "balance deducted successfully",
			wallet: updatedWallet ? buildWalletResponse(updatedWallet) : null,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "wallet_not_found"
				? 404
				: errorMessage === "wallet_frozen"
					? 403
					: errorMessage === "insufficient_balance"
						? 400
						: 500;

		res.status(statusCode).json({
			message:
				statusCode === 404
					? "wallet not found"
					: statusCode === 403
						? "wallet is frozen"
						: statusCode === 400
							? "insufficient balance"
							: "failed to deduct balance",
			error: errorMessage,
		});
	} finally {
		await session.endSession();
	}
}
