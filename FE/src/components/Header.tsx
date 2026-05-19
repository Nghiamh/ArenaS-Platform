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
    <header className="sticky top-0 z-50 border-b border-blue-400/15 bg-slate-950/90 text-white shadow-lg backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
              A
            </div>
            <span className="text-2xl font-bold">ArenaS</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/home"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Môn Thể Thao
            </Link>
            <Link
              to="/tim-san"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Tìm Sân
            </Link>
            <Link
              to="/home"
              className="hover:text-blue-400 transition duration-300 font-medium"
            >
              Cộng Đồng
            </Link>
            {isPlayerAccount && (
              <Link
                to="/matchmaking"
                className="hover:text-blue-400 transition duration-300 font-medium flex items-center gap-1.5"
              >
                Tìm Đối Thủ
              </Link>
            )}
            {!isPlayerAccount && (
              <>
                <Link
                  to="/bang-gia"
                  className="hover:text-blue-400 transition duration-300 font-medium"
                >
                  Bảng Giá
                </Link>
                {/* <Link
                  to="#"
                  className="hover:text-blue-400 transition duration-300 font-medium"
                >
                  Dành Cho Chủ Sân
                </Link> */}
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
                  className="flex items-center gap-3 rounded-full border border-blue-300/35 bg-blue-500/10 px-2 py-1.5 text-left transition hover:border-blue-300/60 hover:bg-blue-500/20"
                >
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-base font-black text-slate-950">
                    {profileAvatarUrl ? (
                      <img src={profileAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      profileInitial
                    )}
                  </span>
                  <span className="hidden pr-2 md:block">
                    <span className="block text-sm font-bold text-white">{currentUser?.name ?? currentUser?.userName ?? 'Tài khoản'}</span>
                    <span className="block text-xs text-blue-200/80">Hồ sơ</span>
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-blue-300/30 bg-slate-900/95 p-1.5 shadow-[0_16px_40px_-20px_rgba(2,6,23,0.95)] backdrop-blur">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate(profileMenuPath);
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20"
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
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20"
                      >
                        Trang cá nhân
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden md:flex items-center gap-2 hover:text-blue-400 transition">
                  🔔
                  <span className="text-sm font-medium">Đăng Nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
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
