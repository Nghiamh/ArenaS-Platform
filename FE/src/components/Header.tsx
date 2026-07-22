import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NotificationBell } from './NotificationBell';
type StoredUser = {
  name?: string;
  userName?: string;
  email?: string;
  role?: 'user' | 'owner' | 'admin';
  avatarUrl?: string;
  xp?: number;
  points?: number;
};

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('currentUser');

      if (!storedUser) {
        setCurrentUser(null);
        return;
      }

      try {
        setCurrentUser(JSON.parse(storedUser) as StoredUser);
      } catch {
        setCurrentUser(null);
      }
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('currentUserUpdated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('currentUserUpdated', syncUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLoggedIn = currentUser !== null;
  const profileInitial = currentUser?.name?.trim().charAt(0).toUpperCase() || currentUser?.userName?.trim().charAt(0).toUpperCase() || 'U';
  const profileAvatarUrl = (currentUser?.avatarUrl ?? '').trim();
  const isPlayerAccount = currentUser?.role === 'user';
  const isManagementAccount = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const profileMenuPath = currentUser?.role === 'owner'
    ? '/owner/dashboard'
    : currentUser?.role === 'admin'
      ? '/admin/dashboard'
      : '/profile';

  const getUserLevelInfo = (xp: number = 0) => {
    if (xp >= 2000) return { name: 'ELITE', color: 'text-[#00d26a]' };
    if (xp >= 1000) return { name: 'DIAMOND', color: 'text-violet-300' };
    if (xp >= 600) return { name: 'PLATINUM', color: 'text-cyan-300' };
    if (xp >= 300) return { name: 'GOLD', color: 'text-yellow-400' };
    if (xp >= 100) return { name: 'SILVER', color: 'text-slate-300' };
    return { name: 'BRONZE', color: 'text-amber-500' };
  };

  const levelInfo = getUserLevelInfo(currentUser?.xp);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsProfileMenuOpen(false);
    navigate('/home', {
      state: {
        toastMessage: 'Đăng xuất thành công.',
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 font-inter" style={{ backgroundColor: 'var(--bg-deep)', borderBottom: '1px solid rgba(var(--accent-primary-rgb), 0.12)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden transition-transform group-hover:scale-105 border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)] bg-[#0A0A0B]">
              <img src="/logo.jpg" alt="ArenaS Logo" className="h-full w-full object-cover scale-[1.15]" />
            </div>
            <span className="text-xl font-black font-montserrat uppercase tracking-[0.18em] text-slate-200">ArenaS</span>
          </Link>

          <Link to="/tim-san" className="text-sm font-semibold text-white/75 transition hover:text-accent-primary">
            Tìm Sân
          </Link>
          {isPlayerAccount && (
            <Link to="/matchmaking" className="text-sm font-semibold text-white/75 transition hover:text-accent-primary">
              Tìm Đối Thủ
            </Link>
          )}
          {!isManagementAccount && (
            <Link to="/cho-chu-san" className="text-sm font-semibold text-white/75 transition hover:text-accent-secondary">
              Liên Hệ Chủ Sân
            </Link>
          )}
          {!isPlayerAccount && (
            <Link to="/bang-gia" className="text-sm font-semibold text-white/75 transition hover:text-accent-primary">
              Bảng Giá
            </Link>
          )}
          <Link to="/download-app" className="text-sm font-bold text-accent-primary transition hover:text-accent-secondary bg-accent-primary/10 px-3 py-1.5 rounded-full border border-accent-primary/30 shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.15)] animate-pulse ml-2">
            Tải APP ngay
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <NotificationBell isLoggedIn={isLoggedIn} />

          {isLoggedIn ? (
            <div className="relative" ref={profileMenuRef}>
              {/* Profile Button */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full px-1.5 py-1 transition"
                style={{
                  border: '1px solid rgba(var(--accent-primary-rgb), 0.25)',
                  backgroundColor: isProfileMenuOpen ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-sm font-black" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    profileInitial
                  )}
                </span>
                <span className="hidden pr-1.5 md:block text-center">
                  <span className="block text-[15px] font-bold leading-tight text-white">{currentUser?.name ?? currentUser?.userName ?? 'Tài khoản'}</span>
                  {currentUser?.role !== 'admin' && (
                    <span className={`block text-[10px] font-bold uppercase tracking-widest ${levelInfo.color} mt-[3px]`}>{levelInfo.name}</span>
                  )}
                </span>
                <svg viewBox="0 0 24 24" className={`hidden md:block h-3.5 w-3.5 text-white/40 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown */}
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl py-1 shadow-xl"
                  style={{
                    backgroundColor: 'var(--bg-deep)',
                    border: '1px solid rgba(var(--accent-primary-rgb), 0.2)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(var(--accent-primary-rgb),0.1)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setIsProfileMenuOpen(false); navigate(profileMenuPath); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:text-white"
                    style={{ ':hover': { backgroundColor: 'rgba(var(--accent-primary-rgb),0.08)' } } as React.CSSProperties}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(var(--accent-primary-rgb),0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {isManagementAccount ? 'Trang quản lý' : 'Trang cá nhân'}
                  </button>
                  {isManagementAccount && (
                    <button
                      type="button"
                      onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:text-white"
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(var(--accent-primary-rgb),0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-secondary)' }}>
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Trang cá nhân
                    </button>
                  )}
                  <div style={{ height: '1px', backgroundColor: 'rgba(var(--accent-primary-rgb),0.1)', margin: '4px 12px' }} />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:text-red-300"
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden md:flex items-center text-sm font-semibold text-white/70 transition hover:text-accent-primary">
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                className="hidden md:flex items-center rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition"
                style={{
                  backgroundColor: 'rgba(var(--accent-primary-rgb), 0.12)',
                  border: '1px solid rgba(var(--accent-primary-rgb), 0.35)',
                  color: 'var(--accent-primary)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--accent-primary)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--bg-deep)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(var(--accent-primary-rgb), 0.12)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent-primary)'; }}
              >
                Đăng Ký
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-accent-secondary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>

      {/* Mobile Menu */ }
  {
    isMobileMenuOpen && (
      <div className="md:hidden absolute top-full left-0 w-full shadow-xl" style={{ backgroundColor: 'var(--bg-deep)', borderBottom: '1px solid rgba(var(--accent-primary-rgb), 0.15)' }}>
        <nav className="flex flex-col px-5 py-5 space-y-1">
          {[
            { to: '/tim-san', label: 'Tìm Sân', show: true },
            { to: '/matchmaking', label: 'Tìm Đối Thủ', show: isPlayerAccount },
            { to: '/cho-chu-san', label: 'Liên Hệ Chủ Sân', show: !isManagementAccount },
            { to: '/bang-gia', label: 'Bảng Giá', show: !isPlayerAccount },
            { to: '/download-app', label: 'Tải APP ngay ⚡', show: true, isHighlight: true },
          ].filter(i => i.show).map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition hover:text-white ${item.isHighlight ? 'text-accent-primary animate-pulse' : 'text-white/80'}`}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(var(--accent-primary-rgb),0.08)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              {item.label}
            </Link>
          ))}
          {!isLoggedIn && (
            <>
              <div style={{ height: '1px', backgroundColor: 'rgba(var(--accent-primary-rgb),0.1)', margin: '8px 4px' }} />
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition"
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(var(--accent-primary-rgb),0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                Đăng Nhập
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-bold"
                style={{ color: 'var(--accent-primary)' }}>
                Đăng Ký Miễn Phí
              </Link>
            </>
          )}
        </nav>
      </div>
    )
  }
    </header >
  );
};
