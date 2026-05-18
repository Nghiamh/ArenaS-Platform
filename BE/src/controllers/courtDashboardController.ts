import { Request, Response } from "express";
import mongoose from "mongoose";
import { CourtDashboardModel } from "../models/courtDashboardModel.js";

// Lấy thông tin thống kê (dashboard) của một sân cụ thể
export async function getCourtDashboard(req: Request, res: Response) {
	try {
		const { courtId } = req.params;
		const { date } = req.query;

		if (!mongoose.Types.ObjectId.isValid(courtId)) {
			return res.status(400).json({ error: "invalid_court_id" });
		}

		let query: any = { court_id: courtId };

		// Nếu client truyền ngày, lấy thống kê của ngày đó
		if (date) {
			const targetDate = new Date(date as string);
			if (isNaN(targetDate.getTime())) {
				return res.status(400).json({ error: "invalid_date_format" });
			}
			
			// Lọc từ đầu ngày đến cuối ngày
			const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
			const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

			query.date = {
				$gte: startOfDay,
				$lte: endOfDay,
			};
		}

		const dashboards = await CourtDashboardModel.find(query).sort({ date: -1 });
		return res.status(200).json(dashboards);
	} catch (error) {
		console.error("Error fetching court dashboard:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}

// Endpoint để tự động tạo (seed) dữ liệu giả cho Postman test
export async function seedCourtDashboard(req: Request, res: Response) {
	try {
		const { courtId } = req.params;
		const { sub_court_id, total_slots, booked_slots, blocked_slots, revenue, total_bookings } = req.body;

		if (!mongoose.Types.ObjectId.isValid(courtId)) {
			return res.status(400).json({ error: "invalid_court_id" });
		}
		if (!sub_court_id || !mongoose.Types.ObjectId.isValid(sub_court_id)) {
			return res.status(400).json({ error: "invalid_sub_court_id" });
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Dữ liệu mock (tổng số slot mặc định là 16 slot/ngày * 5 sân nhỏ = 80)
		const mockTotal = total_slots ?? 32; // 32 slots per sub_court (16 hours)
		const mockBooked = booked_slots ?? Math.floor(Math.random() * 20);
		const mockBlocked = blocked_slots ?? 0;
		const mockAvailable = mockTotal - mockBooked - mockBlocked;

		const mockData = {
			court_id: courtId,
			sub_court_id: sub_court_id,
			date: today,
			total_slots: mockTotal,
			booked_slots: mockBooked,
			available_slots: mockAvailable,
			blocked_slots: mockBlocked,
			total_bookings: total_bookings ?? Math.floor(mockBooked / 2),
			revenue: revenue ?? mockBooked * 175000, // 350k/h / 2
		};

		// Upsert: Cập nhật nếu đã có data của ngày hôm nay, hoặc tạo mới
		const dashboard = await CourtDashboardModel.findOneAndUpdate(
			{ court_id: courtId, sub_court_id: sub_court_id, date: today },
			{ $set: mockData },
			{ upsert: true, new: true }
		);

		return res.status(200).json({ message: "Seeded successfully", dashboard });
	} catch (error) {
		console.error("Error seeding court dashboard:", error);
		return res.status(500).json({ error: "internal_server_error" });
	}
}
