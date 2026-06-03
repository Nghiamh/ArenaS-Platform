import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../../Axios/Axios';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác nhận email của bạn...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token không hợp lệ hoặc không tồn tại.');
      return;
    }

    const handleVerify = async () => {
      try {
        const response = await verifyEmail({ token });
        setStatus('success');
        setMessage(response.message || 'Xác nhận email thành công!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Xác nhận email thất bại. Liên kết có thể đã hết hạn.');
      }
    };

    handleVerify();
  }, [token]);

  return (
    <div className="min-h-screen bg-deep text-white flex items-center justify-center font-inter p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
        {status === 'loading' && (
          <div className="animate-pulse">
            <h2 className="text-2xl font-black mb-4 font-montserrat">Đang Xử Lý</h2>
            <p className="text-slate-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-4 font-montserrat">Thành Công!</h2>
            <p className="text-slate-300 mb-8">{message}</p>
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center px-8 rounded-lg bg-accent-primary text-deep font-bold hover:bg-accent-primary/90 transition-colors"
            >
              Đến trang Đăng Nhập
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-4 font-montserrat">Lỗi Xác Nhận</h2>
            <p className="text-slate-300 mb-8">{message}</p>
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center px-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/20"
            >
              Quay lại Đăng Nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
