import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReviewModel } from '../models/reviewModel.js';
import { BookingModel } from '../models/bookingModel.js';
import Court from '../models/courtModel.js';

// POST /api/reviews — Tạo đánh giá (phải đã đặt sân này ít nhất 1 lần)
export async function createReview(req: Request, res: Response) {
  try {
    const user = req.user!;
    const userId = user._id;
    const { court_id, rating, comment } = req.body;

    if (!court_id || !mongoose.Types.ObjectId.isValid(court_id)) {
      return res.status(400).json({ error: 'ID sân không hợp lệ' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5 sao' });
    }

    // Kiểm tra user đã từng chơi ở sân này chưa (end_time < now)
    const bookings = await BookingModel.find({
      user_id: userId,
      court_id,
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const now = new Date();
    const hasPlayed = bookings.some(b => {
      const dateStr = typeof b.date === 'string' ? b.date : (b.date as any).toISOString().split('T')[0];
      const endTime = new Date(`${dateStr}T${b.end_time}:00`);
      return endTime < now;
    });

    if (!hasPlayed) {
      return res.status(403).json({ error: 'Bạn chưa từng đặt và chơi tại sân này, không thể đánh giá.' });
    }

    // Kiểm tra đã đánh giá chưa
    const existing = await ReviewModel.findOne({ user_id: userId, court_id });
    if (existing) {
      return res.status(400).json({ error: 'Bạn đã đánh giá sân này rồi.' });
    }

    // Tạo review
    const review = new ReviewModel({
      user_id: userId,
      court_id,
      rating: Number(rating),
      comment: comment?.trim() || undefined,
      user_name: user.name || user.userName || 'Người dùng',
      user_avatar: user.avatarUrl || undefined,
    });
    await review.save();

    // Cập nhật avg_rating trên Court
    const stats = await ReviewModel.aggregate([
      { $match: { court_id: new mongoose.Types.ObjectId(court_id) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Court.findByIdAndUpdate(court_id, {
        avg_rating: Math.round(stats[0].avgRating * 10) / 10,
      });
    }

    return res.status(201).json({ message: 'Đánh giá thành công', review });
  } catch (error) {
    console.error('Lỗi createReview:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// GET /api/reviews/court/:courtId — Lấy danh sách reviews của sân
export async function getCourtReviews(req: Request, res: Response) {
  try {
    const { courtId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);

    if (!mongoose.Types.ObjectId.isValid(courtId)) {
      return res.status(400).json({ error: 'ID sân không hợp lệ' });
    }

    const [reviews, total] = await Promise.all([
      ReviewModel.find({ court_id: courtId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ReviewModel.countDocuments({ court_id: courtId }),
    ]);

    const avgRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.status(200).json({
      reviews,
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Lỗi getCourtReviews:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// GET /api/reviews/can-review/:courtId — Kiểm tra user có thể đánh giá không
// Trả về true nếu user đã từng chơi (quá giờ) và chưa đánh giá
export async function getReviewableBookings(req: Request, res: Response) {
  try {
    const user = req.user!;
    const userId = user._id;
    const { courtId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courtId)) {
      return res.status(400).json({ error: 'ID sân không hợp lệ' });
    }

    // Kiểm tra xem đã đánh giá chưa
    const existing = await ReviewModel.findOne({ user_id: userId, court_id: courtId });
    if (existing) {
      return res.status(200).json({ canReview: false });
    }

    // Tất cả booking confirmed/completed của user tại sân này
    const bookings = await BookingModel.find({
      user_id: userId,
      court_id: courtId,
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const now = new Date();

    // Có ít nhất 1 booking đã diễn ra
    const hasPlayed = bookings.some(b => {
      const dateStr = typeof b.date === 'string' ? b.date : (b.date as any).toISOString().split('T')[0];
      const endTime = new Date(`${dateStr}T${b.end_time}:00`);
      return endTime < now;
    });

    return res.status(200).json({
      canReview: hasPlayed,
    });
  } catch (error) {
    console.error('Lỗi getReviewableBookings:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// GET /api/reviews/my-review/:courtId — Lấy review của mình tại sân này
export async function getMyCourtReview(req: Request, res: Response) {
  try {
    const user = req.user!;
    const { courtId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courtId)) return res.status(400).json({ error: 'ID sân không hợp lệ' });
    const review = await ReviewModel.findOne({ user_id: user._id, court_id: courtId }).lean();
    return res.status(200).json({ review: review ?? null });
  } catch (error) {
    console.error('Lỗi getMyCourtReview:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// PUT /api/reviews/:reviewId — Cập nhật review
export async function updateReview(req: Request, res: Response) {
  try {
    const user = req.user!;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return res.status(400).json({ error: 'ID review không hợp lệ' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5 sao' });

    const review = await ReviewModel.findOne({ _id: reviewId, user_id: user._id });
    if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá hoặc bạn không có quyền' });

    review.rating = Number(rating);
    review.comment = comment?.trim() || undefined;
    await review.save();

    // Cập nhật avg_rating
    const stats = await ReviewModel.aggregate([
      { $match: { court_id: review.court_id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    if (stats.length > 0) {
      await Court.findByIdAndUpdate(review.court_id, { avg_rating: Math.round(stats[0].avgRating * 10) / 10 });
    }

    return res.status(200).json({ message: 'Đã cập nhật đánh giá', review });
  } catch (error) {
    console.error('Lỗi updateReview:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// DELETE /api/reviews/:reviewId — Xóa review
export async function deleteReview(req: Request, res: Response) {
  try {
    const user = req.user!;
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return res.status(400).json({ error: 'ID review không hợp lệ' });

    const review = await ReviewModel.findOne({ _id: reviewId, user_id: user._id });
    if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá hoặc bạn không có quyền' });

    const courtId = review.court_id;
    await review.deleteOne();

    // Cập nhật avg_rating
    const stats = await ReviewModel.aggregate([
      { $match: { court_id: courtId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    await Court.findByIdAndUpdate(courtId, { avg_rating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0 });

    return res.status(200).json({ message: 'Đã xóa đánh giá' });
  } catch (error) {
    console.error('Lỗi deleteReview:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
