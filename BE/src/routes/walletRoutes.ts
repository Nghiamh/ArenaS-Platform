import { Router } from "express";
import { getMyWallet, deductBalance, getMyRevenue } from "../controllers/walletController.js";
import { requestWithdrawal, processWithdrawal, getWithdrawalRequests, reportWithdrawal, resolveReport, confirmReceipt } from "../controllers/withdrawController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const walletRoutes = Router();

walletRoutes.get("/", requireAuth, getMyWallet);
walletRoutes.get("/revenue", requireAuth, getMyRevenue);
walletRoutes.post("/deduct", requireAuth, deductBalance);

// Withdraw routes
walletRoutes.post("/withdraw", requireAuth, requestWithdrawal);
walletRoutes.get("/withdrawals", requireAuth, getWithdrawalRequests);
walletRoutes.put("/withdrawals/:id", requireAuth, requireRole({ role: "admin", error: "forbidden", message: "Chỉ admin mới có quyền duyệt yêu cầu" }), processWithdrawal);
walletRoutes.post("/withdrawals/:id/report", requireAuth, requireRole({ role: "owner", error: "forbidden", message: "Chỉ chủ sân mới có quyền báo cáo" }), reportWithdrawal);
walletRoutes.post("/withdrawals/:id/resolve", requireAuth, requireRole({ role: "admin", error: "forbidden", message: "Chỉ admin mới có quyền xử lý báo cáo" }), resolveReport);
walletRoutes.post("/withdrawals/:id/confirm-receipt", requireAuth, requireRole({ role: "owner", error: "forbidden", message: "Chỉ chủ sân mới có quyền xác nhận" }), confirmReceipt);

export default walletRoutes;
