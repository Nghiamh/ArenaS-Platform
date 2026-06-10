import { axiosClient } from './Axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoucherSource = 'system' | 'partner';
export type VoucherStatus = 'active' | 'expired' | 'disabled';
export type DiscountType = 'percent' | 'fixed';

export type VoucherItem = {
  _id: string;
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
  pointsCost: number;
  isUsedByMe?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type VoucherPayload = {
  code: string;
  name: string;
  source: VoucherSource;
  partnerName?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  startDate: string;
  expiryDate: string;
  pointsCost?: number;
};

type VoucherListResponse = {
  message: string;
  vouchers: VoucherItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type VoucherResponse = {
  message: string;
  voucher: VoucherItem;
};

type ValidateVoucherResponse = {
  valid: boolean;
  voucher: { _id: string; code: string; name: string; discountType: DiscountType; discountValue: number };
  discountAmount: number;
  finalAmount: number;
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export async function adminGetVouchers(params?: {
  source?: 'all' | VoucherSource;
  status?: 'all' | VoucherStatus;
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<VoucherListResponse> {
  const { data } = await axiosClient.get<VoucherListResponse>('/admin/vouchers', { params });
  return data;
}

export async function adminCreateVoucher(payload: VoucherPayload): Promise<VoucherItem> {
  const { data } = await axiosClient.post<VoucherResponse>('/admin/vouchers', payload);
  return data.voucher;
}

export async function adminUpdateVoucher(id: string, payload: Partial<VoucherPayload> & { status?: VoucherStatus }): Promise<VoucherItem> {
  const { data } = await axiosClient.put<VoucherResponse>(`/admin/vouchers/${id}`, payload);
  return data.voucher;
}

export async function adminToggleVoucher(id: string): Promise<VoucherItem> {
  const { data } = await axiosClient.post<VoucherResponse>(`/admin/vouchers/${id}/toggle`, {});
  return data.voucher;
}

export async function adminDeleteVoucher(id: string): Promise<{ message: string }> {
  const { data } = await axiosClient.delete<{ message: string }>(`/admin/vouchers/${id}`);
  return data;
}

// ─── User API ─────────────────────────────────────────────────────────────────

export async function getPublicVouchers(): Promise<VoucherItem[]> {
  const { data } = await axiosClient.get<{ message: string; vouchers: VoucherItem[] }>('/vouchers/public');
  return data.vouchers;
}

export async function validateVoucher(code: string, orderValue: number): Promise<ValidateVoucherResponse> {
  const { data } = await axiosClient.post<ValidateVoucherResponse>('/vouchers/validate', { code, orderValue });
  return data;
}

export type RedeemVoucherResponse = {
  message: string;
  voucher: { _id: string; code: string; name: string; discountType: DiscountType; discountValue: number; expiryDate: string };
  pointsDeducted: number;
  remainingPoints: number;
};

export async function redeemVoucher(voucherId: string): Promise<RedeemVoucherResponse> {
  const { data } = await axiosClient.post<RedeemVoucherResponse>('/vouchers/redeem', { voucherId });
  return data;
}
