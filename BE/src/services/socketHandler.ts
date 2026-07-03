import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import ChatMessage from "../models/chatMessageModel.js";
import Match from "../models/matchModel.js";

/**
 * Verify JWT token from socket handshake and return the user ID.
 */
function authenticateSocket(socket: Socket): string | null {
	const token =
		socket.handshake.auth?.token ||
		socket.handshake.headers?.authorization?.replace("Bearer ", "");

	if (!token) {
		return null;
	}

	const secret = process.env.JWT_SECRET;
	if (!secret) {
		return null;
	}

	try {
		const payload = jwt.verify(token, secret) as jwt.JwtPayload;
		return typeof payload.sub === "string" ? payload.sub : null;
	} catch {
		return null;
	}
}

/**
 * Check if a user is a participant of a match.
 */
async function isUserInMatch(userId: string, matchId: string): Promise<boolean> {
	const match = await Match.findById(matchId);
	if (!match) {
		return false;
	}

	const isParticipant = match.participants.some(
		(p: any) => p.toString() === userId
	);

	return isParticipant;
}

let ioInstance: SocketServer | null = null;

export function getIo(): SocketServer | null {
	return ioInstance;
}

/**
 * Setup all Socket.IO event handlers.
 */
export function setupSocketHandlers(io: SocketServer): void {
	ioInstance = io;

	io.use((socket, next) => {
		const userId = authenticateSocket(socket);
		if (!userId) {
			next(new Error("authentication_error"));
			return;
		}

		// Attach userId to socket data for later use
		socket.data.userId = userId;
		next();
	});

	io.on("connection", async (socket: Socket) => {
		const userId = socket.data.userId as string;

		// Join personal room for targeted notifications (match_found, etc.)
		void socket.join(`user:${userId}`);

		try {
			const User = (await import("../models/userModel.js")).default;
			const user = await User.findById(userId);
			if (user) {
				void socket.join(`role:${user.role}`);
			}
		} catch (error) {
			console.error("Failed to join role room:", error);
		}

		console.log(`Socket connected: user=${userId} socket=${socket.id}`);

		// --- join_match_room ---
		socket.on("join_match_room", async (data: { matchId: string }) => {
			try {
				const { matchId } = data;
				if (!matchId) {
					socket.emit("error", { message: "matchId is required" });
					return;
				}

				// Verify user belongs to this match
				const allowed = await isUserInMatch(userId, matchId);
				if (!allowed) {
					socket.emit("error", {
						message: "You are not a participant of this match",
					});
					return;
				}

				await socket.join(`match:${matchId}`);
				socket.emit("joined_match_room", { matchId });

				console.log(`User ${userId} joined match room: ${matchId}`);
			} catch (error) {
				console.error("join_match_room error:", error);
				socket.emit("error", { message: "Failed to join match room" });
			}
		});

		// --- send_message ---
		socket.on(
			"send_message",
			async (data: { matchId: string; message: string }) => {
				try {
					const { matchId, message } = data;

					if (!matchId || !message?.trim()) {
						socket.emit("error", {
							message: "matchId and message are required",
						});
						return;
					}

					// Verify user belongs to this match
					const allowed = await isUserInMatch(userId, matchId);
					if (!allowed) {
						socket.emit("error", {
							message: "You are not a participant of this match",
						});
						return;
					}

					// Save message to database
					const chatMessage = await ChatMessage.create({
						match_id: matchId,
						sender_id: userId,
						message: message.trim(),
					});

					// Broadcast to all users in the match room
					io.to(`match:${matchId}`).emit("receive_message", {
						_id: chatMessage._id,
						match_id: matchId,
						sender_id: userId,
						message: chatMessage.message,
						createdAt: chatMessage.createdAt,
					});
				} catch (error) {
					console.error("send_message error:", error);
					socket.emit("error", { message: "Failed to send message" });
				}
			}
		);

		// --- leave_match_room ---
		socket.on("leave_match_room", (data: { matchId: string }) => {
			const { matchId } = data;
			if (matchId) {
				void socket.leave(`match:${matchId}`);
				console.log(`User ${userId} left match room: ${matchId}`);
			}
		});

		// --- disconnect ---
		socket.on("disconnect", () => {
			console.log(`Socket disconnected: user=${userId} socket=${socket.id}`);
		});
	});
}
