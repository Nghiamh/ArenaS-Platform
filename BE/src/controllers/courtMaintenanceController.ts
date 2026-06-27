import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Court from '../models/courtModel.js';
import { CourtSlotModel } from '../models/courtSlotModel.js';
import { CourtDashboardModel } from '../models/courtDashboardModel.js';

// Helper: Khởi tạo các mốc thời gian 30 phút
function generateTimeSlots(openTime: string, closeTime: string) {
	const slots = [];
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

export async function setMaintenance(req: Request, res: Response): Promise<void> {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const userId = req.user!._id;
		const { courtId } = req.params;
		const { action, sub_court_id, date, start_time, end_time, reason } = req.body;

		if (!courtId || !date || !start_time || !end_time || !action) {
			throw new Error('missing_fields');
		}

		if (action === 'lock' && !reason) {
			throw new Error('missing_reason');
		}

		if (action === 'lock') {
			const startDateTime = new Date(`${date}T${start_time}:00`);
			const now = new Date();
			const diffMins = (startDateTime.getTime() - now.getTime()) / (1000 * 60);

			if (diffMins < 20) {
				throw new Error('lock_too_late');
			}
		}

		const court = await Court.findOne({ _id: courtId, owner_id: userId }).session(session);
		if (!court) throw new Error('court_not_found');

		// Xác định danh sách sub_courts cần xử lý
		const targetSubCourts = sub_court_id 
			? court.sub_courts.filter((sc: any) => sc._id.toString() === sub_court_id)
			: court.sub_courts;

		if (targetSubCourts.length === 0) {
			throw new Error('sub_court_not_found');
		}

		for (const subCourt of targetSubCourts) {
			let courtSlot = await CourtSlotModel.findOne({ 
				court_id: courtId, 
				sub_court_id: subCourt._id, 
				date 
			}).session(session);

			let isNewSlot = false;
			if (!courtSlot) {
				const openTime = court.open_time || '06:00';
				const closeTime = court.close_time || '22:00';
				const slots = generateTimeSlots(openTime, closeTime);
				courtSlot = new CourtSlotModel({
					court_id: courtId,
					sub_court_id: subCourt._id,
					date,
					slots,
				});
				isNewSlot = true;
			}

			let startIndex = -1;
			let endIndex = -1;

			for (let i = 0; i < courtSlot.slots.length; i++) {
				const slot = courtSlot.slots[i];
				const overlaps = slot.start < end_time && slot.end > start_time;
				if (overlaps) {
					if (startIndex === -1) {
						startIndex = i;
					}
					endIndex = i;
				}
			}

			if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
				throw new Error('invalid_time_range');
			}

			if (action === 'lock') {
				// Kiểm tra xem có slot nào đã booked không
				const targetSlots = courtSlot.slots.slice(startIndex, endIndex + 1);
				const hasBooked = targetSlots.some((slot: any) => slot.status === 'booked');
				if (hasBooked) {
					throw new Error('slot_already_booked');
				}

				let lockedCount = 0;
				for (let i = startIndex; i <= endIndex; i++) {
					if (courtSlot.slots[i].status === 'available') {
						courtSlot.slots[i].status = 'maintenance';
						courtSlot.slots[i].reason = reason;
						lockedCount++;
					}
				}

				if (lockedCount > 0) {
					const targetDate = new Date(date);
					targetDate.setHours(0, 0, 0, 0);
					await CourtDashboardModel.findOneAndUpdate(
						{ court_id: courtId, sub_court_id: subCourt._id, date: targetDate },
						{ $inc: { available_slots: -lockedCount, blocked_slots: lockedCount } },
						{ upsert: true, new: true, session }
					);
				}
			} else if (action === 'unlock') {
				let unlockedCount = 0;
				for (let i = startIndex; i <= endIndex; i++) {
					if (courtSlot.slots[i].status === 'maintenance') {
						courtSlot.slots[i].status = 'available';
						courtSlot.slots[i].reason = undefined;
						unlockedCount++;
					}
				}

				if (unlockedCount > 0) {
					const targetDate = new Date(date);
					targetDate.setHours(0, 0, 0, 0);
					await CourtDashboardModel.findOneAndUpdate(
						{ court_id: courtId, sub_court_id: subCourt._id, date: targetDate },
						{ $inc: { available_slots: unlockedCount, blocked_slots: -unlockedCount } },
						{ upsert: true, new: true, session }
					);
				}
			}

			courtSlot.markModified('slots');
			await courtSlot.save({ session });

			// Cập nhật thông số Dashboard lần đầu nếu đây là slot mới
			if (isNewSlot) {
				const targetDate = new Date(date);
				targetDate.setHours(0, 0, 0, 0);
				await CourtDashboardModel.findOneAndUpdate(
					{ court_id: courtId, sub_court_id: subCourt._id, date: targetDate },
					{ $inc: { total_slots: courtSlot.slots.length, available_slots: courtSlot.slots.length } },
					{ upsert: true, new: true, session }
				);
			}
		}

		await session.commitTransaction();
		session.endSession();

		res.status(200).json({ message: action === 'lock' ? 'Tạm đóng sân thành công' : 'Mở lại sân thành công' });
	} catch (error: any) {
		await session.abortTransaction();
		session.endSession();

		const errorMap: Record<string, { status: number; message: string }> = {
			missing_fields: { status: 400, message: 'Thiếu thông tin yêu cầu' },
			missing_reason: { status: 400, message: 'Vui lòng nhập lý do tạm đóng' },
			court_not_found: { status: 404, message: 'Không tìm thấy sân' },
			sub_court_not_found: { status: 404, message: 'Không tìm thấy sân nhỏ' },
			invalid_time_range: { status: 400, message: 'Khung thời gian không hợp lệ' },
			slot_already_booked: { status: 400, message: 'Khung giờ này đã có người đặt, không thể khóa' }
		};

		const mapped = errorMap[error.message];
		if (mapped) {
			res.status(mapped.status).json({ error: mapped.message, code: error.message });
			return;
		}

		console.error('Lỗi setMaintenance:', error);
		res.status(500).json({ error: 'internal_server_error' });
	}
}
