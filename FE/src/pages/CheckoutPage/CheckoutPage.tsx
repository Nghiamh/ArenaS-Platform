import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy thông tin gói từ state, mặc định là Gói Chuyên Nghiệp nếu truy cập trực tiếp
  const plan = location.state?.plan || {
    name: 'Chuyên Nghiệp',
    price: '6.948.000',
    period: '/ năm',
    originalPrice: '8.388.000',
  };

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo' | 'banking'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      fullname: '',
      phone: '',
      cardnumber: '',
      expiry: '',
      cvc: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
      fullname: Yup.string().required('Vui lòng nhập họ và tên'),
      phone: Yup.string()
        .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ')
        .required('Vui lòng nhập số điện thoại'),
      // Giả lập validation cho thẻ (chỉ bắt buộc nếu chọn thanh toán bằng thẻ)
      cardnumber: Yup.string().when('paymentMethod', {
        is: () => paymentMethod === 'card',
        then: () => Yup.string().required('Vui lòng nhập số thẻ').min(16, 'Số thẻ quá ngắn'),
      }),
      expiry: Yup.string().when('paymentMethod', {
        is: () => paymentMethod === 'card',
        then: () => Yup.string().required('Vui lòng nhập ngày hết hạn').matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Định dạng MM/YY'),
      }),
      cvc: Yup.string().when('paymentMethod', {
        is: () => paymentMethod === 'card',
        then: () => Yup.string().required('Vui lòng nhập CVC').min(3, 'CVC không hợp lệ'),
      }),
    }),
    onSubmit: (values) => {
      setIsProcessing(true);
      // Giả lập xử lý thanh toán
      setTimeout(() => {
        setIsProcessing(false);
        navigate('/payment-success', {
          state: {
            planName: plan.name,
            price: plan.price,
            paymentMethod: paymentMethod,
            transactionId: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            date: new Date().toLocaleDateString('vi-VN', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            })
          }
        });
      }, 2000);
    },
  });

  return (
    <div className="min-h-screen bg-[#071024] text-white font-sans selection:bg-blue-500/30">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.08),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.05),transparent_32%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">

        {/* Left Section - Payment Form */}
        <div className="flex-[1.2] px-6 py-12 lg:px-16 lg:py-24">
          <button
            onClick={() => navigate('/bang-gia')}
            className="mb-10 flex items-center text-[15px] font-medium text-blue-400 transition hover:text-blue-300"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại bảng giá
          </button>

          <h1 className="mb-2 text-[40px] font-semibold tracking-tight text-white">Thanh toán an toàn.</h1>
          <p className="mb-12 text-[17px] leading-relaxed text-slate-400">Hoàn tất thông tin của bạn dưới đây để kích hoạt gói {plan.name}.</p>

          <form onSubmit={formik.handleSubmit} className="space-y-10">
            {/* Contact Info */}
            <section>
              <h2 className="mb-5 text-[21px] font-semibold tracking-tight text-white">Thông tin liên hệ</h2>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    {...formik.getFieldProps('email')}
                    className={`peer w-full rounded-xl border bg-slate-800/40 px-4 pb-2.5 pt-6 text-[17px] text-white placeholder-transparent outline-none transition focus:ring-1 ${formik.touched.email && formik.errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                    placeholder="Email"
                  />
                  <label htmlFor="email" className={`absolute left-4 top-2 text-[13px] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[17px] peer-focus:top-2 peer-focus:text-[13px] ${formik.touched.email && formik.errors.email ? 'text-red-400' : 'text-slate-400 peer-focus:text-blue-400'
                    }`}>
                    Địa chỉ Email
                  </label>
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-xs text-red-400">{formik.errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        id="fullname"
                        {...formik.getFieldProps('fullname')}
                        className={`peer w-full rounded-xl border bg-slate-800/40 px-4 pb-2.5 pt-6 text-[17px] text-white placeholder-transparent outline-none transition focus:ring-1 ${formik.touched.fullname && formik.errors.fullname
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        placeholder="Họ và tên"
                      />
                      <label htmlFor="fullname" className={`absolute left-4 top-2 text-[13px] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[17px] peer-focus:top-2 peer-focus:text-[13px] ${formik.touched.fullname && formik.errors.fullname ? 'text-red-400' : 'text-slate-400 peer-focus:text-blue-400'
                        }`}>
                        Họ và tên
                      </label>
                    </div>
                    {formik.touched.fullname && formik.errors.fullname && (
                      <p className="mt-1 text-xs text-red-400">{formik.errors.fullname}</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        {...formik.getFieldProps('phone')}
                        className={`peer w-full rounded-xl border bg-slate-800/40 px-4 pb-2.5 pt-6 text-[17px] text-white placeholder-transparent outline-none transition focus:ring-1 ${formik.touched.phone && formik.errors.phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        placeholder="Số điện thoại"
                      />
                      <label htmlFor="phone" className={`absolute left-4 top-2 text-[13px] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[17px] peer-focus:top-2 peer-focus:text-[13px] ${formik.touched.phone && formik.errors.phone ? 'text-red-400' : 'text-slate-400 peer-focus:text-blue-400'
                        }`}>
                        Số điện thoại
                      </label>
                    </div>
                    {formik.touched.phone && formik.errors.phone && (
                      <p className="mt-1 text-xs text-red-400">{formik.errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            {/* Payment Method */}
            <section>
              <h2 className="mb-5 text-[21px] font-semibold tracking-tight text-white">Thanh toán bằng</h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                    : 'border-white/10 bg-white/4 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                >
                  <svg className="mb-2.5 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-[13px] font-semibold">Thẻ tín dụng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('momo');
                    formik.setErrors({}); // Xóa lỗi form thẻ nếu chọn momo
                  }}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${paymentMethod === 'momo'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-[0_0_0_1px_rgba(236,72,153,0.3)]'
                    : 'border-white/10 bg-white/4 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                >
                  <svg className="mb-2.5 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[13px] font-semibold">Ví MoMo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('banking');
                    formik.setErrors({}); // Xóa lỗi form thẻ nếu chọn banking
                  }}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${paymentMethod === 'banking'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]'
                    : 'border-white/10 bg-white/4 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                >
                  <svg className="mb-2.5 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <span className="text-[13px] font-semibold">Banking</span>
                </button>
              </div>

              {/* Card Form */}
              <AnimatePresence>
                {paymentMethod === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 space-y-4 overflow-hidden"
                  >
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          id="cardnumber"
                          {...formik.getFieldProps('cardnumber')}
                          className={`peer w-full rounded-xl border bg-slate-800/40 px-4 pb-2.5 pl-12 pt-6 text-[17px] text-white placeholder-transparent outline-none transition focus:ring-1 ${formik.touched.cardnumber && formik.errors.cardnumber
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                          placeholder="Số thẻ"
                        />
                        <label htmlFor="cardnumber" className={`absolute left-12 top-2 text-[13px] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[17px] peer-focus:top-2 peer-focus:text-[13px] ${formik.touched.cardnumber && formik.errors.cardnumber ? 'text-red-400' : 'text-slate-400 peer-focus:text-blue-400'
                          }`}>
                          Số thẻ tín dụng
                        </label>
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      {formik.touched.cardnumber && formik.errors.cardnumber && (
                        <p className="mt-1 text-xs text-red-400">{formik.errors.cardnumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            id="expiry"
                            {...formik.getFieldProps('expiry')}
                            className={`peer w-full rounded-xl border bg-slate-800/40 px-4 pb-2.5 pt-6 text-[17px] text-white placeholder-transparent outline-none transition focus:ring-1 ${formik.touched.expiry && formik.errors.expiry
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                            placeholder="MM/YY"
                          />
                          <label htmlFor="expiry" className={`absolute left-4 top-2 text-[13px] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[17px] peer-focus:top-2 peer-focus:text-[13px] ${formik.touched.expiry && formik.errors.expiry ? 'text-red-400' : 'text-slate-400 peer-focus:text-blue-400'
                            }`}>
                            Ngày hết hạn
                          </label>
                        </div>
                        {formik.touched.expiry && formik.errors.expiry && (
                          <p className="mt-1 text-xs text-red-400">{formik.errors.expiry}</p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            id="cvc"
                            {...formik.getFieldProps('cvc')}
                            className={`peer w-full rounded-xl border bg-slate-800/40 px-4 pb-2.5 pt-6 text-[17px] text-white placeholder-transparent outline-none transition focus:ring-1 ${formik.touched.cvc && formik.errors.cvc
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                            placeholder="CVC"
                          />
                          <label htmlFor="cvc" className={`absolute left-4 top-2 text-[13px] font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[17px] peer-focus:top-2 peer-focus:text-[13px] ${formik.touched.cvc && formik.errors.cvc ? 'text-red-400' : 'text-slate-400 peer-focus:text-blue-400'
                            }`}>
                            Mã bảo mật (CVC)
                          </label>
                        </div>
                        {formik.touched.cvc && formik.errors.cvc && (
                          <p className="mt-1 text-xs text-red-400">{formik.errors.cvc}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isProcessing}
                className={`flex w-full items-center justify-center rounded-2xl bg-blue-500 px-4 py-4 text-[17px] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${isProcessing ? 'cursor-not-allowed opacity-80' : ''
                  }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  `Thanh toán ${plan.price}đ`
                )}
              </button>
              <div className="mt-4 flex items-center justify-center text-[12px] text-slate-400">
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Dữ liệu được mã hóa SSL an toàn.
              </div>
            </div>
          </form>
        </div>

        {/* Right Section - Order Summary */}
        <div className="flex-1 px-6 py-12 lg:pl-0 lg:pr-8 lg:py-24">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-2xl">
            <h2 className="mb-6 text-[21px] font-semibold tracking-tight text-white">Tóm tắt đơn hàng</h2>

            <div className="mb-6 border-b border-white/10 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[17px] font-semibold text-white">{`Gói ${plan.name}`}</h3>
                  <p className="mt-1 text-[14px] text-slate-400">Chu kỳ: {plan.period.includes('năm') ? 'Hàng năm' : 'Hàng tháng'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[17px] font-semibold text-white">{plan.price}đ</p>
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-3 border-b border-white/10 pb-6 text-[15px]">
              <div className="flex justify-between text-white">
                <span>Tạm tính</span>
                <span>{plan.originalPrice || plan.price}đ</span>
              </div>
              {plan.originalPrice && (
                <div className="flex justify-between text-emerald-400">
                  <span>Chiết khấu thanh toán năm</span>
                  <span>-{parseInt(plan.originalPrice.replace(/\./g, '')) - parseInt(plan.price.replace(/\./g, ''))}đ</span>
                </div>
              )}
              <div className="flex justify-between text-white">
                <span>Thuế VAT (10%)</span>
                <span>0đ</span>
              </div>
            </div>

            <div className="mb-8 flex items-end justify-between">
              <span className="text-[19px] font-semibold text-white">Tổng cộng</span>
              <div className="text-right">
                <span className="text-[28px] font-bold tracking-tight text-white">{plan.price}đ</span>
                <p className="mt-0.5 text-[12px] text-slate-400">Bao gồm các loại thuế có thể áp dụng</p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
              <div className="flex gap-4">
                <svg className="mt-0.5 h-6 w-6 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h4 className="text-[15px] font-semibold text-blue-100">Cam kết hoàn tiền</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-blue-200/70">
                    Bạn có 14 ngày để trải nghiệm đầy đủ tính năng. Hoàn tiền 100% nếu không hài lòng. Hủy bỏ bất cứ lúc nào.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
