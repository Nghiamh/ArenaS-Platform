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

const courtRoutes = Router();

courtRoutes.get("/public", getPublicCourts);
courtRoutes.get("/nearby", getNearbyCourts);
courtRoutes.get("/search", getCourtsByArea);
courtRoutes.get("/", getOwnerCourts);
courtRoutes.get("/:courtId", getOwnerCourtById);
courtRoutes.post("/", createOwnerCourt);
courtRoutes.put("/:courtId", updateOwnerCourt);
courtRoutes.delete("/:courtId", deleteOwnerCourt);

export default courtRoutes;