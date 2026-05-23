import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login as loginApi, loginWithGoogle as loginWithGoogleApi } from '../../Axios/Axios';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient;
        };
      };
    };
  }
}

type GoogleCodeResponse = {
  code?: string;
  error?: string;
  error_description?: string;
};

type GoogleCodeClientConfig = {
  client_id: string;
  scope: string;
  ux_mode?: 'popup';
  prompt?: string;
  callback: (response: GoogleCodeResponse) => void;
};

type GoogleCodeClient = {
  requestCode: () => void;
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.7H12Z"
    />
    <path
      fill="#4285F4"
      d="M22 12.4c0-.7-.1-1.2-.2-1.7H12v3.2h5.7c-.3 1.7-1.4 2.9-2.9 3.6v3h4.6C20.8 18.9 22 15.9 22 12.4Z"
    />
    <path fill="#FBBC05" d="M5.9 14.1a6 6 0 0 1 0-4.2v-3H1.3a10 10 0 0 0 0 10.1l4.6-2.9Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5l-4.6-3a6 6 0 0 1-8.2-2.4l-4.6 2.9A10 10 0 0 0 12 22Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12a12 12 0 1 0-13.9 11.8v-8.3H7.2V12h2.9V9.4c0-2.8 1.7-4.3 4.2-4.3 1.2 0 2.4.2 2.4.2v2.7h-1.4c-1.4 0-1.8.9-1.8 1.8V12h3.1l-.5 3.5h-2.6v8.3A12 12 0 0 0 24 12Z"
    />
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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

const StarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="m12 2.2 3 6.1 6.7 1-4.9 4.8 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.8 6.7-1L12 2.2Z" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleClientRef = useRef<GoogleCodeClient | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loginState = location.state as { returnTo?: string } | null;

  const resolvePostLoginPath = (role: 'user' | 'owner' | 'admin', redirectPath?: string): string => {
    if (redirectPath?.trim()) {
      return redirectPath;
    }

    if (loginState?.returnTo?.trim()) {
      return loginState.returnTo;
    }

    if (role === 'owner') {
      return '/owner/dashboard';
    }

    if (role === 'admin') {
      return '/admin/dashboard';
    }

    return '/home';
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    if (!clientId) {
      setErrorMessage('Thiếu VITE_GOOGLE_CLIENT_ID trong FE/.env');
      return;
    }

    let cancelled = false;

    const initGoogleClient = () => {
      if (cancelled) {
        return;
      }

      if (!window.google?.accounts?.oauth2) {
        setErrorMessage('Google Identity Services chưa sẵn sàng.');
        return;
      }

      googleClientRef.current = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response) => {
          if (response.error) {
            setErrorMessage(response.error_description ?? response.error);
            return;
          }

          if (!response.code) {
            setErrorMessage('Không nhận được mã xác thực từ Google.');
            return;
          }

          try {
            setIsGoogleSubmitting(true);
            setErrorMessage('');

            const authResponse = await loginWithGoogleApi({ code: response.code });

            localStorage.setItem('accessToken', authResponse.token);
            localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
            navigate(resolvePostLoginPath(authResponse.user.role, authResponse.redirectPath), {
              state: {
                toastMessage: `Đăng nhập Google thành công. Xin chào ${authResponse.user.userName}!`,
              },
            });
          } catch (error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Đăng nhập Google thất bại.');
          } finally {
            setIsGoogleSubmitting(false);
          }
        },
      });

      setIsGoogleReady(true);
    };

    if (window.google?.accounts?.oauth2) {
      initGoogleClient();
      return () => {
        cancelled = true;
      };
    }

    const scriptId = 'google-identity-services';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleLoad = () => {
      initGoogleClient();
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', () => {
        setErrorMessage('Không tải được Google Identity Services.');
      });
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', handleLoad);
      if (window.google?.accounts?.oauth2) {
        initGoogleClient();
      }
    }

    return () => {
      cancelled = true;
      script?.removeEventListener('load', handleLoad);
    };
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Vui lòng nhập email/tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await loginApi({
        identifier: identifier.trim(),
        password,
      });

      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      navigate(resolvePostLoginPath(response.user.role, response.redirectPath), {
        state: {
          toastMessage: `Đăng nhập thành công. Xin chào ${response.user.userName}!`,
        },
      });
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại. Email/tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrorMessage('');

    if (!isGoogleReady || !googleClientRef.current) {
      setErrorMessage('Google chưa sẵn sàng, vui lòng thử lại sau vài giây.');
      return;
    }

    googleClientRef.current.requestCode();
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section
          className="relative flex min-h-[48vh] overflow-hidden border-b border-white/5 lg:min-h-screen lg:border-b-0 lg:border-r lg:border-white/5"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(3,8,25,0.92) 0%, rgba(3,8,25,0.74) 50%, rgba(3,8,25,0.86) 100%), url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.22))]" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <Link to="/home" className="inline-flex items-center gap-3 self-start">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-[0_12px_30px_-10px_rgba(37,99,235,0.9)]">
                A
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)]">
                ArenaS
              </span>
            </Link>

            <div className="max-w-xl pb-6 pt-10 sm:pt-16 lg:pt-0">
              <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-blue-400">
                <span className="text-xl leading-none">⚡</span>
                Đấu Trường Chờ Bạn
              </div>

              <h1 className="mt-5 max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-[4.5rem]">
                Đặt Sân. Thi Đấu.
                <span className="block text-blue-500">Chiến Thắng.</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-8 text-slate-300 sm:text-lg">
                Tham gia cùng 50.000+ vận động viên đặt sân, tìm đối thủ và giành chiến thắng trên một nền tảng.
              </p>

              <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">50K+</p>
                  <p className="mt-1 text-sm text-slate-400">Vận Động Viên</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">2K+</p>
                  <p className="mt-1 text-sm text-slate-400">Sân Thể Thao</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">4.9<span className="text-blue-400">★</span></p>
                  <p className="mt-1 text-sm text-slate-400">Xếp Hạng</p>
                </div>
              </div>
            </div>

            <div className="max-w-[38rem] rounded-[1.75rem] border border-white/10 bg-white/10 p-4 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
                    alt="Minh Tuấn"
                    className="h-12 w-12 rounded-full border border-white/20 object-cover"
                  />
                  <div>
                    <p className="text-lg font-bold text-white">Minh Tuấn</p>
                    <p className="text-sm text-slate-400">Bóng Đá · 48 lần đặt sân</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <StarIcon />
                  <StarIcon />
                  <StarIcon />
                  <StarIcon />
                  <StarIcon />
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                &quot;ArenaS tìm được đối thủ cho tôi chỉ trong vài phút. Ứng dụng thể thao tuyệt vời nhất tôi từng dùng!&quot;
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[#0a1020] px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex justify-start lg:justify-start">
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
                Chào Mừng Trở Lại
              </h2>
              <p className="mt-4 text-lg text-blue-300/85">
                Đăng nhập vào tài khoản ArenaS của bạn để tiếp tục
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleSubmitting || !isGoogleReady}
                  className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-base font-semibold text-slate-200 shadow-[0_18px_35px_-24px_rgba(0,0,0,0.9)] transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <GoogleIcon />
                  {isGoogleSubmitting ? 'Đang kết nối...' : 'Google'}
                </button>
                <button
                  type="button"
                  disabled={isGoogleSubmitting}
                  className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-base font-semibold text-slate-200 shadow-[0_18px_35px_-24px_rgba(0,0,0,0.9)] transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <FacebookIcon />
                  Facebook
                </button>
              </div>

              <div className="my-8 flex items-center gap-4 text-sm text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                hoặc tiếp tục với tài khoản
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-blue-200/90">Email hoặc Tên Đăng Nhập</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                    <span className="text-slate-500">
                      <UserIcon />
                    </span>
                    <input
                      type="text"
                      placeholder="Nhập email hoặc tên đăng nhập"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      autoComplete="username"
                      className="login-input h-full w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-blue-200/90">Mật Khẩu</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-blue-400/70 focus-within:bg-white/[0.07]">
                    <span className="text-slate-500">
                      <LockIcon />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
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

                <div className="flex items-center justify-between gap-4 pt-1">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-white/15 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Ghi nhớ đăng nhập
                  </label>
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-500 transition hover:text-blue-400">
                    Quên mật khẩu?
                  </Link>
                </div>

                {errorMessage && (
                  <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-14 w-full rounded-2xl bg-[#1560ff] text-base font-bold text-white shadow-[0_18px_38px_-14px_rgba(21,96,255,0.95)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập ArenaS'}
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
