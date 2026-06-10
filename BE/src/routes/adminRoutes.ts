import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
	adminGetAllCourts,
	adminUpdateCourtStatus,
	adminApproveCourt,
	adminRejectCourt,
} from "../controllers/adminCourtController.js";
import { adminGetIncome } from "../controllers/adminIncomeController.js";
import {
	adminGetAllOwnerApplications,
	adminApproveOwnerApplication,
	adminRejectOwnerApplication,
	adminRevokeOwnerApplication,
} from "../controllers/ownerApplicationController.js";
import {
	adminGetAllUsers,
	adminCreateUser,
	adminUpdateUser,
	adminDeleteUser,
} from "../controllers/adminUserController.js";
import {
	adminListVouchers,
	adminCreateVoucher,
	adminUpdateVoucher,
	adminToggleVoucher,
	adminDeleteVoucher,
} from "../controllers/voucherController.js";

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

// GET  /api/admin/owner-applications         — list all owner registration applications
// POST /api/admin/owner-applications/:id/approve — approve application → upgrade user to owner
// POST /api/admin/owner-applications/:id/reject  — reject application with reason
adminRoutes.get("/owner-applications", ...adminOnly, adminGetAllOwnerApplications);
adminRoutes.post("/owner-applications/:id/approve", ...adminOnly, adminApproveOwnerApplication);
adminRoutes.post("/owner-applications/:id/reject",  ...adminOnly, adminRejectOwnerApplication);
adminRoutes.post("/owner-applications/:id/revoke",  ...adminOnly, adminRevokeOwnerApplication);

// GET  /api/admin/users            — list all users (paginated, searchable, filterable)
// POST /api/admin/users            — create a new user account
// PUT  /api/admin/users/:id        — update user (name, role, isBanned, password...)
// DELETE /api/admin/users/:id      — delete user account
adminRoutes.get("/users",      ...adminOnly, adminGetAllUsers);
adminRoutes.post("/users",     ...adminOnly, adminCreateUser);
adminRoutes.put("/users/:id",  ...adminOnly, adminUpdateUser);
adminRoutes.delete("/users/:id", ...adminOnly, adminDeleteUser);

// GET  /api/admin/vouchers         — list all vouchers
// POST /api/admin/vouchers         — create new voucher
// PUT  /api/admin/vouchers/:id     — update voucher
// POST /api/admin/vouchers/:id/toggle — toggle active/disabled
// DELETE /api/admin/vouchers/:id   — delete voucher
adminRoutes.get("/vouchers",              ...adminOnly, adminListVouchers);
adminRoutes.post("/vouchers",             ...adminOnly, adminCreateVoucher);
adminRoutes.put("/vouchers/:id",          ...adminOnly, adminUpdateVoucher);
adminRoutes.post("/vouchers/:id/toggle",  ...adminOnly, adminToggleVoucher);
adminRoutes.delete("/vouchers/:id",       ...adminOnly, adminDeleteVoucher);

export default adminRoutes;
