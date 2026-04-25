import jwt from "jsonwebtoken";

type JwtUserRole = "user" | "owner" | "admin";

export function generateAccessToken(userId: string, role: JwtUserRole): string {
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		throw new Error("Missing JWT_SECRET in environment variables");
	}

	return jwt.sign({ sub: userId, role }, secret, { expiresIn: "7d" });
}
