import express from 'express';
import { createReview, getCourtReviews, getReviewableBookings, getMyCourtReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reviews/court/:courtId — Lấy danh sách reviews (công khai)
router.get('/court/:courtId', getCourtReviews);

// GET /api/reviews/my-review/:courtId — Lấy review của mình
router.get('/my-review/:courtId', requireAuth, getMyCourtReview);

// GET /api/reviews/can-review/:courtId — Kiểm tra có thể đánh giá không
router.get('/can-review/:courtId', requireAuth, getReviewableBookings);

// POST /api/reviews — Tạo đánh giá mới
router.post('/', requireAuth, createReview);

// PUT /api/reviews/:reviewId — Cập nhật đánh giá
router.put('/:reviewId', requireAuth, updateReview);

// DELETE /api/reviews/:reviewId — Xóa đánh giá
router.delete('/:reviewId', requireAuth, deleteReview);

export default router;
