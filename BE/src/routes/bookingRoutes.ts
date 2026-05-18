import express from 'express';
import { generateCourtSlots, bookCourtSlot, getCourtSlots, getOwnerBookings, ownerCreateBooking } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. API Khởi tạo Slots (thường gọi bằng Cron Job mỗi đêm hoặc Admin/Owner thủ công)
router.post('/generate-slots', requireAuth, generateCourtSlots);

// 2. API Đặt sân (Booking)
router.post('/book-slot', requireAuth, bookCourtSlot);

// 3. API Lấy danh sách Slot (Công khai hoặc Admin)
router.get('/slots/:courtId', getCourtSlots);

// 4. API Lấy danh sách bookings cho owner
router.get('/owner-bookings', requireAuth, getOwnerBookings);

// 5. API Owner tạo booking thủ công
router.post('/owner-bookings', requireAuth, ownerCreateBooking);

export default router;
