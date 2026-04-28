import { Router } from "express";
import {
	createOwnerCourt,
	deleteOwnerCourt,
	getOwnerCourtById,
	getOwnerCourts,
	updateOwnerCourt,
} from "../controllers/courtController.js";

const courtRoutes = Router();

courtRoutes.get("/", getOwnerCourts);
courtRoutes.get("/:courtId", getOwnerCourtById);
courtRoutes.post("/", createOwnerCourt);
courtRoutes.put("/:courtId", updateOwnerCourt);
courtRoutes.delete("/:courtId", deleteOwnerCourt);

export default courtRoutes;