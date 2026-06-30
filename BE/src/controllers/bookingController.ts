import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CourtSlotModel, ISlot } from '../models/courtSlotModel.js';
import { CourtDashboardModel } from '../models/courtDashboardModel.js';
import Court from '../models/courtModel.js';
import { BookingModel } from '../models/bookingModel.js';
import Wallet from '../models/walletModel.js';
import WalletTransaction from '../models/walletTransactionModel.js';
import Match from '../models/matchModel.js';
import ChatMessage from '../models/chatMessageModel.js';
import { createNotification } from './notificationController.js';
import { consumeVoucher } from './voucherController.js';
import User from '../models/userModel.js';
import Voucher from '../models/voucherModel.js';

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

// 5. API: Lấy danh sách Booking của Owner
export async function getOwnerBookings(req: Request, res: Response) {
	try {
		const ownerId = (req as any).user._id;
		const { startDate, endDate } = req.query;

		// 1. Tìm tất cả các court_id thuộc về owner này
		const ownerCourts = await Court.find({ owner_id: ownerId }).select('_id');
		const courtIds = ownerCourts.map(c => c._id);

		// 2. Query bookings thuộc các court_id đó
		let query: any = { court_id: { $in: courtIds } };

		if (startDate && endDate) {
			query.date = { $gte: startDate as string, $lte: endDate as string };
		} else if (startDate) {
			query.date = startDate as string;
		}

		const bookings = await BookingModel.find(query);

		return res.status(200).json({
			message: 'Lấy danh sách booking thành công',
			bookings
		});
	} catch (error) {
		console.error('Lỗi khi lấy owner bookings:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 5b. API: Lấy danh sách Booking của Owner có phân trang (cho List View)
export async function getOwnerListBookings(req: Request, res: Response) {
	try {
		const ownerId = (req as any).user._id;
		const { page = '1', limit = '10', startDate, endDate } = req.query;

		const ownerCourts = await Court.find({ owner_id: ownerId }).select('_id');
		const courtIds = ownerCourts.map(c => c._id);

		let query: any = { court_id: { $in: courtIds } };
		if (startDate && endDate) {
			query.date = { $gte: startDate as string, $lte: endDate as string };
		} else if (startDate) {
			query.date = startDate as string;
		}

		const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
		const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);

		const [bookings, total] = await Promise.all([
			BookingModel.find(query)
				.sort({ createdAt: -1 })
				.skip((pageNum - 1) * limitNum)
				.limit(limitNum)
				.lean(),
			BookingModel.countDocuments(query),
		]);

		return res.status(200).json({
			message: 'Lấy danh sách booking phân trang thành công',
			bookings,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages: Math.ceil(total / limitNum),
			},
		});
	} catch (error) {
		console.error('Lỗi khi lấy owner list bookings:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 6. API: Owner tạo trực tiếp Booking
export async function ownerCreateBooking(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const ownerId = (req as any).user._id;
		const { court_id, sub_court_id, date, start_time, end_time, customer_name, customer_phone, note, status, source, tone } = req.body;

		// 1. Kiểm tra ownership
		const court = await Court.findOne({ _id: court_id, owner_id: ownerId }).session(session);
		if (!court) {
			throw new Error('not_found_or_not_authorized');
		}

		const pricePerHour = court.price_per_hour || 0;
		// Tính price (cơ bản: mỗi 30p = price/2)
		const start = start_time.split(':').map(Number);
		const end = end_time.split(':').map(Number);
		const diffHours = (end[0] + end[1] / 60) - (start[0] + start[1] / 60);
		const total_price = pricePerHour * diffHours;

		// Tạo Booking document
		const newBooking = new BookingModel({
			court_id,
			sub_court_id,
			date,
			start_time,
			end_time,
			customer_name,
			customer_phone,
			note,
			total_price,
			status: status || 'confirmed',
			source: source || 'phone',
			// @ts-ignore
			tone: tone || 'blue' // Lưu thêm tone nếu cần thiết
		});

		await newBooking.save({ session });

		// Cập nhật CourtSlot nếu đã generate (tuỳ chọn - nếu chưa generate thì bỏ qua cũng được)
		const courtSlot = await CourtSlotModel.findOne({ court_id, sub_court_id, date }).session(session);
		if (courtSlot) {
			let startIndex = -1;
			let endIndex = -1;

			for (let i = 0; i < courtSlot.slots.length; i++) {
				if (courtSlot.slots[i].start === start_time) startIndex = i;
				if (courtSlot.slots[i].end === end_time) endIndex = i;
			}

			if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
				const numberOfSlotsBooked = endIndex - startIndex + 1;
				for (let i = startIndex; i <= endIndex; i++) {
					courtSlot.slots[i].status = 'booked';
					courtSlot.slots[i].booking_id = newBooking._id as any;
				}
				await courtSlot.save({ session });

				// Cập nhật Dashboard
				const targetDate = new Date(date);
				targetDate.setHours(0, 0, 0, 0);

				await CourtDashboardModel.findOneAndUpdate(
					{ court_id, sub_court_id, date: targetDate },
					{
						$inc: {
							booked_slots: numberOfSlotsBooked,
							available_slots: -numberOfSlotsBooked,
							total_bookings: 1,
							revenue: total_price
						}
					},
					{ upsert: true, new: true, session }
				);
			}
		}

		await session.commitTransaction();
		session.endSession();

		return res.status(201).json({
			message: 'Tạo lịch đặt thành công',
			booking: newBooking
		});
	} catch (error: any) {
		await session.abortTransaction();
		session.endSession();
		console.error('Lỗi khi owner tạo booking:', error);
		if (error.message === 'not_found_or_not_authorized') {
			return res.status(403).json({ error: 'Không có quyền truy cập sân này' });
		}
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 6b. API: Lock Slots
export async function lockSlots(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const userId = req.user!._id;
		const { court_id, sub_court_id, date, start_time, end_time } = req.body;

		if (!court_id || !sub_court_id || !date || !start_time || !end_time) {
			throw new Error('missing_fields');
		}

		const court = await Court.findById(court_id).session(session);
		if (!court) throw new Error('court_not_found');

		let courtSlot = await CourtSlotModel.findOne({ court_id, sub_court_id, date }).session(session);
		if (!courtSlot) {
			const openTime = court.open_time || '06:00';
			const closeTime = court.close_time || '22:00';
			const slots = generateTimeSlots(openTime, closeTime);
			courtSlot = new CourtSlotModel({
				court_id,
				sub_court_id,
				date,
				slots,
			});
			await courtSlot.save({ session });

			const targetDate = new Date(date);
			targetDate.setHours(0, 0, 0, 0);
			await CourtDashboardModel.findOneAndUpdate(
				{ court_id, sub_court_id, date: targetDate },
				{ $inc: { total_slots: slots.length, available_slots: slots.length } },
				{ upsert: true, new: true, session }
			);
		}

		let startIndex = -1;
		let endIndex = -1;

		for (let i = 0; i < courtSlot.slots.length; i++) {
			if (courtSlot.slots[i].start === start_time) startIndex = i;
			if (courtSlot.slots[i].end === end_time) endIndex = i;
		}

		if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
			throw new Error('invalid_time_range');
		}

		// Bỏ qua lock cũ của user này trong cùng ngày để tránh kẹt
		for (const slot of courtSlot.slots) {
			if (slot.status === 'locked' && slot.locked_by?.toString() === userId.toString()) {
				slot.status = 'available';
				slot.locked_by = undefined;
				slot.locked_at = undefined;
			}
		}

		const targetSlots = courtSlot.slots.slice(startIndex, endIndex + 1);
		const hasUnavailable = targetSlots.some(slot => slot.status !== 'available');
		if (hasUnavailable) {
			throw new Error('slot_already_booked');
		}

		for (let i = startIndex; i <= endIndex; i++) {
			courtSlot.slots[i].status = 'locked';
			courtSlot.slots[i].locked_by = userId as any;
			courtSlot.slots[i].locked_at = new Date();
		}

		await courtSlot.save({ session });
		await session.commitTransaction();
		session.endSession();

		return res.status(200).json({ message: 'Khóa slot thành công' });
	} catch (error: any) {
		await session.abortTransaction();
		session.endSession();
		const errorMap: Record<string, { status: number; message: string }> = {
			missing_fields: { status: 400, message: 'Thiếu thông tin' },
			court_not_found: { status: 404, message: 'Không tìm thấy sân' },
			invalid_time_range: { status: 400, message: 'Khung thời gian không hợp lệ' },
			slot_already_booked: { status: 400, message: 'Khung giờ này được chọn' }
		};
		const mapped = errorMap[error.message];
		if (mapped) {
			return res.status(mapped.status).json({ error: mapped.message, code: error.message });
		}
		console.error('Lỗi lockSlots:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 6c. API: Unlock Slots (Hủy chọn)
export async function unlockSlots(req: Request, res: Response) {
	try {
		const userId = req.user!._id;
		const { court_id, sub_court_id, date } = req.body;

		const courtSlot = await CourtSlotModel.findOne({ court_id, sub_court_id, date });
		if (courtSlot) {
			let changed = false;
			for (const slot of courtSlot.slots) {
				if (slot.status === 'locked' && slot.locked_by?.toString() === userId.toString()) {
					slot.status = 'available';
					slot.locked_by = undefined;
					slot.locked_at = undefined;
					changed = true;
				}
			}
			if (changed) await courtSlot.save();
		}
		return res.status(200).json({ message: 'Mở khóa thành công' });
	} catch (error) {
		console.error('Lỗi unlockSlots:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

export async function userBookCourt(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const user = req.user!;
		const userId = user._id;
		const { court_id, sub_court_id, date, start_time, end_time, match_id, voucher_code, payment_type = 'split' } = req.body;

		// --- Validate input ---
		if (!court_id || !mongoose.Types.ObjectId.isValid(court_id)) {
			throw new Error('invalid_court_id');
		}
		if (!sub_court_id || !mongoose.Types.ObjectId.isValid(sub_court_id)) {
			throw new Error('invalid_sub_court_id');
		}
		if (!date || !start_time || !end_time) {
			throw new Error('missing_fields');
		}

		// Không cho đặt ngày trong quá khứ
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const bookingDate = new Date(date);
		bookingDate.setHours(0, 0, 0, 0);
		if (bookingDate < today) {
			throw new Error('cannot_book_past_date');
		}

		const court = await Court.findById(court_id).session(session);
		if (!court) {
			throw new Error('court_not_found');
		}

		if (court.owner_id.toString() === userId.toString()) {
			throw new Error('owner_cannot_book_own_court');
		}

		const subCourt = court.sub_courts?.find(
			(sc: any) => sc._id?.toString() === sub_court_id
		);

		// Lấy giá trực tiếp từ bảng courts (theo yêu cầu khách hàng)
		const pricePerHour = court.price_per_hour || 0;
		const openTime = court.open_time || '06:00';
		const closeTime = court.close_time || '22:00';

		// --- Bước 2: Auto-generate CourtSlot nếu chưa có ---
		let courtSlot = await CourtSlotModel.findOne({ court_id, sub_court_id, date }).session(session);

		if (!courtSlot) {
			const slots = generateTimeSlots(openTime, closeTime);
			courtSlot = new CourtSlotModel({
				court_id,
				sub_court_id,
				date,
				slots,
			});
			await courtSlot.save({ session });

			// Khởi tạo dashboard
			const targetDate = new Date(date);
			targetDate.setHours(0, 0, 0, 0);
			await CourtDashboardModel.findOneAndUpdate(
				{ court_id, sub_court_id, date: targetDate },
				{ $inc: { total_slots: slots.length, available_slots: slots.length } },
				{ upsert: true, new: true, session }
			);
		}

		// --- Bước 3: Tìm slot range và kiểm tra khả dụng ---
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
		const hasUnavailable = targetSlots.some(slot => {
			if (slot.status === 'available') return false;
			if (slot.status === 'locked' && slot.locked_by?.toString() === userId.toString()) return false;
			return true;
		});
		if (hasUnavailable) {
			throw new Error('slot_already_booked');
		}

		const numberOfSlotsBooked = targetSlots.length;

		// --- Bước 4: Tính giá ---
		// 1 slot = 30 phút = nửa giá/h
		const total_price = (pricePerHour / 2) * numberOfSlotsBooked;

		// Determine if this is a matchmaking booking (split 50/50)
		const isMatchBooking = !!(match_id && mongoose.Types.ObjectId.isValid(match_id));

		// --- Apply voucher ---
		let voucherDiscount = 0;
		let voucherId: string | undefined;
		let voucherPointsUsed = 0;
		if (voucher_code) {
			const vResult = await consumeVoucher(voucher_code, total_price, userId.toString(), session);
			if (vResult) {
				voucherDiscount = vResult.discountAmount;
				voucherId = vResult.voucherId;
				voucherPointsUsed = vResult.pointsCost;
			}
		}

		const discountedTotalPrice = Math.max(0, total_price - voucherDiscount);
		let chargeAmount = discountedTotalPrice;
		if (isMatchBooking && payment_type === 'split') {
			chargeAmount = Math.ceil(discountedTotalPrice / 2);
		}

		// --- Bước 5: Kiểm tra và trừ tiền ví ---
		const wallet = await Wallet.findOne({ userId }).session(session);
		if (!wallet) {
			throw new Error('wallet_not_found');
		}
		if (wallet.status === 'frozen') {
			throw new Error('wallet_frozen');
		}
		if (wallet.balance < chargeAmount) {
			throw new Error('insufficient_balance');
		}

		wallet.balance -= chargeAmount;
		await wallet.save({ session });

		// --- Bước 5b: Xác định đối thủ nếu là matchmaking ---
		let opponentId: string | null = null;
		if (isMatchBooking) {
			const match = await Match.findById(match_id).session(session);
			if (match) {
				const opp = match.participants.find((p: any) => p.toString() !== userId.toString());
				if (opp) opponentId = opp.toString();
			}
		}

		// --- Bước 6: Tạo Booking document ---
		const bookingStatus = (isMatchBooking && payment_type === 'split') ? 'waiting_opponent' : 'confirmed';
		const opponentDeadline = (isMatchBooking && payment_type === 'split') ? new Date(Date.now() + 30 * 60 * 1000) : undefined;

		let participants: any[] | undefined = undefined;
		if (isMatchBooking) {
			if (payment_type === 'split') {
				participants = [
					{ userId: new mongoose.Types.ObjectId(userId), amount: chargeAmount, status: 'paid' },
					...(opponentId ? [{ userId: new mongoose.Types.ObjectId(opponentId), amount: discountedTotalPrice - chargeAmount, status: 'unpaid' as const }] : []),
				];
			} else {
				participants = [
					{ userId: new mongoose.Types.ObjectId(userId), amount: chargeAmount, status: 'paid' },
					...(opponentId ? [{ userId: new mongoose.Types.ObjectId(opponentId), amount: 0, status: 'paid' as const }] : []),
				];
			}
		}

		const newBooking = new BookingModel({
			user_id: userId,
			court_id,
			sub_court_id,
			date,
			start_time,
			end_time,
			customer_name: user.name || user.userName || 'Khách hàng',
			customer_phone: user.phone,
			total_price,
			status: bookingStatus,
			source: 'app',
			match_id: isMatchBooking ? match_id : undefined,
			participants,
			opponent_deadline: opponentDeadline,
			voucher_id: voucherId,
			voucher_code: voucherId ? voucher_code : undefined,
			voucher_points_used: voucherPointsUsed,
			voucher_discount: voucherDiscount,
		});

		await newBooking.save({ session });

		// Cập nhật giờ hẹn của Trận đấu — CHỈ khi booking đã confirmed
		if (bookingStatus === 'confirmed' && isMatchBooking) {
			const match = await Match.findById(match_id).session(session);
			if (match) {
				const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
				match.scheduled_at = new Date(`${dateStr}T${start_time}:00`);
				match.scheduled_end_at = new Date(`${dateStr}T${end_time}:00`);
				await match.save({ session });
			}
		}

		// --- Bước 7: Cập nhật slot status ---
		for (let i = startIndex; i <= endIndex; i++) {
			courtSlot.slots[i].status = 'booked';
			courtSlot.slots[i].booking_id = newBooking._id as any;
		}
		await courtSlot.save({ session });

		// --- Bước 8: Tạo WalletTransaction ---
		const transactionsToCreate: any[] = [
			{
				walletId: wallet._id,
				bookingId: newBooking._id,
				amount: chargeAmount,
				type: 'payment',
				status: 'completed',
			}
		];

		// Tạo ví chủ sân nếu chưa có (số dư không cộng ngay)
		let ownerWallet = await Wallet.findOne({ userId: court.owner_id }).session(session);
		if (!ownerWallet) {
			ownerWallet = new Wallet({
				userId: court.owner_id,
				balance: 0,
				status: 'active',
			});
			await ownerWallet.save({ session });
		}

		transactionsToCreate.push({
			walletId: ownerWallet._id,
			bookingId: newBooking._id,
			amount: total_price,
			type: 'deposit',
			status: 'pending', // Tiền được giữ ở trạng thái chờ (hold) cho đến khi trận đấu kết thúc
		});

		await WalletTransaction.insertMany(transactionsToCreate, { session });

		// --- Bước 9: Cập nhật Dashboard ---
		const dashDate = new Date(date);
		dashDate.setHours(0, 0, 0, 0);

		await CourtDashboardModel.findOneAndUpdate(
			{ court_id, sub_court_id, date: dashDate },
			{
				$inc: {
					booked_slots: numberOfSlotsBooked,
					available_slots: -numberOfSlotsBooked,
					total_bookings: 1,
					revenue: total_price,
				},
			},
			{ upsert: true, new: true, session }
		);

		// --- COMMIT ---
		await session.commitTransaction();
		session.endSession();

		// Award points for booking a court (non-matchmaking = full booking, matchmaking = 50% deposit)
		User.findByIdAndUpdate(userId, { $inc: { points: 10, xp: 15 } }).catch(() => {});

		// --- Bước 10: Notify qua Socket ---
		if (isMatchBooking) {
			try {
				const match = await Match.findById(match_id);
				if (match) {
					const io = req.app.get('io');
					const courtDisplayName = subCourt?.name ? `${court.name} - ${subCourt.name}` : court.name;
					const formattedTotal = new Intl.NumberFormat('vi-VN').format(total_price);

					if (payment_type === 'split') {
						const formattedPrice = new Intl.NumberFormat('vi-VN').format(chargeAmount);
						// Chat message: Player A đã đặt cọc 50%
						const msgContent = `Tôi đã đặt cọc 50% cho sân!\nTên sân: ${courtDisplayName}\nNgày giờ: ${date} ${start_time} - ${end_time}\nSố tiền cọc: ${formattedPrice} đ / Tổng: ${formattedTotal} đ\nĐợi bạn thanh toán 50% còn lại trong 30 phút.`;
						const newMsg = new ChatMessage({
							match_id,
							sender_id: userId,
							message: msgContent,
						});
						await newMsg.save();

						io.to(`match:${match_id}`).emit('receive_message', {
							_id: newMsg._id,
							match_id,
							sender_id: userId.toString(),
							message: newMsg.message,
							createdAt: newMsg.createdAt,
						});

						// Emit opponent_deposit_required to the opponent
						if (opponentId) {
							io.to(`user:${opponentId}`).emit('opponent_deposit_required', {
								matchId: match_id,
								bookingId: (newBooking._id as any).toString(),
								bookedByUserId: userId.toString(),
								courtName: courtDisplayName,
								date,
								start_time,
								end_time,
								total_price,
								opponent_amount: discountedTotalPrice - chargeAmount,
								deadline: opponentDeadline?.toISOString(),
							});
						}

						// Also notify booker
						io.to(`user:${userId.toString()}`).emit('court_booked', {
							matchId: match_id,
							bookedByUserId: userId.toString(),
							courtName: courtDisplayName,
							date,
							start_time,
							end_time,
							status: 'waiting_opponent',
						});
					} else {
						// payment_type === 'full'
						const msgContent = `Tôi đã thanh toán toàn bộ tiền sân!\nTên sân: ${courtDisplayName}\nNgày giờ: ${date} ${start_time} - ${end_time}\nGiá: ${formattedTotal} đ`;
						const newMsg = new ChatMessage({
							match_id,
							sender_id: userId,
							message: msgContent,
						});
						await newMsg.save();

						io.to(`match:${match_id}`).emit('receive_message', {
							_id: newMsg._id,
							match_id,
							sender_id: userId.toString(),
							message: newMsg.message,
							createdAt: newMsg.createdAt,
						});

						const payload = {
							matchId: match_id,
							bookedByUserId: userId.toString(),
							courtName: courtDisplayName,
							date,
							start_time,
							end_time,
							status: 'confirmed',
						};
						for (const p of match.participants) {
							io.to(`user:${p.toString()}`).emit('court_booked', payload);
						}
					}
				}
			} catch (socketErr) {
				console.error('Socket notify matchmaking booking error:', socketErr);
			}
		}

		// --- Bước 11: Notify Owner about the new booking ---
		const cycleLabel = isMatchBooking ? "đặt cọc 50%" : "đặt sân";
		const courtDisplayName = subCourt?.name ? `${court.name} - ${subCourt.name}` : court.name;
		void createNotification({
			recipientId: court.owner_id.toString(),
			type: "booking_created",
			title: "Đơn đặt sân mới 🗓",
			message: `Khách hàng ${user.name || user.userName} vừa ${cycleLabel} tại ${courtDisplayName} vào ${date} lúc ${start_time}.`,
			link: "/owner/bookings",
		});

		return res.status(201).json({
			message: (isMatchBooking && payment_type === 'split') ? 'Đặt cọc 50% thành công! Đợi đối thủ thanh toán.' : 'Đặt sân thành công!',
			booking: {
				_id: newBooking._id,
				court_id,
				sub_court_id,
				court_name: court.name,
				sub_court_name: subCourt?.name || 'Sân',
				date,
				start_time,
				end_time,
				total_price,
				charged_amount: chargeAmount,
				voucher_discount: voucherDiscount,
				status: bookingStatus,
				slots_booked: numberOfSlotsBooked,
				wallet_balance: wallet.balance,
				opponent_deadline: opponentDeadline?.toISOString(),
			},
		});
	} catch (error: any) {
		await session.abortTransaction();
		session.endSession();

		const errorMap: Record<string, { status: number; message: string }> = {
			invalid_court_id: { status: 400, message: 'ID sân không hợp lệ' },
			invalid_sub_court_id: { status: 400, message: 'ID sân con không hợp lệ' },
			missing_fields: { status: 400, message: 'Thiếu thông tin đặt sân' },
			cannot_book_past_date: { status: 400, message: 'Không thể đặt sân cho ngày đã qua' },
			court_not_found: { status: 404, message: 'Không tìm thấy sân' },
			owner_cannot_book_own_court: { status: 403, message: 'Bạn không thể tự đặt lịch cho sân của chính mình' },
			invalid_time_range: { status: 400, message: 'Khung thời gian không hợp lệ' },
			slot_already_booked: { status: 400, message: 'Khung giờ này đã có người đặt. Vui lòng chọn giờ khác.' },
			wallet_not_found: { status: 404, message: 'Chưa có ví. Vui lòng tạo ví trước.' },
			wallet_frozen: { status: 403, message: 'Ví đã bị khóa' },
			insufficient_balance: { status: 400, message: 'Số dư ví không đủ. Vui lòng nạp thêm tiền.' },
		};

		const mapped = errorMap[error.message];
		if (mapped) {
			return res.status(mapped.status).json({ error: mapped.message, code: error.message });
		}

		if (error.name === 'VersionError') {
			return res.status(409).json({ error: 'Đang xử lý giao dịch khác. Vui lòng thử lại.', code: 'version_conflict' });
		}

		console.error('Lỗi userBookCourt:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 7b. API: Đối thủ thanh toán 50% còn lại cho matchmaking booking
export async function opponentPayBooking(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const userId = req.user!._id;
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new Error('invalid_booking_id');
		}

		const booking = await BookingModel.findById(id).session(session);
		if (!booking) {
			throw new Error('booking_not_found');
		}

		if (booking.status !== 'waiting_opponent') {
			throw new Error('booking_not_waiting');
		}

		// Check deadline
		if (booking.opponent_deadline && new Date() > booking.opponent_deadline) {
			throw new Error('opponent_deadline_expired');
		}

		// Find the opponent participant entry
		const participantEntry = booking.participants?.find(
			(p) => p.userId.toString() === userId.toString() && p.status === 'unpaid'
		);
		if (!participantEntry) {
			throw new Error('not_the_opponent');
		}

		const opponentAmount = participantEntry.amount;

		// Check wallet
		const wallet = await Wallet.findOne({ userId }).session(session);
		if (!wallet) {
			throw new Error('wallet_not_found');
		}
		if (wallet.status === 'frozen') {
			throw new Error('wallet_frozen');
		}
		if (wallet.balance < opponentAmount) {
			throw new Error('insufficient_balance');
		}

		// Deduct from opponent wallet
		wallet.balance -= opponentAmount;
		await wallet.save({ session });

		// Update participant status
		participantEntry.status = 'paid';
		booking.status = 'confirmed';
		booking.opponent_deadline = undefined;
		booking.markModified('participants');
		await booking.save({ session });

		// Set match.scheduled_at now that both have paid
		if (booking.match_id && mongoose.Types.ObjectId.isValid(booking.match_id)) {
			const match = await Match.findById(booking.match_id).session(session);
			if (match) {
				const dateStr = typeof booking.date === 'string' ? booking.date.split('T')[0] : new Date(booking.date as any).toISOString().split('T')[0];
				match.scheduled_at = new Date(`${dateStr}T${booking.start_time}:00`);
				match.scheduled_end_at = new Date(`${dateStr}T${booking.end_time}:00`);
				await match.save({ session });
			}
		}

		// Create wallet transaction for opponent payment
		const tx = new WalletTransaction({
			walletId: wallet._id,
			bookingId: booking._id,
			amount: opponentAmount,
			type: 'payment',
			status: 'completed',
		});
		await tx.save({ session });

		await session.commitTransaction();

		// Award points to opponent for completing their booking payment
		User.findByIdAndUpdate(userId, { $inc: { points: 10, xp: 15 } }).catch(() => {});

		// --- Socket notifications ---
		if (booking.match_id) {
			try {
				const match = await Match.findById(booking.match_id);
				const court = await Court.findById(booking.court_id);
				if (match && court) {
					const io = req.app.get('io');
					const courtDisplayName = court.name;

					// Notify all participants that booking is confirmed
					const payload = {
						matchId: booking.match_id.toString(),
						bookedByUserId: booking.user_id?.toString(),
						courtName: courtDisplayName,
						date: booking.date,
						start_time: booking.start_time,
						end_time: booking.end_time,
						status: 'confirmed',
					};
					for (const p of match.participants) {
						io.to(`user:${p.toString()}`).emit('court_booked', payload);
					}

					// Chat message
					const formattedPrice = new Intl.NumberFormat('vi-VN').format(opponentAmount);
					const msgContent = `Tôi đã thanh toán 50% còn lại (${formattedPrice} đ).\nĐặt sân đã được xác nhận! `;
					const newMsg = new ChatMessage({
						match_id: booking.match_id,
						sender_id: userId,
						message: msgContent,
					});
					await newMsg.save();

					io.to(`match:${booking.match_id}`).emit('receive_message', {
						_id: newMsg._id,
						match_id: booking.match_id.toString(),
						sender_id: userId.toString(),
						message: newMsg.message,
						createdAt: newMsg.createdAt,
					});
				}
			} catch (socketErr) {
				console.error('Socket notify opponent_paid error:', socketErr);
			}
		}

		return res.status(200).json({
			message: 'Thanh toán thành công! Đặt sân đã được xác nhận.',
			booking: {
				_id: booking._id,
				status: 'confirmed',
				total_price: booking.total_price,
				opponent_amount: opponentAmount,
				wallet_balance: wallet.balance,
			},
		});
	} catch (error: any) {
		await session.abortTransaction();
		const errorMap: Record<string, any> = {
			invalid_booking_id: { status: 400, message: 'Mã đặt sân không hợp lệ' },
			booking_not_found: { status: 404, message: 'Không tìm thấy booking' },
			booking_not_waiting: { status: 400, message: 'Booking này không ở trạng thái chờ thanh toán' },
			opponent_deadline_expired: { status: 400, message: 'Đã hết thời hạn thanh toán (30 phút)' },
			not_the_opponent: { status: 403, message: 'Bạn không phải đối thủ cần thanh toán' },
			wallet_not_found: { status: 404, message: 'Chưa có ví. Vui lòng tạo ví trước.' },
			wallet_frozen: { status: 403, message: 'Ví đã bị khóa' },
			insufficient_balance: { status: 400, message: 'Số dư ví không đủ. Vui lòng nạp thêm tiền.' },
		};
		const mapped = errorMap[error.message];
		if (mapped) {
			return res.status(mapped.status).json({ error: mapped.message, code: error.message });
		}
		console.error('Lỗi opponentPayBooking:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	} finally {
		await session.endSession();
	}
}

// 8. API: Lấy lịch sử booking của user
export async function getMyBookings(req: Request, res: Response) {
	try {
		const userId = req.user!._id;
		const { status, page = '1', limit = '20' } = req.query;

		const query: any = {
			$or: [
				{ user_id: userId },
				{ 'participants.userId': userId }
			]
		};
		if (status && typeof status === 'string') {
			query.status = status;
		}

		const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
		const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

		const [bookings, total] = await Promise.all([
			BookingModel.find(query)
				.sort({ date: -1, start_time: -1 })
				.skip((pageNum - 1) * limitNum)
				.limit(limitNum)
				.populate({
					path: 'match_id',
					populate: {
						path: 'participants',
						select: 'name userName avatarUrl',
					},
				})
				.lean(),
			BookingModel.countDocuments(query),
		]);

		// Populate court names
		const courtIds = [...new Set(bookings.map(b => b.court_id.toString()))];
		const courts = await Court.find({ _id: { $in: courtIds } }).select('name sub_courts').lean();
		const courtMap: Record<string, any> = {};
		courts.forEach(c => { courtMap[(c._id as any).toString()] = c; });

		const enrichedBookings = bookings.map(b => {
			const court = courtMap[b.court_id.toString()];
			const subCourt = court?.sub_courts?.find(
				(sc: any) => sc._id?.toString() === b.sub_court_id.toString()
			);
			return {
				...b,
				court_name: court?.name || 'Sân không xác định',
				sub_court_name: subCourt?.name || 'Sân',
			};
		});

		return res.status(200).json({
			message: 'Lấy lịch sử booking thành công',
			bookings: enrichedBookings,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages: Math.ceil(total / limitNum),
			},
		});
	} catch (error) {
		console.error('Lỗi getMyBookings:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

// 9. API: Hủy booking của user
export async function cancelBooking(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const userId = req.user!._id;
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new Error('invalid_booking_id');
		}

		// For matchmaking bookings, any participant can cancel
		const booking = await BookingModel.findById(id).session(session);
		if (!booking) {
			throw new Error('booking_not_found');
		}

		const isBooker = booking.user_id?.toString() === userId.toString();
		const isMatchParticipant = booking.participants?.some(
			(p) => p.userId.toString() === userId.toString()
		);
		const isMatchBooking = !!(booking.match_id && booking.participants && booking.participants.length > 0);

		if (!isBooker && !isMatchParticipant) {
			throw new Error('booking_not_found');
		}

		if (booking.status !== 'confirmed' && booking.status !== 'waiting_opponent') {
			throw new Error('booking_cannot_be_cancelled');
		}

		// Calculate hours until start
		let bookingDateStr = '';
		if (typeof booking.date === 'string') {
			bookingDateStr = booking.date.split('T')[0];
		} else {
			const d = new Date(booking.date as any);
			const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
			bookingDateStr = vnTime.toISOString().split('T')[0];
		}

		const startTimeDate = new Date(`${bookingDateStr}T${booking.start_time}:00+07:00`);
		const now = new Date();
		const hoursDifference = (startTimeDate.getTime() - now.getTime()) / (1000 * 60 * 60);

		let finalRefundPercentage = 0;
		let finalRefundAmount = 0;

		// --- MATCHMAKING BOOKING CANCELLATION ---
		if (isMatchBooking) {
			if (booking.status === 'waiting_opponent') {
				// Cancel freely with 100% refund to booker
				booking.status = 'cancelled';
				await booking.save({ session });

				finalRefundPercentage = 100;

				const bookerParticipant = booking.participants?.find(p => p.status === 'paid');
				if (bookerParticipant) {
					finalRefundAmount = bookerParticipant.amount;
					const wallet = await Wallet.findOne({ userId: bookerParticipant.userId }).session(session);
					if (wallet) {
						wallet.balance += bookerParticipant.amount;
						await wallet.save({ session });
						await new WalletTransaction({
							walletId: wallet._id, bookingId: booking._id,
							type: 'refund', amount: bookerParticipant.amount, status: 'completed',
						}).save({ session });
					}
					bookerParticipant.status = 'refunded';
					booking.markModified('participants');
					await booking.save({ session });
				}

				const pendingOwnerTx = await WalletTransaction.findOne({
					bookingId: booking._id, type: 'deposit', status: 'pending'
				}).session(session);
				if (pendingOwnerTx) {
					pendingOwnerTx.status = 'failed';
					await pendingOwnerTx.save({ session });
				}
			} else {
				// CONFIRMED matchmaking booking — apply 3-tier rules
				const cancellerEntry = booking.participants?.find(p => p.userId.toString() === userId.toString());
				const otherEntry = booking.participants?.find(p => p.userId.toString() !== userId.toString());

				if (!cancellerEntry || !otherEntry) {
					throw new Error('booking_not_found');
				}

				let cancellerRefundPct = 0;
				let ownerPenaltyPct = 0;

				if (hoursDifference >= 3) {
					cancellerRefundPct = 1; ownerPenaltyPct = 0;
				} else if (hoursDifference >= 1) {
					cancellerRefundPct = 0.5; ownerPenaltyPct = 0.5;
				} else {
					cancellerRefundPct = 0; ownerPenaltyPct = 1;
				}

				const responsibleAmount = Math.ceil((booking.total_price - (booking.voucher_discount || 0)) / 2);
				const ownerPenalty = Math.floor(responsibleAmount * ownerPenaltyPct);
				const cancellerPaidAmount = cancellerEntry.amount;
				
				let extraFeeRequired = 0;
				let cancellerRefund = 0;

				if (ownerPenalty > cancellerPaidAmount) {
					extraFeeRequired = ownerPenalty - cancellerPaidAmount;
					cancellerRefund = 0;
				} else {
					extraFeeRequired = 0;
					cancellerRefund = cancellerPaidAmount - ownerPenalty;
				}

				let cancellerWallet = null;
				if (extraFeeRequired > 0 || cancellerRefund > 0) {
					cancellerWallet = await Wallet.findOne({ userId: cancellerEntry.userId }).session(session);
					if (!cancellerWallet) {
						throw new Error('wallet_not_found');
					}
					if (extraFeeRequired > 0 && cancellerWallet.balance < extraFeeRequired) {
						throw new Error(`insufficient_balance_for_cancellation:${extraFeeRequired}`);
					}
				}

				finalRefundPercentage = cancellerRefundPct * 100;
				finalRefundAmount = cancellerRefund;

				booking.status = 'cancelled';
				await booking.save({ session });

				// Deduct extra fee or refund canceller
				if (extraFeeRequired > 0 && cancellerWallet) {
					cancellerWallet.balance -= extraFeeRequired;
					await cancellerWallet.save({ session });
					await new WalletTransaction({
						walletId: cancellerWallet._id, bookingId: booking._id,
						type: 'payment', amount: extraFeeRequired, status: 'completed',
						description: 'Phí hủy sân ghép trận'
					}).save({ session });
				} else if (cancellerRefund > 0 && cancellerWallet) {
					cancellerWallet.balance += cancellerRefund;
					await cancellerWallet.save({ session });
					await new WalletTransaction({
						walletId: cancellerWallet._id, bookingId: booking._id,
						type: 'refund', amount: cancellerRefund, status: 'completed',
					}).save({ session });
				}
				cancellerEntry.status = 'refunded';

				// Refund other player 100% of what they paid
				const otherRefund = otherEntry.amount;
				if (otherRefund > 0 && otherEntry.status === 'paid') {
					const otherWallet = await Wallet.findOne({ userId: otherEntry.userId }).session(session);
					if (otherWallet) {
						otherWallet.balance += otherRefund;
						await otherWallet.save({ session });
						await new WalletTransaction({
							walletId: otherWallet._id, bookingId: booking._id,
							type: 'refund', amount: otherRefund, status: 'completed',
						}).save({ session });
					}
				}
				otherEntry.status = 'refunded';
				booking.markModified('participants');
				await booking.save({ session });

				// Handle owner deposit tx
				const pendingOwnerTx = await WalletTransaction.findOne({
					bookingId: booking._id, type: 'deposit', status: 'pending'
				}).session(session);
				if (pendingOwnerTx) {
					if (ownerPenalty > 0) {
						pendingOwnerTx.amount = ownerPenalty;
						await pendingOwnerTx.save({ session });
					} else {
						pendingOwnerTx.status = 'failed';
						await pendingOwnerTx.save({ session });
					}
				}
			}
		} else {
			// --- NORMAL BOOKING CANCELLATION (giữ nguyên logic cũ) ---
			if (hoursDifference < 1) {
				throw new Error('too_late_to_cancel');
			}
			let refundPercentage = hoursDifference >= 3 ? 1 : 0.5;
			const refundAmount = Math.floor(booking.total_price * refundPercentage);

			finalRefundPercentage = refundPercentage * 100;
			finalRefundAmount = refundAmount;

			booking.status = 'cancelled';
			await booking.save({ session });

			if (refundAmount > 0) {
				const wallet = await Wallet.findOne({ userId }).session(session);
				if (wallet) {
					wallet.balance += refundAmount;
					await wallet.save({ session });
					await new WalletTransaction({
						walletId: wallet._id, bookingId: booking._id,
						type: 'refund', amount: refundAmount, status: 'completed',
					}).save({ session });
				}

				const ownerPortion = booking.total_price - refundAmount;
				const pendingOwnerTx = await WalletTransaction.findOne({
					bookingId: booking._id, type: 'deposit', status: 'pending'
				}).session(session);
				if (pendingOwnerTx) {
					if (ownerPortion > 0) {
						pendingOwnerTx.amount = ownerPortion;
						await pendingOwnerTx.save({ session });
					} else {
						pendingOwnerTx.status = 'failed';
						await pendingOwnerTx.save({ session });
					}
				} else {
					const completedOwnerTx = await WalletTransaction.findOne({
						bookingId: booking._id, type: 'deposit', status: 'completed'
					}).session(session);
					if (completedOwnerTx) {
						const court = await Court.findById(booking.court_id).session(session);
						if (court) {
							const ownerWallet = await Wallet.findOne({ userId: court.owner_id }).session(session);
							if (ownerWallet) {
								ownerWallet.balance -= refundAmount;
								await ownerWallet.save({ session });
								await new WalletTransaction({
									walletId: ownerWallet._id, bookingId: booking._id,
									type: 'payment', amount: refundAmount, status: 'completed',
								}).save({ session });
							}
						}
					}
				}
			}
		}

		// --- VOUCHER REFUND ---
		if (booking.voucher_id) {
			const voucher = await Voucher.findById(booking.voucher_id).session(session);
			if (voucher) {
				if (voucher.pointsCost === 0) {
					// Free voucher: Remove user from usedBy, decrement usedCount
					voucher.usedBy = voucher.usedBy.filter((id: any) => id.toString() !== booking.user_id?.toString());
					if (voucher.usedCount > 0) voucher.usedCount -= 1;
					if (voucher.status === 'expired' && voucher.usedCount < voucher.maxUses) {
						// Only reactivate if it hasn't passed expiryDate
						const today = new Date().toISOString().split('T')[0];
						if (voucher.expiryDate >= today) voucher.status = 'active';
					}
					await voucher.save({ session });
				} else {
					// Points voucher: Do NOT refund points. Add user back to usedBy so they can use it again.
					// Note: usedCount is NOT decremented because the user still owns the "redeemed" status.
					if (booking.user_id) {
						voucher.usedBy.push(new mongoose.Types.ObjectId(booking.user_id));
					}
					await voucher.save({ session });
				}
			}
		}

		// Free up the court slots
		const courtSlot = await CourtSlotModel.findOne({
			court_id: booking.court_id, sub_court_id: booking.sub_court_id, date: booking.date
		}).session(session);
		if (courtSlot) {
			let slotsFreed = 0;
			courtSlot.slots.forEach((s: any) => {
				if (s.start >= booking.start_time && s.end <= booking.end_time && s.status === 'booked') {
					s.status = 'available'; slotsFreed++;
				}
			});
			courtSlot.markModified('slots');
			await courtSlot.save({ session });
			if (slotsFreed > 0) {
				const targetDate = new Date(booking.date as any);
				targetDate.setHours(0, 0, 0, 0);
				await CourtDashboardModel.updateOne(
					{ court_id: booking.court_id, sub_court_id: booking.sub_court_id, date: targetDate },
					{ $inc: { available_slots: slotsFreed } }, { session }
				);
			}
		}

		// Notify via Chat if match_id exists
		if (booking.match_id && mongoose.Types.ObjectId.isValid(booking.match_id)) {
			try {
				const match = await Match.findById(booking.match_id).session(session);
				if (match) {
					const court = await Court.findById(booking.court_id).session(session);
					const courtDisplayName = court ? court.name : 'Sân';
					const msgContent = `Tôi đã huỷ đặt sân!\nTên sân: ${courtDisplayName}\nNgày giờ: ${bookingDateStr} ${booking.start_time} - ${booking.end_time}`;
					const newMsg = new ChatMessage({ match_id: booking.match_id, sender_id: userId, message: msgContent });
					await newMsg.save({ session });
					match.scheduled_at = undefined;
					await match.save({ session });

					const io = req.app.get('io');
					if (io) {
						io.to(`match:${booking.match_id}`).emit('receive_message', {
							_id: newMsg._id, match_id: booking.match_id,
							sender_id: userId.toString(), message: newMsg.message, createdAt: newMsg.createdAt,
						});
						for (const p of match.participants) {
							io.to(`user:${p.toString()}`).emit('court_cancelled', {
								matchId: booking.match_id, cancelledByUserId: userId.toString(),
								courtName: courtDisplayName, date: bookingDateStr,
								start_time: booking.start_time, end_time: booking.end_time,
							});
						}
					}
				}
			} catch (socketErr) {
				console.error('Socket notify court_cancelled error:', socketErr);
			}
		}

		await session.commitTransaction();

		// Notify Owner about the cancellation
		const court = await Court.findById(booking.court_id);
		if (court) {
			void createNotification({
				recipientId: court.owner_id.toString(),
				type: "booking_cancelled",
				title: "Lịch đặt sân đã bị hủy ✕",
				message: `Lịch đặt của khách hàng ${booking.customer_name} vào ${bookingDateStr} lúc ${booking.start_time} đã bị hủy.`,
				link: "/owner/bookings",
			});
		}

		return res.status(200).json({
			message: 'Hủy sân thành công',
			refundPercentage: finalRefundPercentage,
			refundAmount: finalRefundAmount,
		});
	} catch (error: any) {
		await session.abortTransaction();
		const errorMap: Record<string, any> = {
			invalid_booking_id: { status: 400, message: 'Mã đặt sân không hợp lệ' },
			booking_not_found: { status: 404, message: 'Không tìm thấy thông tin đặt sân' },
			booking_cannot_be_cancelled: { status: 400, message: 'Chỉ có thể hủy sân đã được xác nhận' },
			too_late_to_cancel: { status: 400, message: 'Không thể hủy sân khi thời gian bắt đầu còn dưới 1 tiếng' },
			wallet_not_found: { status: 404, message: 'Không tìm thấy ví để hoàn tiền/thu phí' },
		};
		const mapped = errorMap[error.message];
		if (mapped) return res.status(mapped.status).json({ error: mapped.message });
		if (error.message && error.message.startsWith('insufficient_balance_for_cancellation:')) {
			const amount = error.message.split(':')[1];
			const formattedAmount = new Intl.NumberFormat('vi-VN').format(Number(amount));
			return res.status(400).json({ error: `Bạn cần thanh toán phí hủy là ${formattedAmount} đ. Ví của bạn không đủ số dư.`, code: 'insufficient_balance_for_cancellation' });
		}
		console.error('Lỗi cancelBooking:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	} finally {
		await session.endSession();
	}
}

// 10. API: Lấy thông tin pending deposit cho đối thủ trong match
export async function getMatchPendingDeposit(req: Request, res: Response) {
	try {
		const userId = req.user!._id;
		const { matchId } = req.params;

		if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
			return res.status(400).json({ error: 'matchId không hợp lệ' });
		}

		// Find booking that's waiting for opponent payment in this match
		const booking = await BookingModel.findOne({
			match_id: matchId,
			status: 'waiting_opponent',
		});

		if (!booking || !booking.participants) {
			return res.status(200).json({ pending_deposit: null });
		}

		// Check if current user is the unpaid participant
		const unpaidEntry = booking.participants.find(
			(p) => p.userId.toString() === userId.toString() && p.status === 'unpaid'
		);

		if (!unpaidEntry) {
			return res.status(200).json({ pending_deposit: null });
		}

		// Check deadline
		const deadline = booking.opponent_deadline;
		if (deadline && new Date() > deadline) {
			return res.status(200).json({ pending_deposit: null, expired: true });
		}

		return res.status(200).json({
			pending_deposit: {
				bookingId: (booking._id as any).toString(),
				amount: unpaidEntry.amount,
				deadline: deadline?.toISOString() || null,
			},
		});
	} catch (error) {
		console.error('getMatchPendingDeposit error:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	}
}

