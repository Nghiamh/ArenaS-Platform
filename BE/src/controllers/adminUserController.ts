import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import OwnerApplication from "../models/ownerApplicationModel.js";

// Safe projection — never expose sensitive fields
const SAFE_SELECT = "-password -resetPasswordTokenHash -resetPasswordExpiresAt -googleId";

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Query: keyword, role (all|user|owner|admin), status (all|active|banned), page, limit

export async function adminGetAllUsers(req: Request, res: Response): Promise<void> {
	try {
		const {
			keyword,
			role,
			status,
			page  = "1",
			limit = "20",
		} = req.query as Record<string, string | undefined>;

		const filter: Record<string, unknown> = {};

		if (role && role !== "all") {
			filter.role = role;
		}

		if (status === "banned") {
			filter.isBanned = true;
		} else if (status === "active") {
			filter.isBanned = { $ne: true };
		}

		if (keyword?.trim()) {
			const q = { $regex: keyword.trim(), $options: "i" };
			filter.$or = [{ name: q }, { email: q }, { userName: q }, { phone: q }];
		}

		const pageNum  = Math.max(1, Number(page));
		const limitNum = Math.min(100, Math.max(1, Number(limit)));
		const skip     = (pageNum - 1) * limitNum;

		const [users, total] = await Promise.all([
			User.find(filter)
				.select(SAFE_SELECT)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum),
			User.countDocuments(filter),
		]);

		res.status(200).json({
			message:    "ok",
			users,
			total,
			page:       pageNum,
			limit:      limitNum,
			totalPages: Math.ceil(total / limitNum),
		});
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể tải danh sách người dùng.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────
// Body: name, email, userName, password, phone?, role?

export async function adminCreateUser(req: Request, res: Response): Promise<void> {
	try {
		const { name, email, userName, password, phone, role = "user" } = req.body as {
			name?: string;
			email?: string;
			userName?: string;
			password?: string;
			phone?: string;
			role?: string;
		};

		if (!name?.trim() || !email?.trim() || !userName?.trim() || !password) {
			res.status(400).json({ message: "name, email, userName, password là bắt buộc." });
			return;
		}

		if (password.length < 6) {
			res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
			return;
		}

		if (!["user", "owner", "admin"].includes(role)) {
			res.status(400).json({ message: "Role không hợp lệ." });
			return;
		}

		const normalEmail    = email.toLowerCase().trim();
		const normalUserName = userName.toLowerCase().trim();

		const exists = await User.findOne({
			$or: [{ email: normalEmail }, { userName: normalUserName }],
		});

		if (exists) {
			const field = exists.email === normalEmail ? "Email" : "Tên đăng nhập";
			res.status(400).json({ message: `${field} đã tồn tại.` });
			return;
		}

		const user = new User({
			name:         name.trim(),
			email:        normalEmail,
			userName:     normalUserName,
			password,            // hashed by pre-save hook
			phone:        phone?.trim() || undefined,
			role,
			authProvider: "local",
		});

		await user.save();

		const safe = user.toObject() as Record<string, unknown>;
		delete safe.password;
		delete safe.resetPasswordTokenHash;
		delete safe.resetPasswordExpiresAt;
		delete safe.googleId;

		res.status(201).json({ message: "Tạo tài khoản thành công.", user: safe });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể tạo tài khoản.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────
// Body: name?, phone?, address?, role?, isBanned?, password?

export async function adminUpdateUser(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ message: "ID không hợp lệ." });
			return;
		}

		const { name, phone, address, role, isBanned, password } = req.body as {
			name?:     string;
			phone?:    string;
			address?:  string;
			role?:     string;
			isBanned?: boolean;
			password?: string;
		};

		// Prevent admin from changing their own role or banning themselves
		if (req.user!._id.toString() === id) {
			if (role !== undefined && role !== "admin") {
				res.status(400).json({ message: "Không thể tự thay đổi vai trò của mình." });
				return;
			}
			if (isBanned === true) {
				res.status(400).json({ message: "Không thể tự khóa tài khoản của mình." });
				return;
			}
		}

		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "Không tìm thấy người dùng." });
			return;
		}

		if (name     !== undefined) user.name     = name.trim()    || undefined;
		if (phone    !== undefined) user.phone    = phone.trim()   || undefined;
		if (address  !== undefined) user.address  = address.trim() || undefined;
		if (isBanned !== undefined) user.isBanned = isBanned;

		if (role !== undefined) {
			if (!["user", "owner", "admin"].includes(role)) {
				res.status(400).json({ message: "Role không hợp lệ." });
				return;
			}

			// When demoting owner → user, clean up the approved OwnerApplication
			// so the "Hồ sơ đã được duyệt" widget disappears from their ProfilePage
			if (user.role === "owner" && role === "user") {
				await OwnerApplication.deleteMany({ userId: user._id });
			}

			user.role = role as "user" | "owner" | "admin";
		}

		if (password) {
			if (password.length < 6) {
				res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
				return;
			}
			user.password = password; // hashed by pre-save hook
		}

		await user.save();

		const updated = await User.findById(id).select(SAFE_SELECT);
		res.status(200).json({ message: "Cập nhật thành công.", user: updated });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể cập nhật người dùng.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────

export async function adminDeleteUser(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ message: "ID không hợp lệ." });
			return;
		}

		if (req.user!._id.toString() === id) {
			res.status(400).json({ message: "Không thể xóa tài khoản của chính mình." });
			return;
		}

		const user = await User.findByIdAndDelete(id);
		if (!user) {
			res.status(404).json({ message: "Không tìm thấy người dùng." });
			return;
		}

		res.status(200).json({ message: `Đã xóa tài khoản "${user.name ?? user.userName}".` });
	} catch (error: unknown) {
		res.status(500).json({
			message: "Không thể xóa người dùng.",
			error: error instanceof Error ? error.message : "unknown error",
		});
	}
}
