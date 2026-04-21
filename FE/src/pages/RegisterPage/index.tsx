import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../../Axios/Axios';

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

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
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

const BackArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M15 18 9 12l6-6" />
  </svg>
);

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!userName.trim() || !email.trim() || !password) {
      setErrorMessage('Vui long nhap day du ten, email va mat khau.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mat khau xac nhan khong khop.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await registerApi({
        userName: userName.trim(),
        email: email.trim(),
        password,
      });

      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      setSuccessMessage('Dang ky thanh cong, dang chuyen huong...');
      navigate('/home');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Dang ky that bai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section
          className="relative hidden min-h-screen overflow-hidden border-r border-white/5 lg:flex"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(3,8,25,0.92) 0%, rgba(3,8,25,0.74) 50%, rgba(3,8,25,0.86) 100%), url(https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.22))]" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between px-10 py-10">
            <Link to="/home" className="inline-flex items-center gap-3 self-start">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-[0_12px_30px_-10px_rgba(37,99,235,0.9)]">
                A
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white">ArenaS</span>
            </Link>

            <div className="max-w-xl pb-10">
              <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-blue-400">
                <span className="text-xl leading-none">⚡</span>
                Gia Nhập Cộng Đồng
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-white">
                Tạo Tài Khoản.
                <span className="block text-blue-500">Vào Trận Nhanh.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Đăng ký trong 1 phút để đặt sân, kết nối đối thủ và quản lý lịch thi đấu ngay trên ArenaS.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[#0a1020] px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex justify-start">
              <Link
                to="/home"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
              >
                <BackArrowIcon />
                Quay Lại Trang Chủ
              </Link>
            </div>

            <div className="mx-auto max-w-[31rem]">
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-[3rem]">
                Tạo Tài Khoản Mới
              </h2>
              <p className="mt-4 text-lg text-blue-300/85">
                Điền thông tin để bắt đầu hành trình cùng ArenaS
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-blue-200/90">Họ Và Tên</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                    <span className="text-slate-500">
                      <UserIcon />
                    </span>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={userName}
                      onChange={(event) => setUserName(event.target.value)}
                      autoComplete="name"
                      className="login-input h-full w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-blue-200/90">Địa Chỉ Email</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                    <span className="text-slate-500">
                      <EnvelopeIcon />
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      className="login-input h-full w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-blue-200/90">Mật Khẩu</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                    <span className="text-slate-500">
                      <LockIcon />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tạo mật khẩu"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      className="login-input h-full w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-slate-500 transition hover:text-slate-300"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <EyeIcon hidden={!showPassword} />
                    </button>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-blue-200/90">Xác Nhận Mật Khẩu</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                    <span className="text-slate-500">
                      <LockIcon />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      className="login-input h-full w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="text-slate-500 transition hover:text-slate-300"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <EyeIcon hidden={!showConfirmPassword} />
                    </button>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 rounded border-white/15 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span>
                    Tôi đồng ý với <span className="text-blue-400">Điều khoản dịch vụ</span> và <span className="text-blue-400">Chính sách bảo mật</span>
                  </span>
                </label>

                {errorMessage && (
                  <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {successMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-14 w-full rounded-2xl bg-[#1560ff] text-base font-bold text-white shadow-[0_18px_38px_-14px_rgba(21,96,255,0.95)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  {isSubmitting ? 'Dang tao tai khoan...' : 'Tạo Tài Khoản ArenaS'}
                </button>
              </form>

              <p className="mt-8 text-center text-base text-slate-400">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-bold text-blue-500 transition hover:text-blue-400">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
