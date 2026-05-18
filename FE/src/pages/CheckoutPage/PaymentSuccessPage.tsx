import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy thông tin thanh toán từ state
  const paymentData = location.state || {
    planName: 'Chuyên Nghiệp',
    price: '6.948.000',
    paymentMethod: 'card',
    transactionId: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    date: new Date().toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    })
  };

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/owner/dashboard');
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-[#071024] text-white font-sans selection:bg-blue-500/30 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl"
      >
        
        {/* Simple, flat, elegant checkmark icon */}
        <div className="flex justify-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', bounce: 0.5 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-white"
          >
            <motion.svg 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="h-8 w-8" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>
        </div>

        {/* Minimalist Typography */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Cảm ơn bạn.
          </h1>
          <p className="text-lg text-slate-400">
            Thanh toán của bạn đã hoàn tất. Chúng tôi đã gửi email xác nhận.
          </p>
        </div>

        {/* Clean, unstructured receipt details a la Apple/Nike */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto max-w-lg border-t border-b border-white/10 py-8 mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Gói Dịch Vụ
              </h3>
              <p className="text-lg font-medium text-white">
                {paymentData.planName}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Số Tiền
              </h3>
              <p className="text-lg font-medium text-white">
                {paymentData.price}đ
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-left">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Mã Đơn Hàng
              </h3>
              <p className="text-lg font-medium text-white font-mono">
                {paymentData.transactionId}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Ngày Thanh Toán
              </h3>
              <p className="text-lg font-medium text-white">
                {paymentData.date}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Simple actions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/owner/dashboard')}
            className="rounded-full bg-white px-8 py-4 text-[15px] font-bold text-black transition-colors hover:bg-slate-200 focus:outline-none"
          >
            Đến trang Quản lý ArenaS
          </button>
          
          <div className="text-sm font-medium text-slate-500">
            Tự động chuyển hướng sau {countdown}s
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;
