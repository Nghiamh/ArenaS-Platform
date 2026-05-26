import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type StoredUser = {
  name?: string;
  userName?: string;
  email?: string;
  role?: 'user' | 'owner' | 'admin';
  avatarUrl?: string;
};

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0B]/90 text-white shadow-lg backdrop-blur-md font-inter">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="bg-[#CCFF00] rounded-full w-10 h-10 flex items-center justify-center font-black text-[#0A0A0B] text-lg transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.7 1.4 1.1-5.4z" />
              </svg>
            </div>
            <span className="text-2xl font-black font-montserrat uppercase tracking-[0.2em] text-[#CCFF00]">ArenaS</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/tim-san"
              className="hover:text-[#00F5FF] transition duration-300 font-bold"
            >
              Tìm Sân
            </Link>

            {isPlayerAccount && (
              <Link
                to="/matchmaking"
                className="hover:text-[#00F5FF] transition duration-300 font-bold flex items-center gap-1.5"
              >
                Tìm Đối Thủ
              </Link>
            )}
            {!isManagementAccount && (
              <Link
                to="/cho-chu-san"
                className="hover:text-[#CCFF00] transition duration-300 font-bold"
              >
                Liên Hệ Chủ Sân
              </Link>
            )}
            {!isPlayerAccount && (
              <>
                <Link
                  to="/bang-gia"
                  className="hover:text-[#00F5FF] transition duration-300 font-bold"
                >
                  Bảng Giá
                </Link>
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-left transition hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#CCFF00] text-base font-black text-[#0A0A0B]">
                    {profileAvatarUrl ? (
                      <img src={profileAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      profileInitial
                    )}
                  </span>
                  <span className="hidden pr-2 md:block">
                    <span className="block text-sm font-bold text-white tracking-tight">{currentUser?.name ?? currentUser?.userName ?? 'Tài khoản'}</span>
                    <span className="block text-[10px] uppercase font-bold tracking-widest text-[#00F5FF]">Hồ sơ</span>
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0B]/95 p-1.5 shadow-[0_16px_40px_-20px_rgba(204,255,0,0.1)] backdrop-blur">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate(profileMenuPath);
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-[#00F5FF]"
                    >
                      {isManagementAccount ? 'Trang quản lí' : 'Trang cá nhân'}
                    </button>
                    {isManagementAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-[#00F5FF]"
                      >
                        Trang cá nhân
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-400 transition hover:bg-red-500/10"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden md:flex items-center gap-2 hover:text-[#00F5FF] transition">
                  <span className="text-sm font-bold uppercase tracking-wider">Đăng Nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-[#2A3317] border border-[#CCFF00]/30 text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)] font-bold py-2.5 px-6 rounded-xl transition duration-300 hover:bg-[#CCFF00] hover:text-[#0A0A0B] uppercase text-xs tracking-widest"
                >
                  Đăng Ký Miễn Phí
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
