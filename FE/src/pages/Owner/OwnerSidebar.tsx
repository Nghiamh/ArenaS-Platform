import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { getCurrentUserProfile, getMySubscription, type AuthUser, type FESubscription } from '../../Axios/Axios';

type OwnerSidebarKey = 'overview' | 'courts' | 'revenue' | 'bookings' | 'settings';

type OwnerSidebarProps = {
  activeKey: OwnerSidebarKey;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

type MenuItem = {
  key: OwnerSidebarKey;
  label: string;
  to: string;
  count?: number;
  icon: React.ReactNode;
};

const OverviewIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const CourtIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    <path d="M12 5v14" />
    <path d="M3 12h18" />
  </svg>
);

const RevenueIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 20h16" />
    <path d="M7 16v-5" />
    <path d="M12 16V8" />
    <path d="M17 16v-8" />
  </svg>
);

const BookingIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3 10h18" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="m3 10 9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.7 1.7 0 0 0-1.86-.34 1.7 1.7 0 0 0-1.03 1.56V22a2 2 0 1 1-4 0v-.06A1.7 1.7 0 0 0 8 20.38a1.7 1.7 0 0 0-1.86.34l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04A1.7 1.7 0 0 0 3.65 16a1.7 1.7 0 0 0-1.56-1.03H2a2 2 0 1 1 0-4h.06A1.7 1.7 0 0 0 3.62 9 1.7 1.7 0 0 0 3.28 7.14l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04A1.7 1.7 0 0 0 8 3.96a1.7 1.7 0 0 0 1.03-1.56V2a2 2 0 1 1 4 0v.06A1.7 1.7 0 0 0 15 3.62a1.7 1.7 0 0 0 1.86-.34l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04A1.7 1.7 0 0 0 20.35 9a1.7 1.7 0 0 0 1.56 1.03H22a2 2 0 1 1 0 4h-.06A1.7 1.7 0 0 0 20.38 15Z" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M14 8v-3a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3" />
    <path d="m10 12 10 0" />
    <path d="m17 9 3 3-3 3" />
  </svg>
);

const menuItems: MenuItem[] = [
  { key: 'overview', label: 'Tổng Quan', to: '/owner/dashboard', icon: <OverviewIcon /> },
  { key: 'courts', label: 'Quản Lý Sân', to: '/owner/manage-courts', count: 3, icon: <CourtIcon /> },
  { key: 'revenue', label: 'Doanh Thu', to: '/owner/revenue', icon: <RevenueIcon /> },
  { key: 'bookings', label: 'Lịch Đặt Sân', to: '/owner/bookings', count: 8, icon: <BookingIcon /> },
];

