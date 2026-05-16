import { Router } from "express";
import { getMyWallet, deductBalance } from "../controllers/walletController.js";
import { requireAuth } from "../middleware/auth.js";

const walletRoutes = Router();

walletRoutes.get("/", requireAuth, getMyWallet);
walletRoutes.post("/deduct", requireAuth, deductBalance);

export default walletRoutes;
