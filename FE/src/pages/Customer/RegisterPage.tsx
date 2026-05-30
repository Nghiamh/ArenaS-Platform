import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../../Axios/Axios';

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

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
    <path d="m5 8 7 5 7-5" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    {hidden ? (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c6.2 0 10 7 10 7a18.6 18.6 0 0 1-3.3 4.4" />
        <path d="M6.7 7.5A18.4 18.4 0 0 0 2 12s3.8 7 10 7c1 0 1.9-.1 2.8-.3" />
      </>
    ) : (
      <>
        <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!userName.trim() || !email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ username, email và mật khẩu.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setErrorMessage('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }
    if (!hasAcceptedTerms) {
      setErrorMessage('Bạn cần đồng ý Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await registerApi({
        name: fullName.trim(),
        userName: userName.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      navigate('/home', {
        state: { toastMessage: `Đăng ký thành công. Chào mừng ${response.user.userName}!` },
      });
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Đăng ký thất bại.');
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

          <div className="mb-10 mt-auto">
            <h1 className="text-[3rem] font-black leading-[1.1] tracking-tight text-white mb-4 font-montserrat">
              Đăng Ký Nhanh,<br/>
              <span className="text-[#CCFF00]">Trải Nghiệm Đỉnh</span>
            </h1>
            <p className="text-base text-slate-400 leading-relaxed max-w-md">
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
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#CCFF00] transition-colors z-10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Trở về
        </button>
        <div className="absolute top-8 right-8 opacity-40">
          <PatternIcon />
        </div>
        
        <div className="w-full max-w-[28rem] py-4">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight text-white mb-1 font-montserrat">
              Tạo tài khoản mới
            </h2>
            <p className="text-sm text-slate-400">
              Điền thông tin để bắt đầu hành trình cùng ArenaS
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                Họ Và Tên
              </label>
              <div className="flex items-center gap-3 border-b border-white/20 pb-2 pt-1 transition-colors focus-within:border-[#CCFF00]">
                <span className="text-slate-500">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  className="login-input w-full bg-transparent border-0 p-0 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                Tên Đăng Nhập
              </label>
              <div className="flex items-center gap-3 border-b border-white/20 pb-2 pt-1 transition-colors focus-within:border-[#CCFF00]">
                <span className="text-slate-500">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  placeholder="ten_dang_nhap"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  autoComplete="username"
                  className="login-input w-full bg-transparent border-0 p-0 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

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

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                Mật Khẩu
              </label>
              <div className="flex items-center gap-3 border-b border-white/20 pb-2 pt-1 transition-colors focus-within:border-[#CCFF00]">
                <span className="text-slate-500">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="login-input w-full bg-transparent border-0 p-0 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-500 transition hover:text-slate-300 ml-auto"
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                Xác Nhận Mật Khẩu
              </label>
              <div className="flex items-center gap-3 border-b border-white/20 pb-2 pt-1 transition-colors focus-within:border-[#CCFF00]">
                <span className="text-slate-500">
                  <LockIcon />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="login-input w-full bg-transparent border-0 p-0 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-slate-500 transition hover:text-slate-300 ml-auto"
                >
                  <EyeIcon hidden={!showConfirmPassword} />
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 pt-2 text-xs font-medium text-slate-400">
              <input
                type="checkbox"
                checked={hasAcceptedTerms}
                onChange={(event) => setHasAcceptedTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-[#CCFF00] focus:ring-[#CCFF00] focus:ring-offset-0 transition-colors"
              />
              <span>
                Tôi đồng ý với <span className="text-[#00F5FF]">Điều khoản dịch vụ</span> và <span className="text-[#00F5FF]">Chính sách bảo mật</span>
              </span>
            </label>

            {errorMessage && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2A3317] border border-[#CCFF00]/30 text-sm font-bold text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)] transition-all hover:bg-[#CCFF00] hover:text-[#0A0A0B] hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] disabled:opacity-50 uppercase tracking-wider"
            >
              {isSubmitting ? 'Đang Tạo Tài Khoản...' : 'Đăng Ký'} 
              {!isSubmitting && <span>→</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-slate-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-[#00F5FF] transition hover:opacity-80">
              Đăng nhập ngay
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
