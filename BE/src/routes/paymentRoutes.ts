import { Router } from "express";
import {
	createDeposit,
	getDepositStatus,
	handleWebhook,
	fakeWebhook,
	createOrderPayment,
	getOrderPaymentStatus,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const paymentRoutes = Router();

paymentRoutes.post("/deposit", requireAuth, createDeposit);
paymentRoutes.get("/deposit/:transferCode", requireAuth, getDepositStatus);
paymentRoutes.post("/webhook", handleWebhook);
paymentRoutes.post("/fake-webhook", fakeWebhook);
paymentRoutes.post("/create-order", createOrderPayment);
paymentRoutes.get("/order/:transferCode", getOrderPaymentStatus);

export default paymentRoutes;
