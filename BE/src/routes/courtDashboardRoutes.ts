import express from "express";
import { getCourtDashboard, seedCourtDashboard } from "../controllers/courtDashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Lấy thông tin thống kê của sân (yêu cầu đăng nhập, thường dành cho Owner)
router.get("/:courtId", requireAuth, getCourtDashboard);

// Endpoint mock tạo dữ liệu (chỉ dùng cho mục đích test)
router.post("/:courtId/seed", requireAuth, seedCourtDashboard);

export default router;
