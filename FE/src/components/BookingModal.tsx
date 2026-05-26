import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userBookCourt, type UserBookingPayload, type UserBookingResponse } from '../Axios/Axios';
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

  // Calculate estimated price
  // Formula: pricePerHour × durationHours (same as backend: (price/2) × numberOfSlots where 1 slot = 30 min)
  const startParts = payload.start_time.split(':').map(Number);
  const endParts = payload.end_time.split(':').map(Number);
  const durationHours = (endParts[0] + endParts[1] / 60) - (startParts[0] + startParts[1] / 60);
  // Round to nearest 1,000đ to avoid decimal noise
  const estimatedPrice = Math.round((pricePerHour * durationHours) / 1000) * 1000;
  const durationMinutes = Math.round(durationHours * 60);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${dayNames[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleConfirm = async () => {
    setStep('processing');
    try {
      const response = await userBookCourt(payload);
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
  }, [isOpen, step, handleClose]);

  if (!isOpen) return null;

  const balanceSufficient = (wallet?.balance ?? 0) >= estimatedPrice;

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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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

                    {/* Price Card */}
                    <div className="rounded-2xl border border-[#ffb020]/20 bg-[#ffb020]/5 p-5 mb-6">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-base font-bold text-white">Tạm tính</span>
                        <span className="text-2xl font-black text-[#ffb020]">{fmt(estimatedPrice)} đ</span>
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
                              <p className="text-[13px] font-bold text-rose-400">Số dư không đủ (thiếu {fmt(estimatedPrice - wallet.balance)} đ)</p>
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
                      <p className="text-[13px] text-slate-400 leading-relaxed">Hệ thống đang giữ chỗ cho bạn. Vui<br/>lòng không đóng trang.</p>
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
                        <p className="text-slate-400 text-[13px]">Đặt sân thành công!</p>
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

                      <div className="border-t border-white/5 pt-5 px-1 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">ĐÃ THANH TOÁN</span>
                        <span className="text-lg font-black text-[#c7f200]">{fmt(result.booking.total_price)} đ</span>
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

      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        onSuccess={() => {
          setShowDeposit(false);
          fetchWallet();
        }}
        initialAmount={wallet ? Math.max(10000, estimatedPrice - wallet.balance) : estimatedPrice}
        autoCreate={true}
      />
    </>
  );
};
