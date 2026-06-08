import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Voucher from '../models/voucherModel.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function autoExpire(expiryDate: string): 'active' | 'expired' {
  const today = new Date().toISOString().split('T')[0];
  return expiryDate < today ? 'expired' : 'active';
}

// ─── ADMIN: List all vouchers ─────────────────────────────────────────────────

export async function adminListVouchers(req: Request, res: Response): Promise<void> {
  try {
    const { source, status, keyword, page = '1', limit = '50' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (source && source !== 'all') filter.source = source;
    if (status && status !== 'all') filter.status = status;
    if (keyword) {
      const re = new RegExp(keyword.trim(), 'i');
      filter.$or = [{ code: re }, { name: re }, { partnerName: re }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const [vouchers, total] = await Promise.all([
      Voucher.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Voucher.countDocuments(filter),
    ]);

    res.json({
      message: 'ok',
      vouchers,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('adminListVouchers:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
}

// ─── ADMIN: Create voucher ────────────────────────────────────────────────────

export async function adminCreateVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { code, name, source, partnerName, discountType, discountValue, minOrderValue, maxUses, startDate, expiryDate } = req.body;

    if (!code || !name || !source || !discountType || discountValue == null || !maxUses || !startDate || !expiryDate) {
      res.status(400).json({ error: 'missing_fields' });
      return;
    }
    if (discountType === 'percent' && (Number(discountValue) <= 0 || Number(discountValue) > 100)) {
      res.status(400).json({ error: 'invalid_percent_value' });
      return;
    }
    if (startDate >= expiryDate) {
      res.status(400).json({ error: 'invalid_date_range' });
      return;
    }

    const initialStatus = autoExpire(expiryDate);

    const voucher = new Voucher({
      code: String(code).toUpperCase().trim(),
      name, source, partnerName: source === 'partner' ? partnerName : undefined,
      discountType, discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxUses: Number(maxUses), usedCount: 0,
      startDate, expiryDate, status: initialStatus,
    });

    await voucher.save();
    res.status(201).json({ message: 'Tạo voucher thành công', voucher });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'duplicate_code', message: 'Mã voucher đã tồn tại' });
      return;
    }
    console.error('adminCreateVoucher:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
}

// ─── ADMIN: Update voucher ────────────────────────────────────────────────────

export async function adminUpdateVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid_id' });
      return;
    }

    const allowed = ['code', 'name', 'source', 'partnerName', 'discountType', 'discountValue', 'minOrderValue', 'maxUses', 'startDate', 'expiryDate', 'status'];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    if (patch.code) patch.code = String(patch.code).toUpperCase().trim();
    if (patch.discountValue !== undefined) patch.discountValue = Number(patch.discountValue);
    if (patch.minOrderValue !== undefined) patch.minOrderValue = Number(patch.minOrderValue);
    if (patch.maxUses !== undefined) patch.maxUses = Number(patch.maxUses);

    // Auto-expire if new expiryDate is in the past and status not manually set
    if (patch.expiryDate && !patch.status) {
      patch.status = autoExpire(patch.expiryDate as string);
    }

    const voucher = await Voucher.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
    if (!voucher) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    res.json({ message: 'Cập nhật voucher thành công', voucher });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'duplicate_code', message: 'Mã voucher đã tồn tại' });
      return;
    }
    console.error('adminUpdateVoucher:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
}

// ─── ADMIN: Toggle active/disabled ───────────────────────────────────────────

export async function adminToggleVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid_id' });
      return;
    }

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    if (voucher.status === 'expired') {
      res.status(400).json({ error: 'cannot_toggle_expired' });
      return;
    }

    voucher.status = voucher.status === 'active' ? 'disabled' : 'active';
    await voucher.save();

    res.json({ message: voucher.status === 'active' ? 'Đã bật voucher' : 'Đã tắt voucher', voucher });
  } catch (err) {
    console.error('adminToggleVoucher:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
}

// ─── ADMIN: Delete voucher ────────────────────────────────────────────────────

export async function adminDeleteVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid_id' });
      return;
    }

    const voucher = await Voucher.findByIdAndDelete(id);
    if (!voucher) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    res.json({ message: `Đã xóa voucher ${voucher.code}` });
  } catch (err) {
    console.error('adminDeleteVoucher:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
}

// ─── USER: Validate/apply voucher ─────────────────────────────────────────────
// Returns the discount details without consuming usage — booking controller calls applyVoucherUsage

export async function validateVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { code, orderValue } = req.body;
    if (!code) {
      res.status(400).json({ error: 'missing_code' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const voucher = await Voucher.findOne({ code: String(code).toUpperCase().trim() });

    if (!voucher) {
      res.status(404).json({ error: 'voucher_not_found', message: 'Mã voucher không tồn tại' });
      return;
    }
    if (voucher.status !== 'active') {
      res.status(400).json({ error: 'voucher_inactive', message: 'Voucher không còn hiệu lực' });
      return;
    }
    if (voucher.startDate > today) {
      res.status(400).json({ error: 'voucher_not_started', message: 'Voucher chưa đến ngày sử dụng' });
      return;
    }
    if (voucher.expiryDate < today) {
      res.status(400).json({ error: 'voucher_expired', message: 'Voucher đã hết hạn' });
      return;
    }
    if (voucher.usedCount >= voucher.maxUses) {
      res.status(400).json({ error: 'voucher_exhausted', message: 'Voucher đã hết lượt sử dụng' });
      return;
    }

    const amount = Number(orderValue) || 0;
    if (voucher.minOrderValue > 0 && amount < voucher.minOrderValue) {
      res.status(400).json({
        error: 'below_min_order',
        message: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.minOrderValue)}₫ để dùng voucher này`,
      });
      return;
    }

    let discountAmount = 0;
    if (voucher.discountType === 'percent') {
      discountAmount = Math.floor(amount * (voucher.discountValue / 100));
    } else {
      discountAmount = Math.min(voucher.discountValue, amount);
    }

    res.json({
      valid: true,
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount),
    });
  } catch (err) {
    console.error('validateVoucher:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
}

// ─── Shared helper for booking controller to consume a voucher slot ───────────

export async function consumeVoucher(code: string, orderValue: number): Promise<{ discountAmount: number; voucherId: string } | null> {
  const today = new Date().toISOString().split('T')[0];
  const voucher = await Voucher.findOne({ code: String(code).toUpperCase().trim() });
  if (!voucher || voucher.status !== 'active') return null;
  if (voucher.startDate > today || voucher.expiryDate < today) return null;
  if (voucher.usedCount >= voucher.maxUses) return null;
  if (voucher.minOrderValue > 0 && orderValue < voucher.minOrderValue) return null;

  let discountAmount = 0;
  if (voucher.discountType === 'percent') {
    discountAmount = Math.floor(orderValue * (voucher.discountValue / 100));
  } else {
    discountAmount = Math.min(voucher.discountValue, orderValue);
  }

  voucher.usedCount += 1;
  if (voucher.usedCount >= voucher.maxUses) voucher.status = 'expired';
  await voucher.save();

  return { discountAmount, voucherId: (voucher._id as any).toString() };
}

// ─── USER: Get active public vouchers (for user display) ──────────────────────

export async function getPublicVouchers(req: Request, res: Response): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const vouchers = await Voucher.find({
      status: 'active',
      startDate: { $lte: today },
      expiryDate: { $gte: today },
      $expr: { $lt: ['$usedCount', '$maxUses'] },
    })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ message: 'ok', vouchers });
  } catch (err) {
    console.error('getPublicVouchers:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
}
