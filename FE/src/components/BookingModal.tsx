import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userBookCourt, type UserBookingPayload, type UserBookingResponse, getCurrentUserProfile } from '../Axios/Axios';
import { validateVoucher, getPublicVouchers, redeemVoucher, type VoucherItem } from '../Axios/voucherApi';
import { useWallet } from '../hooks/useWallet';
import { DepositModal } from '../pages/WalletPage/DepositModal';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

type BookingStep = 'confirm' | 'processing' | 'success' | 'error';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtName: string;
  subCourtName: string;
  payload: UserBookingPayload;
  pricePerHour: number;
  onSuccess?: (response: UserBookingResponse) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  courtName,
  subCourtName,
  payload,
  pricePerHour,
  onSuccess,
}) => {
  const { wallet, fetchWallet } = useWallet();
  const [step, setStep] = useState<BookingStep>('confirm');
  const [result, setResult] = useState<UserBookingResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [lockTimeLeft, setLockTimeLeft] = useState(600);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherName, setVoucherName] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Voucher picker modal
  const [showVoucherPicker, setShowVoucherPicker] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<VoucherItem[]>([]);
  const [vouchersListLoading, setVouchersListLoading] = useState(false);
  const [voucherTab, setVoucherTab] = useState<'free' | 'points'>('free');
  const [confirmingVoucher, setConfirmingVoucher] = useState<VoucherItem | null>(null);
  const [userPoints, setUserPoints] = useState(0);

  // Calculate estimated price
  const startParts = payload.start_time.split(':').map(Number);
  const endParts = payload.end_time.split(':').map(Number);
  const durationHours = (endParts[0] + endParts[1] / 60) - (startParts[0] + startParts[1] / 60);
  const estimatedPrice = Math.round((pricePerHour * durationHours) / 1000) * 1000;
  const durationMinutes = Math.round(durationHours * 60);
  
  const isMatchBooking = !!payload.match_id;
  const discountedTotalPrice = Math.max(0, estimatedPrice - voucherDiscount);
  const finalPrice = isMatchBooking ? Math.ceil(discountedTotalPrice / 2) : discountedTotalPrice;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${dayNames[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleOpenVoucherPicker = async () => {
    setShowVoucherPicker(true);
    setVouchersListLoading(true);
    setConfirmingVoucher(null);
    try {
      const [vouchers, profileRes] = await Promise.all([
        getPublicVouchers(),
        getCurrentUserProfile().catch(() => null),
      ]);
      if (profileRes?.user) setUserPoints(profileRes.user.points ?? 0);
      setAvailableVouchers(vouchers.filter(v => estimatedPrice >= v.minOrderValue));
    } catch {
      setAvailableVouchers([]);
    } finally {
      setVouchersListLoading(false);
    }
  };

  const handleSelectVoucher = async (voucher: VoucherItem) => {
    // Nếu cần đổi điểm và chưa đổi → hiện xác nhận inline
    if ((voucher.pointsCost ?? 0) > 0 && !voucher.isUsedByMe) {
      setConfirmingVoucher(voucher);
      return;
    }
    await applyVoucher(voucher);
  };

  const handleConfirmRedeem = async () => {
    if (!confirmingVoucher) return;
    const voucher = confirmingVoucher;
    setConfirmingVoucher(null);
    setVouchersListLoading(true);
    try {
      await redeemVoucher(voucher._id);
      await applyVoucher(voucher);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đổi voucher thất bại. Bạn không đủ điểm?';
      setVoucherError(msg);
      setVouchersListLoading(false);
    }
  };

  const applyVoucher = async (voucher: VoucherItem) => {
    setShowVoucherPicker(false);
    setConfirmingVoucher(null);
    setVoucherError('');
    setVoucherLoading(true);
    try {
      const res = await validateVoucher(voucher.code, estimatedPrice);
      if (res.valid) {
        setVoucherCode(voucher.code);
        setVoucherDiscount(res.discountAmount);
        setVoucherName(res.voucher.name);
        setVoucherError('');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Voucher không hợp lệ';
      setVoucherError(msg);
      setVoucherCode('');
      setVoucherDiscount(0);
      setVoucherName('');
    } finally {
      setVoucherLoading(false);
      setVouchersListLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setVoucherDiscount(0);
    setVoucherName('');
    setVoucherError('');
  };

  const handleConfirm = async () => {
    setStep('processing');
    try {
      const bookingPayload: UserBookingPayload = { ...payload };
      if (voucherCode) bookingPayload.voucher_code = voucherCode;
      const response = await userBookCourt(bookingPayload);
      setResult(response);
      setStep('success');
      await fetchWallet();
      onSuccess?.(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đặt sân thất bại. Vui lòng thử lại.';
      setErrorMsg(message);
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setResult(null);
    setErrorMsg('');
    setVoucherCode('');
    setVoucherDiscount(0);
    setVoucherName('');
    setVoucherError('');
    onClose();
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    if (step === 'success') {
      setTimeLeft(5);
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      timer = setTimeout(() => {
        handleClose();
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [step]);

  useEffect(() => {
    let lockInterval: ReturnType<typeof setInterval>;
    if (isOpen && step === 'confirm') {
      setLockTimeLeft(600);
      lockInterval = setInterval(() => {
        setLockTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(lockInterval);
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (lockInterval) clearInterval(lockInterval);
    };
  }, [isOpen, step]);

  if (!isOpen) return null;

  const balanceSufficient = (wallet?.balance ?? 0) >= finalPrice;

  const formatLockTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0F172A] rounded-2xl shadow-2xl overflow-hidden border border-slate-800"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between px-6 py-4 bg-[#0F172A] border-b border-white/5">
                <div className="flex items-center gap-3">
                  <button onClick={handleClose} className="text-white hover:text-slate-300 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-white leading-tight">Xác nhận đặt sân</h1>
                    <p className="text-[11px] text-slate-400 mt-0.5">Kiểm tra thông tin trước khi đặt</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center text-sm font-bold text-white">
                  {step === 'confirm' && (
                    <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/20 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {formatLockTime(lockTimeLeft)}
                    </div>
                  )}
                  {courtName}
                </div>
              </div>

              {/* Content */}
              <div className="w-full overflow-y-auto px-6 py-8 max-h-[80vh] custom-scrollbar">
                {/* STEP: CONFIRM */}
                {step === 'confirm' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Main Info Card */}
                    <div className="rounded-2xl bg-[#141E2B] p-5 mb-4">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-transparent text-white shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1">SÂN & SÂN CON</p>
                          <h2 className="text-lg font-bold text-white">{courtName}</h2>
                          <p className="text-[#c7f200] text-sm font-bold mt-0.5">{subCourtName}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-5">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                            NGÀY
                          </p>
                          <p className="text-[13px] font-bold text-white">{formatDate(payload.date)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            KHUNG GIỜ
                          </p>
                          <p className="text-[13px] font-bold text-[#c7f200]">{payload.start_time} - {payload.end_time}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            THỜI LƯỢNG
                          </p>
                          <p className="text-[13px] font-bold text-white">{durationMinutes} phút</p>
                        </div>
                      </div>
                    </div>

                    {/* Voucher Input */}
                    <div className="rounded-2xl bg-[#141E2B] p-5 mb-4">
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
                        MÃ GIẢM GIÁ
                      </p>

                      {voucherCode ? (
                        // Applied voucher display
                        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                          <div>
                            <p className="text-[13px] font-bold text-emerald-400">{voucherCode}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{voucherName} — Giảm {fmt(voucherDiscount)}đ</p>
                          </div>
                          <button
                            onClick={handleRemoveVoucher}
                            className="text-slate-400 hover:text-rose-400 transition ml-3 shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      ) : (
                        // Open voucher picker button
                        <button
                          onClick={handleOpenVoucherPicker}
                          disabled={voucherLoading}
                          className="w-full flex items-center justify-between rounded-xl bg-[#0F172A] border border-white/10 hover:border-violet-500/40 px-4 py-3 transition group"
                        >
                          <span className="text-[13px] text-slate-400 group-hover:text-violet-300 transition">
                            {voucherLoading ? 'Đang xác thực...' : 'Voucher '}
                          </span>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 group-hover:text-violet-400 transition" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      )}

                      {voucherError && (
                        <p className="text-[12px] text-rose-400 mt-2 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                          {voucherError}
                        </p>
                      )}
                    </div>

                    {/* Price Card */}
                    <div className="rounded-2xl border border-[#ffb020]/20 bg-[#ffb020]/5 p-5 mb-6">
                      <div className="space-y-3 mb-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Giá sân</span>
                          <span className="text-sm font-bold text-white">{fmt(estimatedPrice)} đ</span>
                        </div>
                        {voucherDiscount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-400 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              Voucher ({voucherCode})
                            </span>
                            <span className="text-sm font-bold text-emerald-400">-{fmt(voucherDiscount)} đ</span>
                          </div>
                        )}
                        {isMatchBooking && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-cyan-400 flex items-center gap-1">
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                              Chia đôi (50%)
                            </span>
                            <span className="text-sm font-bold text-cyan-400">{fmt(discountedTotalPrice)} đ / 2</span>
                          </div>
                        )}

                        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                          <span className="text-base font-bold text-white">Thanh toán</span>
                          <span className="text-2xl font-black text-[#ffb020]">{fmt(finalPrice)} đ</span>
                        </div>
                      </div>


                      <div className="border-t border-white/5 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Số dư ví</span>
                          <span className="text-sm font-bold text-white">
                            {wallet ? `${fmt(wallet.balance)} đ` : 'Đang tải...'}
                          </span>
                        </div>

                        {!balanceSufficient && wallet && (
                          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400 flex-shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                            <div>
                              <p className="text-[13px] font-bold text-rose-400">Số dư không đủ (thiếu {fmt(finalPrice - wallet.balance)} đ)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="w-1/3 rounded-xl bg-[#1A2235] hover:bg-[#232D45] py-3.5 text-[13px] font-bold text-white transition"
                      >
                        Hủy
                      </button>
                      {!balanceSufficient ? (
                        <button
                          onClick={() => setShowDeposit(true)}
                          className="w-2/3 rounded-xl bg-[#c7f200] py-3.5 text-[13px] font-bold text-[#0B1221] shadow-[0_4px_20px_rgba(199,242,0,0.2)] hover:shadow-[0_4px_25px_rgba(199,242,0,0.4)] transition"
                        >
                          Nạp thêm tiền
                        </button>
                      ) : (
                        <button
                          onClick={handleConfirm}
                          disabled={!wallet}
                          className="w-2/3 flex flex-col items-center justify-center rounded-xl bg-[#c7f200] py-2 text-[13px] font-bold text-[#0B1221] shadow-[0_4px_20px_rgba(199,242,0,0.2)] hover:shadow-[0_4px_25px_rgba(199,242,0,0.4)] transition disabled:opacity-50 disabled:shadow-none leading-none"
                        >
                          <span>Xác nhận đặt sân</span>
                          <span className="text-[10px] font-bold opacity-70 mt-1 block sm:hidden">Còn lại: {formatLockTime(lockTimeLeft)}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP: PROCESSING */}
                {step === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-10 gap-5"
                  >
                    <div className="relative flex items-center justify-center mb-2">
                      <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-slate-700 border-t-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">Đang xử lý đặt sân...</h3>
                      <p className="text-[13px] text-slate-400 leading-relaxed">Hệ thống đang giữ chỗ cho bạn. Vui<br />lòng không đóng trang.</p>
                    </div>
                  </motion.div>
                )}

                {/* STEP: SUCCESS */}
                {step === 'success' && result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col items-center gap-3 text-center mb-6">
                      <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center mb-1">
                        <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-[#0F172A]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">Đặt sân thành công!</h2>
                        <p className="text-slate-400 text-[13px]">Thông tin đặt sân của bạn đã được xác nhận</p>
                      </div>
                    </div>


                    <div className="relative rounded-2xl bg-[#141E2B] p-5 space-y-5">
                      <div className="absolute left-0 top-[55%] -translate-x-1/2 -translate-y-1/2 w-4 h-6 bg-[#0F172A] rounded-r-full" />
                      <div className="absolute right-0 top-[55%] translate-x-1/2 -translate-y-1/2 w-4 h-6 bg-[#0F172A] rounded-l-full" />

                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">SÂN</span>
                        <span className="text-[13px] font-bold text-white">{result.booking.court_name} - {result.booking.sub_court_name}</span>
                      </div>

                      <div className="border-t border-dashed border-white/10 pt-5 px-1 flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">THỜI GIAN</span>
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-[#c7f200]">{result.booking.start_time} - {result.booking.end_time}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{formatDate(result.booking.date)}</p>
                        </div>
                      </div>

                      {(result.booking.voucher_discount ?? 0) > 0 && (
                        <div className="border-t border-white/5 pt-5 px-1 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider">GIẢM GIÁ VOUCHER</span>
                          <span className="text-[13px] font-bold text-emerald-400">-{fmt(result.booking.voucher_discount)} đ</span>
                        </div>
                      )}

                      <div className="border-t border-white/5 pt-5 px-1 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">ĐÃ THANH TOÁN</span>
                        <span className="text-lg font-black text-[#c7f200]">{fmt(result.booking.charged_amount ?? result.booking.total_price)} đ</span>
                      </div>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full rounded-2xl bg-white/10 hover:bg-white/20 py-3.5 text-[13px] font-bold text-white transition"
                    >
                      Hoàn tất {timeLeft > 0 ? `(Đóng sau ${timeLeft}s)` : ''}
                    </button>
                  </motion.div>
                )}

                {/* STEP: ERROR */}
                {step === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="h-24 w-24 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-5xl text-rose-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-rose-400 mb-1">Đặt sân thất bại</h2>
                        <p className="text-slate-400">{errorMsg}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleClose}
                        className="flex-1 rounded-2xl border border-white/10 bg-transparent py-4 text-sm font-semibold text-slate-300 hover:bg-white/5 transition"
                      >
                        Đóng
                      </button>
                      <button
                        onClick={() => setStep('confirm')}
                        className="flex-1 rounded-2xl bg-white py-4 text-sm font-bold text-slate-900 hover:bg-slate-200 transition"
                      >
                        Thử lại
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voucher Picker Modal */}
      <AnimatePresence>
        {showVoucherPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9010] flex items-end sm:items-center justify-center"
            onClick={() => setShowVoucherPicker(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full sm:max-w-2xl bg-[#0F172A] rounded-t-3xl sm:rounded-3xl border border-white/[0.08] shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" />
                  </svg>
                  <h3 className="text-base font-bold text-white">Kho Voucher</h3>
                </div>
                <button
                  onClick={() => setShowVoucherPicker(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center p-2 bg-[#0F172A] border-b border-white/[0.06]">
                <button
                  onClick={() => setVoucherTab('free')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${voucherTab === 'free' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                    Tất cả
                  </div>
                </button>
                <button
                  onClick={() => setVoucherTab('points')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${voucherTab === 'points' ? 'bg-violet-500/10 text-violet-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Đổi Điểm
                  </div>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {vouchersListLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  </div>
                ) : availableVouchers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" />
                    </svg>
                    <p className="text-sm text-slate-500 font-semibold">Không có voucher phù hợp</p>
                    <p className="text-xs text-slate-600 mt-1">Đơn hàng {fmt(estimatedPrice)}đ chưa đủ điều kiện</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const displayedVouchers = availableVouchers.filter(v =>
                        voucherTab === 'free' ? (v.pointsCost ?? 0) === 0 : (v.pointsCost ?? 0) > 0
                      );

                      if (displayedVouchers.length === 0) {
                        return (
                          <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center opacity-70">
                            <p className="text-sm text-slate-500 font-semibold">
                              Không có voucher {voucherTab === 'free' ? 'có sẵn' : 'đổi điểm'}.
                            </p>
                          </div>
                        );
                      }

                      return displayedVouchers.map(v => {
                        const discountLabel = v.discountType === 'percent' ? `Giảm ${v.discountValue}%` : `Giảm ${fmt(v.discountValue)}đ`;
                        const isSystem = v.source === 'system';
                        const isUsed = v.isUsedByMe;
                        const canAfford = voucherTab === 'free' ? !isUsed : (userPoints >= (v.pointsCost ?? 0) || isUsed);
                        const missingPoints = (v.pointsCost ?? 0) - userPoints;

                        return (
                          <button
                            key={v._id}
                            onClick={() => canAfford && handleSelectVoucher(v)}
                            disabled={!canAfford || (voucherTab === 'free' && isUsed)}
                            className={`text-left rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#141e2b] to-[#10111a] p-3 transition-all group relative overflow-hidden ${(!canAfford || (voucherTab === 'free' && isUsed)) ? 'opacity-40 cursor-not-allowed' : voucherTab === 'free' ? 'hover:border-emerald-500/40' : 'hover:border-violet-500/40'}`}
                          >
                            {isUsed && voucherTab === 'free' && (
                              <div className="absolute inset-0 bg-[#0F172A]/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                <span className="text-white font-bold text-xs bg-rose-500/80 px-2 py-1 rounded">Đã sử dụng</span>
                              </div>
                            )}
                            {voucherTab === 'points' && (
                              <div className={`absolute top-0 right-0 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg border-l border-b ${isUsed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : canAfford ? 'bg-violet-500/20 text-violet-300 border-violet-500/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/20'}`}>
                                {isUsed ? 'Đã đổi (Sẵn sàng)' : canAfford ? `${v.pointsCost} Điểm` : `Thiếu ${fmt(missingPoints)}`}
                              </div>
                            )}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1.5 inline-block ${isSystem ? 'bg-violet-500/15 text-violet-400' : 'bg-amber-500/15 text-amber-400'}`}>
                              {isSystem ? 'ArenaS' : v.partnerName || 'Đối tác'}
                            </span>
                            <p className="text-[12px] font-bold text-white truncate leading-tight">{v.name}</p>
                            <p className="text-base font-black text-[#c7f200] mt-1">{discountLabel}</p>
                          </button>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Inline confirm for point redemption */}
              <AnimatePresence>
                {confirmingVoucher && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                    className="border-t border-white/[0.06] bg-[#0c1322] px-5 py-4"
                  >
                    <p className="text-[13px] text-slate-300 mb-3 text-center">
                      Dùng <strong className="text-violet-400">{confirmingVoucher.pointsCost} điểm</strong> để đổi <strong className="text-white">{confirmingVoucher.name}</strong>?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmingVoucher(null)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-300 transition"
                      >Hủy</button>
                      <button
                        onClick={handleConfirmRedeem}
                        className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white transition"
                      >Xác nhận đổi</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        onSuccess={() => {
          setShowDeposit(false);
          fetchWallet();
        }}
        initialAmount={wallet ? Math.max(10000, finalPrice - wallet.balance) : finalPrice}
        autoCreate={true}
      />
    </>
  );
};
