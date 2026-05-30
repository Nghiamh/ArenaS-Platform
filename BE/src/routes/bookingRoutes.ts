import express from 'express';
import { generateCourtSlots, getCourtSlots, getOwnerBookings, getOwnerListBookings, ownerCreateBooking, userBookCourt, opponentPayBooking, getMyBookings, cancelBooking, lockSlots, unlockSlots, getMatchPendingDeposit } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. API Khởi tạo Slots (thường gọi bằng Cron Job mỗi đêm hoặc Admin/Owner thủ công)
router.post('/generate-slots', requireAuth, generateCourtSlots);


// 3. API Lấy danh sách Slot (Công khai hoặc Admin)
router.get('/slots/:courtId', getCourtSlots);

// 4. API Lấy danh sách bookings cho owner
router.get('/owner-bookings', requireAuth, getOwnerBookings);

// 4b. API Lấy danh sách bookings phân trang cho owner
router.get('/owner-list-bookings', requireAuth, getOwnerListBookings);

// 5. API Owner tạo booking thủ công
router.post('/owner-bookings', requireAuth, ownerCreateBooking);

// 6. API Khóa slot tạm thời và mở khóa
router.post('/lock-slots', requireAuth, lockSlots);
router.post('/unlock-slots', requireAuth, unlockSlots);

// 7. API User đặt sân (tích hợp wallet, auto-generate slots)
router.post('/user-book', requireAuth, userBookCourt);

// 7. API Lấy lịch sử booking của user
router.get('/my-bookings', requireAuth, getMyBookings);

// 8. API Hủy sân
router.post('/:id/cancel', requireAuth, cancelBooking);

// 9. API Đối thủ thanh toán 50% còn lại (matchmaking)
router.post('/:id/opponent-pay', requireAuth, opponentPayBooking);

// 10. API Lấy thông tin pending deposit cho match
router.get('/match/:matchId/pending-deposit', requireAuth, getMatchPendingDeposit);

export default router;
