import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import Court from "./models/courtModel.js";
import UserSkill from "./models/userSkillModel.js";
import courtRoutes from "./routes/courtRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import userSkillRoutes from "./routes/userSkillRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/owner/courts", courtRoutes);
app.use("/api/profile", userProfileRoutes);
app.use("/api/profile/skills", userSkillRoutes);
app.get("/api/health", (_req, res) => {
	res.status(200).json({ status: "ok", service: "arena-backend" });
});

async function startServer(): Promise<void> {
	if (!MONGODB_URI) {
		throw new Error("Missing MONGODB_URI in environment variables");
	}

	await mongoose.connect(MONGODB_URI);

	try {
		await Court.createCollection();
	} catch (error: unknown) {
		const mongooseError = error as { code?: number };
		if (mongooseError.code !== 48) {
			throw error;
		}
	}

	try {
		await UserSkill.createCollection();
	} catch (error: unknown) {
		const mongooseError = error as { code?: number };
		if (mongooseError.code !== 48) {
			throw error;
		}
	}

	console.log("MongoDB connected successfully");

	await new Promise<void>((resolve, reject) => {
		const server = app.listen(PORT, () => {
			console.log(`Server is running at http://localhost:${PORT}`);
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
