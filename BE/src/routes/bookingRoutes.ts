import express from 'express';
import { generateCourtSlots, bookCourtSlot, getCourtSlots } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. API Khởi tạo Slots (thường gọi bằng Cron Job mỗi đêm hoặc Admin/Owner thủ công)
router.post('/generate-slots', requireAuth, generateCourtSlots);

// 2. API Đặt sân (Booking)
router.post('/book-slot', requireAuth, bookCourtSlot);

// 3. API Lấy danh sách Slot (Công khai hoặc Admin)
router.get('/slots/:courtId', getCourtSlots);

export default router;
