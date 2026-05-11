import { Router } from "express";
import {
	createOwnerCourt,
	deleteOwnerCourt,
	getCourtsByArea,
	getNearbyCourts,
	getPublicCourts,
	getOwnerCourtById,
	getOwnerCourts,
	updateOwnerCourt,
} from "../controllers/courtController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const courtRoutes = Router();
const ownerRole = requireRole({
	role: "owner",
	error: "courts_disabled_for_role",
	message: "courts are only available for owner accounts",
});

courtRoutes.get("/public", getPublicCourts);
courtRoutes.get("/nearby", getNearbyCourts);
courtRoutes.get("/search", getCourtsByArea);
courtRoutes.get("/", requireAuth, ownerRole, getOwnerCourts);
courtRoutes.get("/:courtId", requireAuth, ownerRole, getOwnerCourtById);
courtRoutes.post("/", requireAuth, ownerRole, createOwnerCourt);
courtRoutes.put("/:courtId", requireAuth, ownerRole, updateOwnerCourt);
courtRoutes.delete("/:courtId", requireAuth, ownerRole, deleteOwnerCourt);

export default courtRoutes;