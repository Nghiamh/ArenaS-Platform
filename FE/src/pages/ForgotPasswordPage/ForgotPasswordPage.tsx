import React from 'react';
import { Link } from 'react-router-dom';

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
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section
          className="relative hidden min-h-screen overflow-hidden border-r border-white/5 lg:flex"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(3,8,25,0.92) 0%, rgba(3,8,25,0.74) 50%, rgba(3,8,25,0.86) 100%), url(https://images.unsplash.com/photo-1522252234503-e356532cafd5?q=80&w=1600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.22))]" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />

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
                Bảo Mật Tài Khoản
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-white">
                Đặt Lại Mật Khẩu.
                <span className="block text-blue-500">An Toàn Nhanh.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Nhập email đã đăng ký, ArenaS sẽ gửi liên kết khôi phục để bạn quay lại thi đấu trong vài phút.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[#0a1020] px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex justify-start">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
              >
                <BackArrowIcon />
                Quay Lại Đăng Nhập
              </Link>
            </div>

            <div className="mx-auto max-w-[31rem]">
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-[3rem]">
                Quên Mật Khẩu
              </h2>
              <p className="mt-4 text-lg text-blue-300/85">
                Nhập email để nhận liên kết đặt lại mật khẩu
              </p>

              <form className="mt-8 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-blue-200/90">Địa Chỉ Email</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                    <span className="text-slate-500">
                      <EnvelopeIcon />
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="login-input h-full w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  className="mt-2 h-14 w-full rounded-2xl bg-[#1560ff] text-base font-bold text-white shadow-[0_18px_38px_-14px_rgba(21,96,255,0.95)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Gửi Liên Kết Đặt Lại
                </button>
              </form>

              <p className="mt-8 text-center text-base text-slate-400">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-bold text-blue-500 transition hover:text-blue-400">
                  Đăng ký miễn phí
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
