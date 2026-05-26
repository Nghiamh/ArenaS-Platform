import { Router } from "express";
import { getMyWallet, deductBalance, getMyRevenue } from "../controllers/walletController.js";
import { requireAuth } from "../middleware/auth.js";

const walletRoutes = Router();

walletRoutes.get("/", requireAuth, getMyWallet);
walletRoutes.get("/revenue", requireAuth, getMyRevenue);
walletRoutes.post("/deduct", requireAuth, deductBalance);

export default walletRoutes;
