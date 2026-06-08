import mongoose, { Document, Schema, Types } from 'mongoose';

export type VoucherSource = 'system' | 'partner';
export type VoucherStatus = 'active' | 'expired' | 'disabled';
export type DiscountType = 'percent' | 'fixed';

export interface IVoucher extends Document {
  code: string;
  name: string;
  source: VoucherSource;
  partnerName?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  status: VoucherStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const voucherSchema = new Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    source: { type: String, enum: ['system', 'partner'], required: true, default: 'system' },
    partnerName: { type: String, trim: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, required: true, default: 0, min: 0 },
    maxUses: { type: Number, required: true, min: 1 },
    usedCount: { type: Number, required: true, default: 0, min: 0 },
    startDate: { type: String, required: true },
    expiryDate: { type: String, required: true },
    status: { type: String, enum: ['active', 'expired', 'disabled'], required: true, default: 'active' },
  },
  { timestamps: true }
);

voucherSchema.index({ code: 1 }, { unique: true });
voucherSchema.index({ status: 1 });
voucherSchema.index({ expiryDate: 1 });

const Voucher = mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', voucherSchema);

export default Voucher;
