import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword as resetPasswordApi } from '../../Axios/Axios';

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

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!token) {
      setErrorMessage('Liên kết đặt lại mật khẩu không hợp lệ.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ mật khẩu mới.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await resetPasswordApi({ token, password });
      setSuccessMessage(response.message);

      setTimeout(() => {
        navigate('/login', {
          state: {
            toastMessage: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
          },
        });
      }, 1300);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex min-h-screen items-center justify-center bg-[#0a1020] px-6 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0f172a]/70 p-8 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.9)] sm:p-10">
          <h1 className="text-4xl font-black tracking-tight text-white">Đặt Lại Mật Khẩu</h1>
          <p className="mt-3 text-base text-slate-300">Nhập mật khẩu mới để tiếp tục truy cập tài khoản ArenaS.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-blue-200/90">Mật Khẩu Mới</span>
              <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                <span className="text-slate-500">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
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
                  placeholder="Nhập lại mật khẩu mới"
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

            {errorMessage && (
              <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</p>
            )}

            {successMessage && (
              <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{successMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-2xl bg-[#1560ff] text-base font-bold text-white shadow-[0_18px_38px_-14px_rgba(21,96,255,0.95)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Xác Nhận Mật Khẩu Mới'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            Quay lại{' '}
            <Link to="/login" className="font-semibold text-blue-400 transition hover:text-blue-300">
              đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
