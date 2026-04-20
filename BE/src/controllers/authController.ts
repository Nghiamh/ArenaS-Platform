import { Request, Response } from "express";
import User from "../models/userModel.js";
import { generateAccessToken } from "../utils/token.js";

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function normalizeUserName(userName: string): string {
	return userName.trim();
}

export async function register(req: Request, res: Response): Promise<void> {
	try {
		const { email, userName, password } = req.body as {
			email?: string;
			userName?: string;
			password?: string;
		};

		if (!email || !userName || !password) {
			res.status(400).json({
				message: "email, userName and password are required",
			});
			return;
		}

		if (password.length < 6) {
			res.status(400).json({
				message: "password must be at least 6 characters",
			});
			return;
		}

		const normalizedEmail = normalizeEmail(email);
		const normalizedUserName = normalizeUserName(userName);

		const existedUser = await User.findOne({
			$or: [{ email: normalizedEmail }, { userName: normalizedUserName }],
		});

		if (existedUser) {
			const conflictField =
				existedUser.email === normalizedEmail ? "email" : "userName";
			res.status(409).json({
				message: `${conflictField} already exists`,
			});
			return;
		}

		const createdUser = await User.create({
			email: normalizedEmail,
			userName: normalizedUserName,
			password,
		});

		const token = generateAccessToken(createdUser._id.toString());

		res.status(201).json({
			message: "register successful",
			token,
			user: {
				id: createdUser._id,
				email: createdUser.email,
				userName: createdUser.userName,
			},
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "failed to register",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

export async function login(req: Request, res: Response): Promise<void> {
	try {
		const { email, userName, identifier, password } = req.body as {
			email?: string;
			userName?: string;
			identifier?: string;
			password?: string;
		};

		if (!password) {
			res.status(400).json({ message: "password is required" });
			return;
		}

		const credential = (identifier ?? email ?? userName)?.trim();
		if (!credential) {
			res.status(400).json({
				message: "email or userName is required",
			});
			return;
		}

		const query = credential.includes("@")
			? { email: normalizeEmail(credential) }
			: { userName: normalizeUserName(credential) };

		const user = await User.findOne(query);
		if (!user) {
			res.status(401).json({ message: "invalid credentials" });
			return;
		}

		const isPasswordCorrect = await user.comparePassword(password);
		if (!isPasswordCorrect) {
			res.status(401).json({ message: "invalid credentials" });
			return;
		}

		const token = generateAccessToken(user._id.toString());

		res.status(200).json({
			message: "login successful",
			token,
			user: {
				id: user._id,
				email: user.email,
				userName: user.userName,
			},
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "failed to login",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}
