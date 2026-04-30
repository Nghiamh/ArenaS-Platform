import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUserRole } from "../models/userModel.js";

type RoleRequirement = {
	role: IUserRole | IUserRole[];
	error: string;
	message: string;
};

function parseBearerToken(authorizationHeader: string | undefined): string | null {
	if (!authorizationHeader) {
		return null;
	}

	const [scheme, token] = authorizationHeader.split(" ");
	if (scheme !== "Bearer" || !token) {
		return null;
	}

	return token;
}

async function findUserFromToken(token: string) {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("Missing JWT_SECRET in environment variables");
	}

	let payload: jwt.JwtPayload;

	try {
		payload = jwt.verify(token, secret) as jwt.JwtPayload;
	} catch (error: unknown) {
		if (error instanceof jwt.JsonWebTokenError) {
			throw new Error("invalid_token");
		}

		throw error;
	}

	const userId = payload.sub;

	if (typeof userId !== "string" || !userId) {
		throw new Error("invalid_token");
	}

	const user = await User.findById(userId);
	if (!user) {
		throw new Error("user_not_found");
	}

	return user;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token = parseBearerToken(req.headers.authorization);
		if (!token) {
			throw new Error("missing_token");
		}

		const user = await findUserFromToken(token);
		req.user = user;
		next();
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "unknown error";
		const statusCode =
			errorMessage === "missing_token" ||
			errorMessage === "invalid_token" ||
			errorMessage === "user_not_found"
				? 401
				: 500;

		res.status(statusCode).json({
			message: statusCode === 401 ? "unauthorized" : "failed to authenticate",
			error: errorMessage,
		});
	}
}

export function requireRole({ role, error, message }: RoleRequirement) {
	const roles = Array.isArray(role) ? role : [role];

	return (req: Request, res: Response, next: NextFunction): void => {
		const user = req.user;
		if (!user) {
			res.status(401).json({ message: "unauthorized", error: "missing_token" });
			return;
		}

		if (!roles.includes(user.role ?? "user")) {
			res.status(403).json({ message, error });
			return;
		}

		next();
	};
}
