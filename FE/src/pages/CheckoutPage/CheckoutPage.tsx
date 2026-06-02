import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { createSubscriptionCheckout } from '../../Axios/Axios';
import { motion, AnimatePresence } from 'framer-motion';
import serverRackImg from '../../assets/server_rack.png';

export const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy thông tin gói từ state, mặc định là Gói Chuyên Nghiệp nếu truy cập trực tiếp
  const plan = location.state?.plan || {
    id: '',
    name: 'Chuyên Nghiệp',
    price: '6.710.400',
    period: '/ năm',
    originalPrice: '8.388.000',
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      fullname: '',
      phone: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
      fullname: Yup.string().required('Vui lòng nhập họ và tên'),
      phone: Yup.string()
        .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ')
        .required('Vui lòng nhập số điện thoại'),
    }),
    onSubmit: async () => {
      const token = localStorage.getItem('accessToken');
      const currentUserStr = localStorage.getItem('currentUser');
      
      if (!token || !currentUserStr) {
        setAuthError('Vui lòng đăng nhập để mua gói dịch vụ.');
        return;
      }

      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser?.role !== 'owner') {
          setAuthError('Chỉ tài khoản chủ sân (Owner) mới có thể mua gói dịch vụ.');
          return;
        }
      } catch (e) {
        // ignore
      }

      try {
        setIsProcessing(true);
        const billingCycle = plan.period.includes('năm') ? 'yearly' : 'monthly';

        // Trực tiếp gọi API của Backend
        const response = await createSubscriptionCheckout(plan.id || '65b2a3a4c5d6e7f8a9b0c1d2', billingCycle);

        if (response.success && response.checkout) {
          navigate('/payment-qr', {
            state: {
              planName: plan.name,
              price: plan.price,
              paymentCode: response.checkout.paymentCode,
              qrUrl: response.checkout.qrUrl,
              totalAmount: response.checkout.amount
            }
          });
        }
      } catch (err: any) {
        if (err.message === 'missing_token' || err.message === 'unauthorized') {
          setAuthError('Vui lòng đăng nhập để mua gói dịch vụ.');
          return;
        }
        setAuthError(err.message || 'Không thể tạo phiên thanh toán. Vui lòng kiểm tra lại cấu hình.');
      } finally {
        setIsProcessing(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#071024] text-white font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.08),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.05),transparent_32%)]" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={() => navigate('/bang-gia')}
          className="flex items-center text-[10px] font-black tracking-[0.2em] text-slate-400 hover:text-white transition uppercase"
        >
          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại bảng giá
        </button>
        <div className="flex items-center gap-1.5 text-[11px] font-black tracking-widest text-slate-300 uppercase">
          <span className="text-sm"></span> Thanh toán an toàn
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col lg:flex-row items-stretch gap-8 px-6 py-6 flex-1 justify-center">

        {/* Left Section - Payment Form */}
        <div className="flex-[1.2] flex flex-col justify-center max-w-xl lg:max-w-none">
          <h1 className="mb-1 text-[26px] font-black tracking-tight text-white leading-tight">Thanh toán an toàn.</h1>
          <p className="mb-6 text-[13px] leading-relaxed text-slate-400">
            Hoàn tất thông tin để kích hoạt gói {plan.name}. Mọi thông tin của bạn được bảo mật tuyệt đối.
          </p>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            {/* Contact Info */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Thông tin liên hệ</h2>
              <div className="space-y-3.5">
                <div className="relative">
                  <label htmlFor="email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...formik.getFieldProps('email')}
                    placeholder="example@email.com"
                    className={`w-full rounded-xl border bg-slate-900/60 px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition duration-200 focus:ring-1 ${formik.touched.email && formik.errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-white/10 focus:border-blue-500 focus:ring-blue-500/30'
                      }`}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-xs text-red-400">{formik.errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullname" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      id="fullname"
                      {...formik.getFieldProps('fullname')}
                      placeholder="Nguyễn Văn A"
                      className={`w-full rounded-xl border bg-slate-900/60 px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition duration-200 focus:ring-1 ${formik.touched.fullname && formik.errors.fullname
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-blue-500 focus:ring-blue-500/30'
                        }`}
                    />
                    {formik.touched.fullname && formik.errors.fullname && (
                      <p className="mt-1 text-xs text-red-400">{formik.errors.fullname}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...formik.getFieldProps('phone')}
                      placeholder="090 123 4567"
                      className={`w-full rounded-xl border bg-slate-900/60 px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition duration-200 focus:ring-1 ${formik.touched.phone && formik.errors.phone
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-blue-500 focus:ring-blue-500/30'
                        }`}
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <p className="mt-1 text-xs text-red-400">{formik.errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Thanh toán bằng</h2>
              <div className="relative w-full rounded-2xl border border-emerald-500 bg-[#102a24]/30 p-4 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[13px] font-black tracking-wider uppercase text-emerald-400 block">Banking </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Xử lý tự động 24/7 qua cổng Napas</span>
                  </div>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-400 border border-emerald-400/40">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </section>

            {/* CTA Button Block */}
            <div className="pt-3 space-y-3">
              <button
                type="submit"
                disabled={isProcessing}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-[15px] font-black tracking-widest uppercase text-white shadow-[0_12px_30px_-6px_rgba(37,99,235,0.4)] transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_16px_35px_-4px_rgba(37,99,235,0.6)] transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${isProcessing ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                {isProcessing ? (
                  <>
                    <svg className="mr-3 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Thanh toán {plan.price}đ <span className="text-[17px] font-bold">→</span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                <span></span> Hệ thống mã hóa SSL 256-bit bảo mật cao.
              </div>
            </div>
          </form>
        </div>

        {/* Right Section - Order Summary */}
        <div className="flex-1 flex flex-col justify-center animate-fade-in">
          <div className="rounded-3xl border border-white/8 bg-slate-900/60 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden">
            <h2 className="mb-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Tóm tắt đơn hàng</h2>

            <div className="mb-4 border-b border-white/5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[16px] font-extrabold text-white">{`Gói ${plan.name}`}</h3>
                  <p className="mt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Chu kỳ: {plan.period.includes('năm') ? 'Hàng năm (Tiết kiệm 20%)' : 'Hàng tháng'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-extrabold text-white">{plan.price}đ</p>
                </div>
              </div>
            </div>

            <div className="mb-5 space-y-2.5 border-b border-white/5 pb-4 text-[13px]">
              <div className="flex justify-between text-slate-400">
                <span>Tạm tính</span>
                <span>{plan.originalPrice || plan.price}đ</span>
              </div>
              {plan.originalPrice && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Chiết khấu thanh toán năm</span>
                  <span>-{parseInt(plan.originalPrice.replace(/\./g, '')) - parseInt(plan.price.replace(/\./g, ''))}đ</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Thuế VAT (10%)</span>
                <span>0đ</span>
              </div>
            </div>

            <div className="mb-6 flex items-end justify-between">
              <span className="text-[13px] font-black text-slate-300 uppercase tracking-widest">Tổng cộng</span>
              <div className="text-right">
                <span className="text-[28px] font-black tracking-tight text-white">{plan.price}đ</span>
                <p className="mt-0.5 text-[10px] text-slate-500 font-medium">Bao gồm các loại thuế có thể áp dụng</p>
              </div>
            </div>

            {/* Glowing 14 days refund guarantee block */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/35">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[12px] font-extrabold text-emerald-400 uppercase tracking-widest">Cam kết dùng thử 14 ngày</h4>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                  Trải nghiệm đầy đủ tất cả tính năng vận hành. Nhận hoàn tiền 100% nếu không hài lòng, hủy bỏ phiên bất cứ lúc nào.
                </p>
              </div>
            </div>

          </div>

          {/* Datacenter Server Rack background element fading under card */}
          <div className="mt-4 w-full h-[120px] rounded-3xl overflow-hidden border border-white/5 relative group shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <img
              src={serverRackImg}
              alt="Secure high-tech cloud infrastructure"
              className="w-full h-full object-cover opacity-35 group-hover:opacity-50 transition-opacity duration-500 filter brightness-90 saturate-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071024] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071024] via-transparent to-[#071024]" />
          </div>
        </div>

      </main>

      {/* Footer Section */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto border-t border-white/5 py-8 px-6 mt-8 flex flex-col items-center gap-4 text-center">
        {/* Navigation Links */}
        <div className="flex items-center gap-6 text-[13px] font-semibold text-slate-400">
          <a href="#terms" className="hover:text-white transition">Điều khoản</a>
          <a href="#privacy" className="hover:text-white transition">Bảo mật</a>
          <a href="#support" className="hover:text-white transition">Hỗ trợ</a>
        </div>

        {/* SECURE BLOCK LINE */}
        <div className="flex items-center gap-3 w-full max-w-md justify-center">
          <div className="h-[1px] bg-gradient-to-r from-transparent to-white/10 flex-1" />
          <span className="text-[10px] font-extrabold tracking-[0.25em] text-slate-500 uppercase flex items-center gap-1.5">
            🛡️ SSL ENCRYPTED SECURE PAYMENT
          </span>
          <div className="h-[1px] bg-gradient-to-l from-transparent to-white/10 flex-1" />
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-slate-500 leading-normal">
          Hệ thống mã hóa SSL 256-bit bảo mật cao. © 2024. All rights reserved.
        </p>
      </footer>

      {/* Auth Error Modal */}
      <AnimatePresence>
        {authError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#101011] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-white backdrop-blur-2xl"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-accent-secondary to-transparent" />

              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h3 className="text-xl font-extrabold tracking-tight">
                  Xác Thực Giao Dịch
                </h3>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="rounded-full bg-white/5 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="py-8 text-center">
                <svg className="mx-auto h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="mt-4 text-rose-400 font-bold">{authError}</p>
                <button
                  type="button"
                  onClick={() => {
                      if (authError.includes('đăng nhập')) {
                          navigate('/login');
                      } else {
                          setAuthError(null);
                      }
                  }}
                  className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
                >
                  {authError.includes('đăng nhập') ? 'Đăng nhập ngay' : 'Đã hiểu'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutPage;
