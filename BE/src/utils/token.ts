import jwt from "jsonwebtoken";

export function generateAccessToken(userId: string): string {
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		throw new Error("Missing JWT_SECRET in environment variables");
	}

	return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}
