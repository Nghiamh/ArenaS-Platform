import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReviewModel } from '../models/reviewModel.js';
import Report from '../models/reportModel.js';
import Court from '../models/courtModel.js';
import User from '../models/userModel.js';

// ─── Reviews ──────────────────────────────────────────────────────────────────

// GET /api/admin/moderation/reviews?page=1&limit=20&status=flagged
export async function adminGetAllReviews(req: Request, res: Response) {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const [reviews, total] = await Promise.all([
      ReviewModel.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('court_id', 'name')
        .lean(),
      ReviewModel.countDocuments(),
    ]);

    const enriched = reviews.map((r) => ({
      _id:        r._id,
      reviewer:   r.user_name,
      user_id:    r.user_id,
      stadiumName: (r.court_id as any)?.name ?? '(đã xoá)',
      court_id:   r.court_id,
      rating:     r.rating,
      content:    r.comment ?? '',
      createdAt:  r.createdAt,
    }));

    return res.status(200).json({ reviews: enriched, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('adminGetAllReviews:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// DELETE /api/admin/moderation/reviews/:reviewId  — admin xoá bài đánh giá + cập nhật avg_rating
export async function adminDeleteReview(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ error: 'ID review không hợp lệ' });

    const review = await ReviewModel.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });

    const courtId = review.court_id;
    await review.deleteOne();

    const stats = await ReviewModel.aggregate([
      { $match: { court_id: new mongoose.Types.ObjectId(courtId.toString()) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    await Court.findByIdAndUpdate(courtId, {
      avg_rating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
    });

    return res.status(200).json({ message: 'Đã xoá đánh giá' });
  } catch (err) {
    console.error('adminDeleteReview:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────

// GET /api/admin/moderation/reports?page=1&limit=20&status=pending
export async function adminGetAllReports(req: Request, res: Response) {
  try {
    const page   = Math.max(1, parseInt(req.query.page   as string) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    // Collect unique user/court ids for name lookup
    const userIds  = [...new Set(reports.flatMap((r) => [r.reporter_id?.toString(), r.target_type === 'user' ? r.target_id?.toString() : null].filter(Boolean)))];
    const courtIds = [...new Set(reports.filter((r) => r.target_type === 'court').map((r) => r.target_id?.toString()))];

    const [users, courts] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('name userName').lean(),
      Court.find({ _id: { $in: courtIds } }).select('name').lean(),
    ]);

    const userMap:  Record<string, string> = {};
    const courtMap: Record<string, string> = {};
    users.forEach((u)  => { userMap[(u._id as any).toString()]  = (u as any).name || (u as any).userName || 'Người dùng'; });
    courts.forEach((c) => { courtMap[(c._id as any).toString()] = (c as any).name || 'Sân'; });

    const enriched = reports.map((r) => ({
      _id:          r._id,
      reporterName: userMap[r.reporter_id?.toString()] ?? 'Người dùng',
      reporter_id:  r.reporter_id,
      targetName:   r.target_type === 'user'
        ? userMap[r.target_id?.toString()]  ?? 'Người dùng'
        : courtMap[r.target_id?.toString()] ?? 'Sân',
      target_id:    r.target_id,
      targetType:   r.target_type,
      reason:       r.reason,
      description:  r.description,
      status:       r.status,
      chat_logs:    r.chat_logs,
      appeal_description: r.appeal_description,
      createdAt:    r.createdAt,
    }));

    return res.status(200).json({ reports: enriched, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('adminGetAllReports:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// POST /api/admin/moderation/reports/:reportId/resolve
export async function adminResolveReport(req: Request, res: Response) {
  try {
    const { reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reportId))
      return res.status(400).json({ error: 'ID báo cáo không hợp lệ' });

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status: 'resolved' },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Không tìm thấy báo cáo' });

    return res.status(200).json({ message: 'Đã xử lý báo cáo', report });
  } catch (err) {
    console.error('adminResolveReport:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// POST /api/admin/moderation/reports/:reportId/dismiss
export async function adminDismissReport(req: Request, res: Response) {
  try {
    const { reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reportId))
      return res.status(400).json({ error: 'ID báo cáo không hợp lệ' });

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status: 'dismissed' },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Không tìm thấy báo cáo' });

    return res.status(200).json({ message: 'Đã bỏ qua báo cáo', report });
  } catch (err) {
    console.error('adminDismissReport:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
