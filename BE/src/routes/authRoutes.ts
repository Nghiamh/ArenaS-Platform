import { Router } from "express";
import { login, loginWithGoogle, register } from "../controllers/authController.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google", loginWithGoogle);

export default authRoutes;
