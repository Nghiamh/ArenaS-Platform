import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
	getMyNotifications,
	getUnreadCount,
	markNotificationRead,
	markAllNotificationsRead,
} from "../controllers/notificationController.js";

const notificationRoutes = Router();

// All routes require auth — each user only sees their own notifications
notificationRoutes.get("/",           requireAuth, getMyNotifications);
notificationRoutes.get("/unread-count", requireAuth, getUnreadCount);
notificationRoutes.put("/read-all",   requireAuth, markAllNotificationsRead);
notificationRoutes.put("/:id/read",   requireAuth, markNotificationRead);

export default notificationRoutes;
