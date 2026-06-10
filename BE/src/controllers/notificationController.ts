import { Request, Response } from "express";
import mongoose from "mongoose";
import Notification, { NotificationType } from "../models/notificationModel.js";

// ─── Internal helper: create a notification ───────────────────────────────────

export async function createNotification(opts: {
	recipientId?: mongoose.Types.ObjectId | string;
	recipientRole?: "admin" | "owner" | "user";
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
	metadata?: Record<string, string>;
}): Promise<void> {
	try {
		await Notification.create({
			recipientId: opts.recipientId ? new mongoose.Types.ObjectId(String(opts.recipientId)) : undefined,
			recipientRole: opts.recipientRole,
			type: opts.type,
			title: opts.title,
			message: opts.message,
			link: opts.link,
			metadata: opts.metadata,
		});

		// Emit socket event
		const { getIo } = await import("../services/socketHandler.js");
		const io = getIo();
		if (io) {
			if (opts.recipientId) {
				io.to(`user:${opts.recipientId.toString()}`).emit("new_notification", { type: opts.type });
			} else if (opts.recipientRole) {
				io.to(`role:${opts.recipientRole}`).emit("new_notification", { type: opts.type });
			}
		}
	} catch (error) {
		// Non-fatal — log silently, don't break main flow
		console.error("[Notification] Failed to create notification:", opts.type, error);
	}
}

// ─── GET /api/notifications/me ────────────────────────────────────────────────

export async function getMyNotifications(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
		const limit = Math.min(50, Number(req.query.limit) || 20);
		const onlyUnread = req.query.unread === "true";

		const filter: Record<string, unknown> = {
			$or: [
				{ recipientId: user._id },
				{ recipientRole: user.role },
			],
		};

		if (onlyUnread) {
			(filter as Record<string, unknown>)["read"] = false;
		}

		const notifications = await Notification.find(filter)
			.sort({ createdAt: -1 })
			.limit(limit);

		const unreadCount = await Notification.countDocuments({
			$or: [{ recipientId: user._id }, { recipientRole: user.role }],
			read: false,
		});

		res.status(200).json({
			message: "ok",
			notifications,
			unreadCount,
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể lấy thông báo.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── GET /api/notifications/unread-count ─────────────────────────────────────

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
		const count = await Notification.countDocuments({
			$or: [{ recipientId: user._id }, { recipientRole: user.role }],
			read: false,
		});
		res.status(200).json({ count });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể đếm thông báo.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;
		const { id } = req.params;

		const notification = await Notification.findOneAndUpdate(
			{
				_id: id,
				$or: [{ recipientId: user._id }, { recipientRole: user.role }],
			},
			{ read: true },
			{ new: true }
		);

		if (!notification) {
			res.status(404).json({ message: "Không tìm thấy thông báo." });
			return;
		}

		res.status(200).json({ message: "ok", notification });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể cập nhật thông báo.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
	try {
		const user = req.user!;

		await Notification.updateMany(
			{
				$or: [{ recipientId: user._id }, { recipientRole: user.role }],
				read: false,
			},
			{ read: true }
		);

		res.status(200).json({ message: "Đã đánh dấu tất cả là đã đọc." });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể cập nhật thông báo.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}
