import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (_req, res) => {
	res.status(200).json({ status: "ok", service: "arena-backend" });
});

async function startServer(): Promise<void> {
	if (!MONGODB_URI) {
		throw new Error("Missing MONGODB_URI in environment variables");
	}

	await mongoose.connect(MONGODB_URI);
	console.log("MongoDB connected successfully");

	app.listen(PORT, () => {
		console.log(`Server is running at http://localhost:${PORT}`);
	});
}

void startServer().catch((error: unknown) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