const secondaryItems: Array<{ key: OwnerSidebarKey | 'home' | 'logout'; label: string; to: string; icon: React.ReactNode }> = [
  { key: 'home', label: 'Về Trang Chủ', to: '/home', icon: <HomeIcon /> },
  { key: 'settings', label: 'Cài Đặt', to: '/owner/settings', icon: <SettingsIcon /> },
  { key: 'logout', label: 'Đăng Xuất', to: '/login', icon: <LogoutIcon /> },
];

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ activeKey, collapsed, onToggleCollapse }) => {
  const [logoSpinTurns, setLogoSpinTurns] = useState(0);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<FESubscription | null>(null);

  const loadCurrentUserAndSubscription = async (isMounted: boolean) => {
    try {
      const response = await getCurrentUserProfile();
      if (!isMounted) return;

      setCurrentUser(response.user);

      if (response.user.role === 'owner') {
        try {
          const sub = await getMySubscription();
          if (isMounted) {
            setActiveSubscription(sub);
          }
        } catch (err) {
          console.error('Error fetching subscription:', err);
          if (isMounted) {
            setActiveSubscription(null);
          }
        }
      }
    } catch {
      if (!isMounted) return;

      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        setCurrentUser(null);
        setActiveSubscription(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setCurrentUser(parsedUser);
        if (parsedUser.role === 'owner') {
          try {
            const sub = await getMySubscription();
            if (isMounted) {
              setActiveSubscription(sub);
            }
          } catch (err) {
            console.error('Error fetching subscription:', err);
            if (isMounted) {
              setActiveSubscription(null);
            }
          }
        }
      } catch {
        setCurrentUser(null);
        setActiveSubscription(null);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    void loadCurrentUserAndSubscription(isMounted);

    const handleUpdate = () => {
      void loadCurrentUserAndSubscription(isMounted);
    };

    window.addEventListener('currentUserUpdated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('currentUserUpdated', handleUpdate);
    };
  }, []);

  const displayName = currentUser?.name?.trim() || currentUser?.userName?.trim() || 'Tài khoản';
  const displayEmail = currentUser?.email?.trim() || 'Chưa có email';
  
  const profileInitial = useMemo(() => {
    const sourceName = currentUser?.name?.trim() || currentUser?.userName?.trim() || 'U';
    return sourceName.charAt(0).toUpperCase();
  }, [currentUser?.name, currentUser?.userName]);

  const profileBadgeLabel = useMemo(() => {
    if (currentUser?.role === 'admin') return 'Admin';
    if (currentUser?.role === 'user') return 'User';
    
    // For owner, show their plan name or 'Free Plan'
    if (activeSubscription?.status === 'active' && activeSubscription.plan) {
      return activeSubscription.plan.displayName || activeSubscription.plan.name;
    }
    return 'Chưa đăng ký';
  }, [currentUser, activeSubscription]);

  const profileAvatarUrl = currentUser?.avatarUrl?.trim() || '';

  const handleLogoToggle = () => {
    setLogoSpinTurns((prev) => prev + 1);
    onToggleCollapse();
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: collapsed ? '92px' : '300px' }}
      className={`arena-scroll relative border-b border-white/10 bg-gradient-to-b from-[#0A0A0B]/95 to-[#050505]/95 px-3 py-6 backdrop-blur-xl transition-[padding] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r ${collapsed ? 'lg:px-2.5' : 'lg:px-5'
        }`}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-300/35 to-transparent" />

      <div className="flex h-full flex-col">
        <div className={`mb-8 rounded-2xl border border-blue-200/15 bg-[#081734]/75 py-3 shadow-[0_18px_45px_-28px_rgba(59,130,246,0.65)] ${collapsed ? 'px-2' : 'px-3'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.03 }}
              onClick={handleLogoToggle}
              className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-blue-600 font-extrabold text-white shadow-[0_10px_30px_-16px_rgba(37,99,235,1)]"
              aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
            >
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl border border-blue-200/35"
                animate={{ scale: [1, 1.07, 1], opacity: [0.28, 0.62, 0.28] }}
                transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
              />
              <motion.span
                className="relative z-10 inline-block origin-center transform-gpu"
                animate={{ rotate: logoSpinTurns * 360, y: [0, -1.2, 0] }}
                transition={{
                  rotate: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 2.8, ease: 'easeInOut', repeat: Infinity },
                }}
              >
                A
              </motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[1.35rem] font-extrabold leading-none tracking-tight text-white">ArenaS</p>
                  <p className="mt-1 text-xs font-medium text-blue-300">Dashboard Chủ Sân</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!collapsed && <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quản Lý</p>}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = activeKey === item.key;

            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={`group flex w-full items-center rounded-xl py-3 text-left transition ${isActive
                    ? 'border border-blue-200/65 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_12px_34px_-18px_rgba(59,130,246,0.95)]'
                    : 'border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : 'justify-between px-3'}`}
              >
                <span className={`flex items-center font-semibold ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'}>{item.icon}</span>
                  {!collapsed && item.label}
                </span>
                {!collapsed && typeof item.count === 'number' ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-200'}`}>
                    {item.count}
                  </span>
                ) : !collapsed ? (
                  <span className="text-sm opacity-80 transition group-hover:translate-x-0.5">›</span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/10 pt-6">
          {!collapsed && <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Hệ Thống</p>}
          <div className="space-y-1 px-2 text-slate-300">
            {secondaryItems.map((item) => {
              const isActive = activeKey === item.key;

              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={`flex items-center rounded-lg px-2 py-2 transition ${item.key === 'logout'
                      ? 'text-red-300 hover:bg-red-500/10'
                      : isActive
                        ? 'bg-blue-500/20 text-blue-200'
                        : 'hover:bg-white/5'
                    } ${collapsed ? 'justify-center' : 'gap-2'}`}
                >
                  <span className="text-current">{item.icon}</span>
                  {!collapsed && item.label}
                </NavLink>
              );
            })}
          </div>
        </div>

        {!collapsed && (
          <div className="mt-auto pt-8">
            <div className="rounded-2xl border border-white/10 bg-[#0A1B3E]/75 p-3 shadow-[0_20px_45px_-30px_rgba(2,6,23,1)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-blue-600 font-black text-white">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    profileInitial
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{displayName}</p>
                  <p className="text-xs text-slate-300">{displayEmail}</p>
                </div>
                <span className="ml-auto rounded-lg bg-blue-500/25 px-2 py-1 text-xs font-bold text-blue-200">{profileBadgeLabel}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};