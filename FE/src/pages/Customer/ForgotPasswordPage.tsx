import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as forgotPasswordApi } from '../../Axios/Axios';

const RunIcon = () => (
  <svg viewBox="0 0 24 24" fill="#CCFF00" className="h-6 w-6" aria-hidden="true">
    <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.7 1.4 1.1-5.4z" />
  </svg>
);

const PatternIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="11" y="2" width="2" height="6" fill="#00F5FF" />
    <rect x="11" y="16" width="2" height="6" fill="#00F5FF" />
    <rect x="16" y="11" width="6" height="2" fill="#00F5FF" />
    <rect x="2" y="11" width="6" height="2" fill="#00F5FF" />
    <circle cx="12" cy="12" r="3" fill="#00F5FF" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
    <path d="m5 8 7 5 7-5" />
  </svg>
);

const BackArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M15 18 9 12l6-6" />
  </svg>
);

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập email đã đăng ký.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await forgotPasswordApi({ email: trimmedEmail });
      setSuccessMessage(response.message);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể gửi email đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col lg:flex-row font-inter">
      {/* LEFT SECTION (IMAGE) */}
      <section className="hidden lg:flex relative w-full lg:w-1/2 min-h-screen flex-col justify-between p-12 overflow-hidden border-r border-white/5 sticky top-0">
        <div 
          className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/80 to-[#0A0A0B]/30" />
        <div className="absolute -left-20 top-1/4 h-[300px] w-[300px] rounded-full bg-[#CCFF00]/10 blur-[100px] z-0" />
        
        <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
          <Link to="/home" className="inline-flex items-center gap-2 self-start transition-opacity hover:opacity-80">
            <RunIcon />
            <span className="text-xl font-black tracking-[0.2em] text-[#CCFF00] uppercase font-montserrat">
              ArenaS
            </span>
          </Link>

          <div className="mb-20 mt-auto">
            <h1 className="text-[3.5rem] font-black leading-[1.1] tracking-tight text-white mb-6 font-montserrat">
              Đặt lại mật khẩu,<br/>
              <span className="text-[#CCFF00]">An Toàn Nhanh.</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-md">
              Hệ thống quản lý chiến thuật dành riêng cho môi trường thể thao chuyên nghiệp. Kiểm soát mọi dữ liệu trong lòng bàn tay.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#00F5FF] uppercase mb-2">Hội viên Active</p>
              <p className="text-3xl font-black text-white">12,450+</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#CCFF00] uppercase mb-2">Tăng trưởng</p>
              <p className="text-3xl font-black text-white flex items-center gap-2">
                <span className="text-[#CCFF00]">↗</span> 34.2%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT SECTION (FORM) */}
      <section className="relative flex w-full lg:w-1/2 min-h-screen items-center justify-center p-6 sm:p-12">
        <div className="absolute top-8 right-8 opacity-40">
          <PatternIcon />
        </div>
        
        <div className="w-full max-w-[28rem] py-8">
          <div className="mb-10">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#00F5FF] transition hover:opacity-80 mb-6"
            >
              <BackArrowIcon />
              QUAY LẠI ĐĂNG NHẬP
            </Link>
            
            <h2 className="text-3xl font-black tracking-tight text-white mb-2 font-montserrat">
              Quên Mật Khẩu
            </h2>
            <p className="text-sm text-slate-400">
              Nhập email để nhận liên kết đặt lại mật khẩu
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                Địa Chỉ Email
              </label>
              <div className="flex items-center gap-3 border-b border-white/20 pb-2 pt-1 transition-colors focus-within:border-[#CCFF00]">
                <span className="text-slate-500">
                  <EnvelopeIcon />
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="login-input w-full bg-transparent border-0 p-0 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-lg border border-[#CCFF00]/30 bg-[#CCFF00]/10 px-4 py-3 text-xs text-[#CCFF00]">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2A3317] border border-[#CCFF00]/30 text-sm font-bold text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)] transition-all hover:bg-[#CCFF00] hover:text-[#0A0A0B] hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] disabled:opacity-50 uppercase tracking-wider"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi Liên Kết Đặt Lại'} 
              {!isSubmitting && <span>→</span>}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-slate-400">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-[#00F5FF] transition hover:opacity-80">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>

        <div className="absolute bottom-6 right-8">
          <span className="text-[9px] font-bold tracking-[0.2em] text-[#CCFF00]/50 uppercase">
            * Sys.Auth.v2
          </span>
        </div>
      </section>
    </div>
  );
};
