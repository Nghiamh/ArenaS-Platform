import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CourtSlotModel, ISlot } from '../models/courtSlotModel.js';
import { CourtDashboardModel } from '../models/courtDashboardModel.js';
import Court from '../models/courtModel.js';

// Helper: Khởi tạo các mốc thời gian 30 phút
function generateTimeSlots(openTime: string, closeTime: string): ISlot[] {
	const slots: ISlot[] = [];
	
	const [startHour, startMin] = openTime.split(':').map(Number);
	const [endHour, endMin] = closeTime.split(':').map(Number);

	let currentMinutes = startHour * 60 + startMin;
	const endMinutes = endHour * 60 + endMin;

	while (currentMinutes + 30 <= endMinutes) {
		const h1 = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
		const m1 = (currentMinutes % 60).toString().padStart(2, '0');
		const nextMinutes = currentMinutes + 30;
		const h2 = Math.floor(nextMinutes / 60).toString().padStart(2, '0');
		const m2 = (nextMinutes % 60).toString().padStart(2, '0');

		slots.push({
			start: `${h1}:${m1}`,
			end: `${h2}:${m2}`,
			status: 'available',
		});

		currentMinutes = nextMinutes;
	}

	return slots;
}

// 1. API: Tự động tạo Slot cho một ngày
export async function generateCourtSlots(req: Request, res: Response) {
	try {
		// Nhận tham số, mặc định mở từ 06:00 đến 22:00
		const { court_id, sub_court_id, date, open_time = '06:00', close_time = '22:00' } = req.body;

		if (!mongoose.Types.ObjectId.isValid(court_id)) {
			return res.status(400).json({ error: 'invalid_court_id' });
		}
		if (!sub_court_id || !mongoose.Types.ObjectId.isValid(sub_court_id)) {
			return res.status(400).json({ error: 'invalid_sub_court_id' });
		}

		// Kiểm tra xem đã tạo slot cho ngày này chưa
		const existing = await CourtSlotModel.findOne({ court_id, sub_court_id, date });
		if (existing) {
			return res.status(400).json({ error: 'Slots đã được khởi tạo cho ngày này' });
		}

		const slots = generateTimeSlots(open_time, close_time);

		const newCourtSlot = new CourtSlotModel({
			court_id,
			sub_court_id,
			date,
			slots,
		});

		await newCourtSlot.save();

		// Đồng bộ thông số Dashboard ban đầu (Tạo ra số available_slots)
		const targetDate = new Date(date);
		targetDate.setHours(0, 0, 0, 0);
		
		await CourtDashboardModel.findOneAndUpdate(
			{ court_id, sub_court_id, date: targetDate },
			{
				$inc: { total_slots: slots.length, available_slots: slots.length }
			},
			{ upsert: true, new: true }
		);

		return res.status(201).json({ message: 'Khởi tạo slot thành công', data: newCourtSlot });
	} catch (error) {
		console.error('Lỗi khi tạo slots:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 3. API: Lấy danh sách Slot của một sân trong một ngày
export async function getCourtSlots(req: Request, res: Response) {
	try {
		const { courtId } = req.params;
		const { date } = req.query; // YYYY-MM-DD

		if (!mongoose.Types.ObjectId.isValid(courtId)) {
			return res.status(400).json({ error: 'invalid_court_id' });
		}

		if (!date) {
			return res.status(400).json({ error: 'date_is_required' });
		}

		const courtSlots = await CourtSlotModel.find({ court_id: courtId, date });
		return res.status(200).json(courtSlots);
	} catch (error) {
		console.error('Lỗi khi lấy slots:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 4. API: Kiểm tra và Đặt Sân (Sử dụng Database Transaction)
export async function bookCourtSlot(req: Request, res: Response) {
	// Khởi tạo một MongoDB Session để dùng Transaction
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { court_id, sub_court_id, date, start_time, end_time, user_id } = req.body;

		if (!mongoose.Types.ObjectId.isValid(court_id)) {
			throw new Error('invalid_court_id');
		}
		if (!sub_court_id || !mongoose.Types.ObjectId.isValid(sub_court_id)) {
			throw new Error('invalid_sub_court_id');
		}

		// Bước 1: Query CourtSlot với Transaction Session (Đảm bảo tính ACID và chặn Race Condition nhờ cơ chế Versioning của Mongoose/MongoDB)
		const courtSlot = await CourtSlotModel.findOne({ court_id, sub_court_id, date }).session(session);
		
		if (!courtSlot) {
			throw new Error('slots_not_found_for_date');
		}

		// Bước 2: Tìm vị trí của các slot nằm trong khoảng thời gian người dùng muốn đặt
		let startIndex = -1;
		let endIndex = -1;

		for (let i = 0; i < courtSlot.slots.length; i++) {
			if (courtSlot.slots[i].start === start_time) startIndex = i;
			if (courtSlot.slots[i].end === end_time) endIndex = i;
		}

		if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
			throw new Error('invalid_time_range');
		}

		const targetSlots = courtSlot.slots.slice(startIndex, endIndex + 1);

		// Bước 3: Kiểm tra tính khả dụng
		// Nếu có bất kỳ slot nào trạng thái khác 'available', báo lỗi!
		const hasUnavailable = targetSlots.some(slot => slot.status !== 'available');
		if (hasUnavailable) {
			throw new Error('slot_already_booked');
		}

		// Bước 4: Đánh dấu Đã Đặt và Gắn Booking_id
		const numberOfSlotsBooked = targetSlots.length;
		const mockBookingId = new mongoose.Types.ObjectId(); // Trong thực tế sẽ tạo Document ở model Booking

		for (let i = startIndex; i <= endIndex; i++) {
			courtSlot.slots[i].status = 'booked';
			courtSlot.slots[i].booking_id = mockBookingId; // Link đến mã đặt sân
		}

		// Save CourtSlot (Sẽ ném lỗi Optimistic Concurrency nếu ai đó đã update cùng lúc)
		await courtSlot.save({ session }); 
		
		// Bước 5: Tính giá và Cập nhật Dashboard
		const court = await Court.findById(court_id).session(session);
		const pricePerHour = court ? court.price_per_hour : 300000;
		// 1 slot = 30p = nửa giá
		const revenue = (pricePerHour / 2) * numberOfSlotsBooked;

		const targetDate = new Date(date);
		targetDate.setHours(0, 0, 0, 0);

		await CourtDashboardModel.findOneAndUpdate(
			{ court_id, sub_court_id, date: targetDate },
			{
				$inc: { 
					booked_slots: numberOfSlotsBooked, 
					available_slots: -numberOfSlotsBooked,
					total_bookings: 1,
					revenue: revenue
				}
			},
			{ upsert: true, new: true, session }
		);

		// Nếu không có lỗi gì, commit và lưu toàn bộ thay đổi vào DB
		await session.commitTransaction();
		session.endSession();

		return res.status(200).json({ 
			message: 'Đặt sân thành công!', 
			booking_id: mockBookingId,
			slots_booked: numberOfSlotsBooked,
			revenue: revenue
		});

	} catch (error: any) {
		// Có lỗi -> Hủy bỏ toàn bộ Transaction (Rollback)
		await session.abortTransaction();
		session.endSession();

		// Xử lý thông báo lỗi phản hồi về Frontend
		if (error.message === 'slot_already_booked') {
			return res.status(400).json({ error: 'Khung giờ này đã bị đặt. Vui lòng chọn giờ khác.' });
		}
		if (error.message === 'invalid_time_range') {
			return res.status(400).json({ error: 'Khung thời gian không hợp lệ' });
		}
		if (error.message === 'slots_not_found_for_date') {
			return res.status(404).json({ error: 'Chưa khởi tạo slot cho ngày này' });
		}
		if (error.message === 'invalid_court_id') {
			return res.status(400).json({ error: 'ID Sân không hợp lệ' });
		}
		
		// Trường hợp bị Mongoose Version Error (Optimistic Concurrency - Race Condition)
		if (error.name === 'VersionError') {
			return res.status(409).json({ error: 'Hệ thống đang xử lý một giao dịch khác trên khung giờ này. Vui lòng thử lại.' });
		}

		console.error('Lỗi khi đặt sân:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}
