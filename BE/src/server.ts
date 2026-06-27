import "dotenv/config";
import { createServer } from "http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { Server as SocketServer } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import Court from "./models/courtModel.js";
import { CourtSlotModel } from "./models/courtSlotModel.js";
import { CourtDashboardModel } from "./models/courtDashboardModel.js";
import UserSkill from "./models/userSkillModel.js";
import MatchmakingTicket from "./models/matchmakingTicketModel.js";
import Match from "./models/matchModel.js";
import ChatMessage from "./models/chatMessageModel.js";
import courtRoutes from "./routes/courtRoutes.js";
import courtDashboardRoutes from "./routes/courtDashboardRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import userSkillRoutes from "./routes/userSkillRoutes.js";
import matchmakingRoutes from "./routes/matchmakingRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { startMatchmakingWorker } from "./services/matchmakingWorker.js";
import { setupSocketHandlers } from "./services/socketHandler.js";
import walletRoutes from "./routes/walletRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import { startSubscriptionCron } from "./cron/subscriptionCron.js";
import { startPayoutCron } from "./cron/payoutCron.js";
import { startMatchBookingTimeoutCron } from "./cron/matchBookingTimeoutCron.js";
import { startSlotLockTimeoutCron } from "./cron/slotLockTimeoutCron.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
app.set("io", io);

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/owner/courts", courtRoutes);
app.use("/api/dashboard", courtDashboardRoutes);
app.use("/api/profile", userProfileRoutes);
app.use("/api/profile/skills", userSkillRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/vouchers", voucherRoutes);
app.get("/api/health", (_req, res) => {
	res.status(200).json({ status: "ok", service: "arena-backend" });
});

// Setup Socket.IO event handlers
setupSocketHandlers(io);

async function startServer(): Promise<void> {
	if (!MONGODB_URI) {
		throw new Error("Missing MONGODB_URI in environment variables");
	}

	await mongoose.connect(MONGODB_URI);

	// Ensure collections exist
	const models = [Court, UserSkill, MatchmakingTicket, Match, ChatMessage, CourtSlotModel, CourtDashboardModel];
	for (const model of models) {
		try {
			await model.createCollection();
		} catch (error: unknown) {
			const mongooseError = error as { code?: number };
			if (mongooseError.code !== 48) {
				throw error;
			}
		}
	}

	// Xóa index cũ nếu tồn tại (để sửa lỗi duplicate key khi tạo slot/dashboard cho nhiều sân nhỏ)
	try {
		await CourtSlotModel.collection.dropIndex("court_id_1_date_1");
		console.log("Đã xóa index cũ court_id_1_date_1 trong CourtSlot");
	} catch (error: any) {}

	try {
		await CourtDashboardModel.collection.dropIndex("court_id_1_date_1");
		console.log("Đã xóa index cũ court_id_1_date_1 trong CourtDashboard");
	} catch (error: any) {}

	console.log("MongoDB connected successfully");

	// Start the matchmaking worker (runs every 5 seconds)
	startMatchmakingWorker(io);
	
	startSubscriptionCron();
	startPayoutCron();
	startMatchBookingTimeoutCron(io);
	startSlotLockTimeoutCron();

	await new Promise<void>((resolve, reject) => {
		const server = httpServer.listen(PORT, () => {
			console.log(`Server is running at http://localhost:${PORT}`);
			console.log(`Socket.IO ready on ws://localhost:${PORT}`);
			resolve();
		});

		server.on("error", (error: NodeJS.ErrnoException) => {
			if (error.code === "EADDRINUSE") {
				reject(
					new Error(
						`Port ${PORT} is already in use. Stop the running backend process or change PORT in BE/.env.`
					)
				);
				return;
			}

			reject(error);
		});
	});
}

void startServer().catch((error: unknown) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
// Trigger nodemon restart

