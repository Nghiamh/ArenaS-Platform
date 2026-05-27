import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M16.5 7.5c-1.3 0-2.4 1-3.2 2-.5-1-1.8-2.2-3.3-2.2-2.3 0-4.5 2-4.5 5 0 3.3 2 6 3.6 8 .8.8 1.5 1.5 2.5 1.5s1.7-.5 2.8-.5c1.1 0 1.8.5 2.8.5 1 0 1.8-.8 2.5-1.5 1.5-2 3.6-5 3.6-8 0-3-2.2-5-4.5-5zm-3.2-1C13.8 5 14.5 3 14 1c-1.5 0-3 1.2-3.8 2.5-.7 1-.8 2-.6 3.5 1.3 0 2.8-1 3.7-2z" />
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

const PatternIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="11" y="2" width="2" height="6" fill="#00F5FF" />
    <rect x="11" y="16" width="2" height="6" fill="#00F5FF" />
    <rect x="16" y="11" width="6" height="2" fill="#00F5FF" />
    <rect x="2" y="11" width="6" height="2" fill="#00F5FF" />
    <circle cx="12" cy="12" r="3" fill="#00F5FF" />
  </svg>
);

const RunIcon = () => (
  <svg viewBox="0 0 24 24" fill="#CCFF00" className="h-6 w-6" aria-hidden="true">
    <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.7 1.4 1.1-5.4z" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const googleClientRef = useRef<GoogleCodeClient | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resolvePostLoginPath = (role: 'user' | 'owner' | 'admin', redirectPath?: string): string => {
    if (redirectPath?.trim()) {
      return redirectPath;
    }
    if (role === 'owner') return '/owner/dashboard';
    if (role === 'admin') return '/admin/dashboard';
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
      if (cancelled) return;
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
      return () => { cancelled = true; };
    }

    const scriptId = 'google-identity-services';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    const handleLoad = () => initGoogleClient();

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', () => setErrorMessage('Không tải được Google Identity Services.'));
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', handleLoad);
      if (window.google?.accounts?.oauth2) initGoogleClient();
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
      const response = await loginApi({ identifier: identifier.trim(), password });
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      navigate(resolvePostLoginPath(response.user.role, response.redirectPath), {
        state: { toastMessage: `Đăng nhập thành công. Xin chào ${response.user.userName}!` },
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
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col lg:flex-row font-inter">
      {/* LEFT SECTION (IMAGE) */}
      <section className="hidden lg:flex relative w-full lg:w-1/2 min-h-screen flex-col justify-between p-12 overflow-hidden border-r border-white/5">
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
          {/* Logo */}
          <Link to="/home" className="inline-flex items-center gap-2 self-start transition-opacity hover:opacity-80">
            <RunIcon />
            <span className="text-xl font-black tracking-[0.2em] text-[#CCFF00] uppercase font-montserrat">
              ArenaS
            </span>
          </Link>

          {/* Main Text */}
          <div className="mb-20">
            <h1 className="text-[3.5rem] font-black leading-[1.1] tracking-tight text-white mb-6 font-montserrat">
              Đặt Sân,<br />
              <span className="text-[#CCFF00]">Nhanh Chóng</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-md">
              ArenaS - Nền tảng đặt sân thể thao hàng đầu, mang đến trải nghiệm liền mạch và tiện lợi cho người dùng.
            </p>
          </div>

          {/* Stats Cards */}
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

        <div className="w-full max-w-[28rem]">
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white mb-2 font-montserrat">
              Đăng nhập hệ thống
            </h2>
            <p className="text-sm text-slate-400">
              Chào mừng trở lại. Nhập thông tin để tiếp tục.
            </p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleSubmitting || !isGoogleReady}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:border-white/20"
            >
              <GoogleIcon />
              {isGoogleSubmitting ? 'Đang...' : 'Google'}
            </button>
            <button
              type="button"
              disabled={isGoogleSubmitting}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:border-white/20"
            >
              <AppleIcon />
              Apple
            </button>
          </div>

          <div className="relative mb-6 text-center">
            <span className="relative z-10 bg-[#0A0A0B] px-4 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Hoặc</span>
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2" />
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                Email / Tên Đăng Nhập
              </label>
              <div className="flex items-center gap-3 border-b border-white/20 pb-2 pt-1 transition-colors focus-within:border-[#CCFF00]">
                <span className="text-slate-500">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  placeholder="admin@arenas.com"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
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
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between pt-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-transparent text-[#CCFF00] focus:ring-[#CCFF00] focus:ring-offset-0 transition-colors"
                />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#CCFF00] transition hover:opacity-80">
                Quên mật khẩu?
              </Link>
            </div>

            {errorMessage && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2A3317] border border-[#CCFF00]/30 text-sm font-bold text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)] transition-all hover:bg-[#CCFF00] hover:text-[#0A0A0B] hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] disabled:opacity-50 uppercase tracking-wider"
            >
              {isSubmitting ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}
              {!isSubmitting && <span>→</span>}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-slate-400">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-[#00F5FF] transition hover:opacity-80">
              Đăng ký ngay
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
