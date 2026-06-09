import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  adminListVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminToggleVoucher,
  adminDeleteVoucher,
  validateVoucher,
  getPublicVouchers,
  redeemVoucherWithPoints,
} from '../controllers/voucherController.js';

const router = Router();

const adminOnly = [
  requireAuth,
  requireRole({ role: 'admin', error: 'forbidden', message: 'Admin access required.' }),
];

// Admin routes — /api/admin/vouchers
router.get('/',           ...adminOnly, adminListVouchers);
router.post('/',          ...adminOnly, adminCreateVoucher);
router.put('/:id',        ...adminOnly, adminUpdateVoucher);
router.post('/:id/toggle',...adminOnly, adminToggleVoucher);
router.delete('/:id',     ...adminOnly, adminDeleteVoucher);

// User-facing routes — /api/vouchers
router.get('/public',           requireAuth, getPublicVouchers);
router.post('/validate',        requireAuth, validateVoucher);
router.post('/redeem',          requireAuth, redeemVoucherWithPoints);

export default router;
