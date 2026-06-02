import { Router } from "express";
import {
	createDeposit,
	getDepositStatus,
	handleWebhook,
	createOrderPayment,
	getOrderPaymentStatus,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const paymentRoutes = Router();

paymentRoutes.post("/deposit", requireAuth, createDeposit);
paymentRoutes.get("/deposit/:transferCode", requireAuth, getDepositStatus);
paymentRoutes.post("/webhook", handleWebhook);

paymentRoutes.post("/create-order", createOrderPayment);
paymentRoutes.get("/order/:transferCode", getOrderPaymentStatus);

export default paymentRoutes;
