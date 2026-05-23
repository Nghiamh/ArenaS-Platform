import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

export type AdminSectionKey = 'dashboard' | 'stadiums' | 'users';

type AdminSidebarProps = {
  activeKey: AdminSectionKey;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

type SidebarItem = {
  key: AdminSectionKey;
  label: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
};

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4Z" />
    <path d="M13 5.5A1.5 1.5 0 0 1 14.5 4h5A1.5 1.5 0 0 1 21 5.5v2A1.5 1.5 0 0 1 19.5 9h-5A1.5 1.5 0 0 1 13 7.5v-2Z" />
    <path d="M4 14.5A1.5 1.5 0 0 1 5.5 13h5A1.5 1.5 0 0 1 12 14.5v5A1.5 1.5 0 0 1 10.5 21h-5A1.5 1.5 0 0 1 4 19.5v-5Z" />
    <path d="M14 13h6" />
    <path d="M17 16v5" />
  </svg>
);

const StadiumIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
    <path d="M12 5v14" />
    <path d="M4 12h16" />
    <path d="M8.5 9.5v5" />
    <path d="M15.5 9.5v5" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="m3 10 9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M10 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1" />
    <path d="m13 12 7 0" />
    <path d="m17 9 3 3-3 3" />
    <path d="M13 12H4" />
  </svg>
);

const sidebarItems: SidebarItem[] = [
  {
    key: 'dashboard',
    label: 'Tổng quan',
    description: 'Theo dõi hoạt động vận hành',
    to: '/admin/dashboard',
    icon: <DashboardIcon />,
  },
  {
    key: 'stadiums',
    label: 'Quản lý sân',
    description: 'Duyệt và cập nhật sân',
    to: '/admin/manage-stadiums',
    icon: <StadiumIcon />,
  },
  {
    key: 'users',
    label: 'Người dùng',
    description: 'Quản lý tài khoản',
    to: '/admin/manage-users',
    icon: <UsersIcon />,
  },
];

const quickLinks = [
  { label: 'Về trang chủ', to: '/home', icon: <HomeIcon /> },
  { label: 'Đăng xuất', to: '/login', icon: <LogoutIcon /> },
];

const stats = [
  { label: 'Chờ duyệt', value: '02', tone: 'border-amber-400/20 bg-amber-500/10 text-amber-100' },
  { label: 'Hôm nay', value: '128', tone: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100' },
];

const activeClass =
  'border-cyan-300/40 bg-gradient-to-r from-cyan-500/18 via-blue-500/14 to-sky-500/12 text-white shadow-[0_16px_35px_-22px_rgba(14,165,233,0.95)]';

const inactiveClass = 'border-white/8 bg-white/[0.02] text-slate-300 hover:border-white/12 hover:bg-white/[0.06] hover:text-white';

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeKey, collapsed, onToggleCollapse }) => {
  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: collapsed ? '96px' : '308px' }}
      className={`arena-scroll relative border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,#020617_0%,#020817_55%,#030712_100%)] px-3 py-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:py-5 ${
        collapsed ? 'lg:px-2.5' : 'lg:px-5'
      }`}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-300/25 to-transparent" />

      <div className="relative flex h-full flex-col">
        <div className={`rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_48px_-30px_rgba(14,165,233,0.52)] ${collapsed ? 'mb-4' : 'mb-5'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3.5'}`}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 font-black text-white shadow-[0_14px_30px_-16px_rgba(14,165,233,0.95)] transition hover:scale-[1.02]"
              aria-label={collapsed ? 'Mở rộng sidebar admin' : 'Thu gọn sidebar admin'}
            >
              <span className="absolute inset-0 rounded-2xl border border-white/20" />
              AS
            </button>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="min-w-0"
                >
                  <p className="text-[1.05rem] font-black leading-none tracking-tight text-white">ArenaS Admin</p>
                  <p className="mt-1 text-xs font-medium text-cyan-300/90">Bảng điều khiển quản trị</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!collapsed && (
          <div className="mb-5 rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4 shadow-[0_22px_45px_-34px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trạng thái</p>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">Online</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <div key={item.label} className={`rounded-2xl border px-3 py-3 ${item.tone}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between px-2">
          {!collapsed && <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Điều hướng</p>}
          {collapsed && <span className="mx-auto h-1.5 w-8 rounded-full bg-white/20" />}
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = activeKey === item.key;

            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive: routeActive }) =>
                  `group relative flex w-full items-center rounded-2xl border px-3 py-3 transition-all duration-200 ${
                    isActive || routeActive ? activeClass : inactiveClass
                  } ${collapsed ? 'justify-center' : 'justify-between'}`
                }
              >
                {isActive && !collapsed && <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400" />}
                <span className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-300'}`}>{item.icon}</span>
                  {!collapsed && (
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-5">{item.label}</span>
                      <span className="block text-xs text-slate-400 group-hover:text-slate-300">{item.description}</span>
                    </span>
                  )}
                </span>
                {!collapsed && item.badge ? (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-200">{item.badge}</span>
                ) : !collapsed ? (
                  <span className="text-sm text-white/45 transition group-hover:translate-x-0.5">›</span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/10 pt-5">
          {!collapsed && <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Hệ thống</p>}
          <div className="space-y-1">
            {quickLinks.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive: routeActive }) =>
                  `flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                    routeActive
                      ? 'bg-white/10 text-white'
                      : item.label === 'Đăng xuất'
                        ? 'text-rose-200 hover:bg-rose-500/10 hover:text-rose-100'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center' : 'gap-3'}`
                }
              >
                <span className="text-current">{item.icon}</span>
                {!collapsed && item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6">
          {!collapsed ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 shadow-[0_22px_50px_-34px_rgba(2,6,23,1)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 font-black text-white shadow-[0_10px_24px_-14px_rgba(14,165,233,0.85)]">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-white">Quản trị viên ArenaS</p>
                    <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[11px] font-semibold text-cyan-200">Admin</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Quản lý sân, booking và các trạng thái kiểm duyệt.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600" />
          )}
        </div>
      </div>
    </motion.aside>
  );
};