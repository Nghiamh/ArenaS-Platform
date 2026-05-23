import { Request, Response } from "express";
import WalletTransaction from "../models/walletTransactionModel.js";
import Subscription from "../models/subscriptionModel.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type IncomeEntry = {
	id: string;
	type: "deposit" | "subscription";
	amount: number;
	userName: string;
	userEmail: string;
	description: string;
	transferCode?: string;
	createdAt: string;
};

// ─── GET /api/admin/income ────────────────────────────────────────────────────
// Query: type (all|deposit|subscription), page, limit, dateFrom, dateTo

export async function adminGetIncome(req: Request, res: Response): Promise<void> {
	try {
		const {
			type = "all",
			page = "1",
			limit = "30",
			dateFrom,
			dateTo,
		} = req.query as Record<string, string>;

		const pageNum  = Math.max(1, parseInt(page, 10) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

		// Optional date range applied to createdAt
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dateFilter: Record<string, any> = {};
		if (dateFrom || dateTo) {
			dateFilter.createdAt = {};
			if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
			if (dateTo)   dateFilter.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
		}

		const allEntries: IncomeEntry[] = [];

		// ── Deposits (nạp tiền vào ví) ──────────────────────────────────────────
		if (type === "all" || type === "deposit") {
			const deposits = await WalletTransaction.find({
				type: "deposit",
				status: "completed",
				...dateFilter,
			})
				.populate({
					path: "walletId",
					populate: { path: "userId", select: "name email" },
				})
				.sort({ createdAt: -1 })
				.limit(500)
				.lean();

			for (const d of deposits) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const wallet = (d as any).walletId as any;
				const user   = wallet?.userId as { name?: string; email?: string } | null;
				allEntries.push({
					id:           String(d._id),
					type:         "deposit",
					amount:       d.amount,
					userName:     user?.name  ?? "Không rõ",
					userEmail:    user?.email ?? "",
					description:  "Nạp tiền vào ví",
					transferCode: d.transferCode,
					createdAt:    new Date(d.createdAt).toISOString(),
				});
			}
		}

		// ── Subscriptions (mua gói) ─────────────────────────────────────────────
		if (type === "all" || type === "subscription") {
			const subs = await Subscription.find({
				amountPaid: { $gt: 0 },
				...dateFilter,
			})
				.populate("ownerId", "name email")
				.populate("planId", "displayName")
				.sort({ createdAt: -1 })
				.limit(500)
				.lean();

			for (const s of subs) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const owner = (s as any).ownerId as { name?: string; email?: string } | null;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const plan  = (s as any).planId  as { displayName?: string } | null;
				const cycle = s.billingCycle === "monthly" ? "Tháng" : "Năm";
				allEntries.push({
					id:          String(s._id),
					type:        "subscription",
					amount:      s.amountPaid,
					userName:    owner?.name  ?? "Không rõ",
					userEmail:   owner?.email ?? "",
					description: `Gói ${plan?.displayName ?? "?"} – ${cycle}`,
					createdAt:   s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
				});
			}
		}

		// Sort merged list newest first
		allEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		// ── Summary (always over ALL-TIME data, ignoring date filter) ───────────
		const [depositAgg, subAgg] = await Promise.all([
			WalletTransaction.aggregate([
				{ $match: { type: "deposit", status: "completed" } },
				{ $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
			]),
			Subscription.aggregate([
				{ $match: { amountPaid: { $gt: 0 } } },
				{ $group: { _id: null, total: { $sum: "$amountPaid" }, count: { $sum: 1 } } },
			]),
		]);

		const depositTotal       = depositAgg[0]?.total ?? 0;
		const depositCount       = depositAgg[0]?.count ?? 0;
		const subscriptionTotal  = subAgg[0]?.total     ?? 0;
		const subscriptionCount  = subAgg[0]?.count     ?? 0;

		const now              = new Date();
		const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

		const [tmDepAgg, tmSubAgg, lmDepAgg, lmSubAgg] = await Promise.all([
			WalletTransaction.aggregate([
				{ $match: { type: "deposit", status: "completed", createdAt: { $gte: startOfMonth } } },
				{ $group: { _id: null, total: { $sum: "$amount" } } },
			]),
			Subscription.aggregate([
				{ $match: { amountPaid: { $gt: 0 }, createdAt: { $gte: startOfMonth } } },
				{ $group: { _id: null, total: { $sum: "$amountPaid" } } },
			]),
			WalletTransaction.aggregate([
				{ $match: { type: "deposit", status: "completed", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
				{ $group: { _id: null, total: { $sum: "$amount" } } },
			]),
			Subscription.aggregate([
				{ $match: { amountPaid: { $gt: 0 }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
				{ $group: { _id: null, total: { $sum: "$amountPaid" } } },
			]),
		]);

		const thisMonthRevenue = (tmDepAgg[0]?.total ?? 0) + (tmSubAgg[0]?.total ?? 0);
		const lastMonthRevenue = (lmDepAgg[0]?.total ?? 0) + (lmSubAgg[0]?.total ?? 0);

		// ── Paginate ─────────────────────────────────────────────────────────────
		const total = allEntries.length;
		const items = allEntries.slice((pageNum - 1) * limitNum, pageNum * limitNum);

		res.status(200).json({
			message: "Income loaded successfully.",
			summary: {
				totalRevenue:       depositTotal + subscriptionTotal,
				depositTotal,
				depositCount,
				subscriptionTotal,
				subscriptionCount,
				thisMonthRevenue,
				lastMonthRevenue,
			},
			total,
			page:       pageNum,
			limit:      limitNum,
			totalPages: Math.ceil(total / limitNum),
			items,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		res.status(500).json({ message: "Failed to load income data.", error: errorMessage });
	}
}
