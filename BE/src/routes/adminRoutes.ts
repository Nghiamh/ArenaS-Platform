import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
	adminGetAllCourts,
	adminUpdateCourtStatus,
	adminApproveCourt,
	adminRejectCourt,
} from "../controllers/adminCourtController.js";
import { adminGetIncome } from "../controllers/adminIncomeController.js";

const adminRoutes = Router();

const adminOnly = [
	requireAuth,
	requireRole({
		role: "admin",
		error: "forbidden",
		message: "Admin access required.",
	}),
];

// GET  /api/admin/courts               — list all courts (all owners, all statuses)
// POST /api/admin/courts/:id/approve   — approve a pending court → available
// POST /api/admin/courts/:id/reject    — reject a pending court  → closed
// PUT  /api/admin/courts/:id/status    — set any status manually
adminRoutes.get("/courts", ...adminOnly, adminGetAllCourts);
adminRoutes.post("/courts/:id/approve", ...adminOnly, adminApproveCourt);
adminRoutes.post("/courts/:id/reject",  ...adminOnly, adminRejectCourt);
adminRoutes.put("/courts/:id/status",   ...adminOnly, adminUpdateCourtStatus);

// GET  /api/admin/income  — all "+"-direction revenue (deposits + subscriptions)
adminRoutes.get("/income", ...adminOnly, adminGetIncome);

export default adminRoutes;
