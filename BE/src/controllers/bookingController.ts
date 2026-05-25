import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CourtSlotModel, ISlot } from '../models/courtSlotModel.js';
import { CourtDashboardModel } from '../models/courtDashboardModel.js';
import Court from '../models/courtModel.js';
import { BookingModel } from '../models/bookingModel.js';
import Wallet from '../models/walletModel.js';
import WalletTransaction from '../models/walletTransactionModel.js';

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
		const diffHours = (end[0] + end[1]/60) - (start[0] + start[1]/60);
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

// 7. API: User đặt sân (tích hợp wallet, auto-generate slots, tạo Booking thật)
export async function userBookCourt(req: Request, res: Response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const user = req.user!;
		const userId = user._id;
		const { court_id, sub_court_id, date, start_time, end_time } = req.body;

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
		const hasUnavailable = targetSlots.some(slot => slot.status !== 'available');
		if (hasUnavailable) {
			throw new Error('slot_already_booked');
		}

		const numberOfSlotsBooked = targetSlots.length;

		// --- Bước 4: Tính giá ---
		// 1 slot = 30 phút = nửa giá/h
		const total_price = (pricePerHour / 2) * numberOfSlotsBooked;

		// --- Bước 5: Kiểm tra và trừ tiền ví ---
		const wallet = await Wallet.findOne({ userId }).session(session);
		if (!wallet) {
			throw new Error('wallet_not_found');
		}
		if (wallet.status === 'frozen') {
			throw new Error('wallet_frozen');
		}
		if (wallet.balance < total_price) {
			throw new Error('insufficient_balance');
		}

		wallet.balance -= total_price;
		await wallet.save({ session });

		// --- Bước 6: Tạo Booking document ---
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
			status: 'confirmed',
			source: 'app',
			tone: 'blue',
		});
		await newBooking.save({ session });

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
				amount: total_price,
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

		return res.status(201).json({
			message: 'Đặt sân thành công!',
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
				status: 'confirmed',
				slots_booked: numberOfSlotsBooked,
				wallet_balance: wallet.balance,
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

// 8. API: Lấy lịch sử booking của user
export async function getMyBookings(req: Request, res: Response) {
	try {
		const userId = req.user!._id;
		const { status, page = '1', limit = '20' } = req.query;

		const query: any = { user_id: userId };
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

		const booking = await BookingModel.findOne({ _id: id, user_id: userId }).session(session);
		if (!booking) {
			throw new Error('booking_not_found');
		}

		if (booking.status !== 'confirmed') {
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
		
		// Parse in Vietnam Time (+07:00) explicitly
		const startTimeDate = new Date(`${bookingDateStr}T${booking.start_time}:00+07:00`);
		
		const now = new Date();
		const hoursDifference = (startTimeDate.getTime() - now.getTime()) / (1000 * 60 * 60);

		if (hoursDifference < 1) {
			throw new Error('too_late_to_cancel');
		}

		// Calculate refund percentage
		let refundPercentage = 0;
		if (hoursDifference >= 3) {
			refundPercentage = 1; // 100%
		} else {
			refundPercentage = 0.5; // 50%
		}

		const refundAmount = Math.floor(booking.total_price * refundPercentage);

		// Update booking status
		booking.status = 'cancelled';
		await booking.save({ session });

		// Refund to wallet if amount > 0
		if (refundAmount > 0) {
			const wallet = await Wallet.findOne({ userId: userId }).session(session);
			if (wallet) {
				wallet.balance += refundAmount;
				await wallet.save({ session });

				const tx = new WalletTransaction({
					walletId: wallet._id,
					bookingId: booking._id,
					type: 'refund',
					amount: refundAmount,
					status: 'completed',
				});
				await tx.save({ session });
			}

			// Xử lý giao dịch nhận tiền của chủ sân
			const ownerPortion = booking.total_price - refundAmount;
			
			// 1. Tìm xem có giao dịch pending nào không
			const pendingOwnerTx = await WalletTransaction.findOne({
				bookingId: booking._id,
				type: 'deposit',
				status: 'pending'
			}).session(session);

			if (pendingOwnerTx) {
				if (ownerPortion > 0) {
					// Chủ sân nhận được phần còn lại (phí hủy sân)
					pendingOwnerTx.amount = ownerPortion;
					await pendingOwnerTx.save({ session });
				} else {
					// Hoàn 100%, chủ sân không nhận được tiền
					pendingOwnerTx.status = 'failed';
					await pendingOwnerTx.save({ session });
				}
			} else {
				// 2. Nếu không có pending, có thể tiền đã được cộng (completed)
				// Cần hoàn lại bằng cách trừ ví và tạo giao dịch payment
				const completedOwnerTx = await WalletTransaction.findOne({
					bookingId: booking._id,
					type: 'deposit',
					status: 'completed'
				}).session(session);

				if (completedOwnerTx) {
					const court = await Court.findById(booking.court_id).session(session);
					if (court) {
						const ownerWallet = await Wallet.findOne({ userId: court.owner_id }).session(session);
						if (ownerWallet) {
							// Trừ phần tiền hoàn lại cho khách ra khỏi ví chủ sân
							ownerWallet.balance -= refundAmount;
							await ownerWallet.save({ session });

							// Tạo giao dịch ghi nhận việc hoàn tiền (trừ tiền ví chủ sân)
							const ownerRefundTx = new WalletTransaction({
								walletId: ownerWallet._id,
								bookingId: booking._id,
								type: 'payment', // payment nghĩa là trừ tiền khỏi ví
								amount: refundAmount,
								status: 'completed',
							});
							await ownerRefundTx.save({ session });
						}
					}
				}
			}
		}

		// Free up the court slots
		const courtSlot = await CourtSlotModel.findOne({
			court_id: booking.court_id,
			sub_court_id: booking.sub_court_id,
			date: booking.date
		}).session(session);

		if (courtSlot) {
			let slotsFreed = 0;
			courtSlot.slots.forEach((s: any) => {
				if (s.start >= booking.start_time && s.end <= booking.end_time && s.status === 'booked') {
					s.status = 'available';
					slotsFreed++;
				}
			});
			courtSlot.markModified('slots');
			await courtSlot.save({ session });

			if (slotsFreed > 0) {
				const targetDate = new Date(booking.date as any);
				targetDate.setHours(0, 0, 0, 0);
				await CourtDashboardModel.updateOne(
					{ court_id: booking.court_id, sub_court_id: booking.sub_court_id, date: targetDate },
					{ $inc: { available_slots: slotsFreed } },
					{ session }
				);
			}
		}

		await session.commitTransaction();
		return res.status(200).json({ 
			message: 'Hủy sân thành công', 
			refundAmount, 
			refundPercentage: refundPercentage * 100 
		});
	} catch (error: any) {
		await session.abortTransaction();
		const errorMap: Record<string, any> = {
			invalid_booking_id: { status: 400, message: 'Mã đặt sân không hợp lệ' },
			booking_not_found: { status: 404, message: 'Không tìm thấy thông tin đặt sân' },
			booking_cannot_be_cancelled: { status: 400, message: 'Chỉ có thể hủy sân đã được xác nhận' },
			too_late_to_cancel: { status: 400, message: 'Không thể hủy sân khi thời gian bắt đầu còn dưới 1 tiếng' },
		};

		const mapped = errorMap[error.message];
		if (mapped) {
			return res.status(mapped.status).json({ error: mapped.message });
		}

		console.error('Lỗi cancelBooking:', error);
		return res.status(500).json({ error: 'internal_server_error' });
	} finally {
		await session.endSession();
	}
}
