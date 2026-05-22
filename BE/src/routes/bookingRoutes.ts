import express from 'express';
import { generateCourtSlots, getCourtSlots, getOwnerBookings, ownerCreateBooking, userBookCourt, getMyBookings, cancelBooking } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. API Khởi tạo Slots (thường gọi bằng Cron Job mỗi đêm hoặc Admin/Owner thủ công)
router.post('/generate-slots', requireAuth, generateCourtSlots);


// 3. API Lấy danh sách Slot (Công khai hoặc Admin)
router.get('/slots/:courtId', getCourtSlots);

// 4. API Lấy danh sách bookings cho owner
router.get('/owner-bookings', requireAuth, getOwnerBookings);

// 5. API Owner tạo booking thủ công
router.post('/owner-bookings', requireAuth, ownerCreateBooking);

// 6. API User đặt sân (tích hợp wallet, auto-generate slots)
router.post('/user-book', requireAuth, userBookCourt);

// 7. API Lấy lịch sử booking của user
router.get('/my-bookings', requireAuth, getMyBookings);

// 8. API Hủy sân
router.post('/:id/cancel', requireAuth, cancelBooking);

export default router;
