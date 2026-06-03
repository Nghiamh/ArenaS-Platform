import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';

export type AdminSectionKey =
  | 'dashboard'
  | 'stadiums'
  | 'users'
  | 'moderation'
  | 'vouchers'
  | 'income'
  | 'owner-applications';

type AdminSidebarProps = {
  activeKey: AdminSectionKey;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
    fill="none" stroke="currentColor" strokeWidth="2.2"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const navIcons: Record<AdminSectionKey, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="4" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 13h7M17.5 16.5v5" />
    </svg>
  ),
  stadiums: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <ellipse cx="12" cy="10" rx="9" ry="5" />
      <path d="M3 10v5c0 2.76 4.03 5 9 5s9-2.24 9-5v-5" />
      <path d="M12 5v15" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  ),
  moderation: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  vouchers: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 12V22H4V12" />
      <path d="M22 7H2v5h20V7z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
  income: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  'owner-applications': (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="11" y2="17" />
      <path d="m13 17 2-2 2 2" />
    </svg>
  ),
};

// ─── Nav config ───────────────────────────────────────────────────────────────

type NavItem = {
  key: AdminSectionKey;
  label: string;
  sub: string;
  to: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',          label: 'Tổng quan',      sub: 'Thống kê & hoạt động',   to: '/admin/dashboard'          },
  { key: 'stadiums',           label: 'Quản lý sân',    sub: 'Duyệt và cập nhật sân',  to: '/admin/manage-stadiums'    },
  { key: 'users',              label: 'Người dùng',     sub: 'Tài khoản & phân quyền', to: '/admin/manage-users'       },
  { key: 'owner-applications', label: 'Duyệt chủ sân',  sub: 'Hồ sơ đăng ký',          to: '/admin/owner-applications' },
  { key: 'moderation',         label: 'Kiểm duyệt',     sub: 'Đánh giá & báo cáo',     to: '/admin/moderation'         },
  { key: 'vouchers',           label: 'Kho Voucher',    sub: 'Hệ thống & đối tác',     to: '/admin/vouchers'           },
  { key: 'income',             label: 'Thu nhập',       sub: 'Nạp ví & mua gói',       to: '/admin/income'             },
];

// ─── Tooltip (khi collapsed) ──────────────────────────────────────────────────

const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="group/tip relative flex">
    {children}
    <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 opacity-0 transition-all duration-150 group-hover/tip:opacity-100 group-hover/tip:translate-x-0 translate-x-[-4px]">
      <div className="relative rounded-lg border border-white/[0.08] bg-[#0D1220] px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0D1220]" />
      </div>
    </div>
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const EXPANDED_W = 272;
const COLLAPSED_W = 72;

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeKey, collapsed, onToggleCollapse }) => {
  return (
    <motion.aside
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.06]"
      style={{
        background: 'linear-gradient(180deg, #080D1A 0%, #060A14 50%, #070B16 100%)',
      }}
    >
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-full bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.07),transparent_60%)]" />

      {/* ── Logo / Header ── */}
      <div className={`flex shrink-0 items-center border-b border-white/[0.06] ${collapsed ? 'justify-center px-4 py-5' : 'gap-3 px-5 py-5'}`}>
        {/* Logo mark */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 hover:scale-105"
          aria-label={collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
        >
          AS
          <span className="absolute inset-0 rounded-xl border border-white/20" />
        </button>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="logo-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-black tracking-tight text-white">ArenaS Admin</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">Bảng điều khiển</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.button
              key="chevron"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={onToggleCollapse}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-500 transition hover:bg-white/[0.08] hover:text-slate-300"
              aria-label="Thu gọn sidebar"
            >
              <ChevronIcon collapsed={false} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {/* Section label */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p
              key="nav-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600"
            >
              Menu
            </motion.p>
          )}
        </AnimatePresence>

        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            const icon = navIcons[item.key];

            if (collapsed) {
              return (
                <Tooltip key={item.key} label={item.label}>
                  <NavLink
                    to={item.to}
                    className={() =>
                      `flex h-11 w-full items-center justify-center rounded-xl transition-all duration-150 ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 shadow-sm'
                          : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
                      }`
                    }
                    aria-label={item.label}
                  >
                    <span className="relative">
                      {icon}
                      {isActive && (
                        <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-cyan-400" />
                      )}
                    </span>
                  </NavLink>
                </Tooltip>
              );
            }

            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={() =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/[0.14] to-blue-500/[0.08] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`
                }
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500" />
                )}

                {/* Icon */}
                <span className={`shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {icon}
                </span>

                {/* Label */}
                <span className="min-w-0 flex-1">
                  <span className={`block text-[13px] font-semibold leading-5 ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 group-hover:text-slate-400">
                    {item.sub}
                  </span>
                </span>

                {/* Arrow */}
                {!isActive && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div className={`my-4 border-t border-white/[0.05] ${collapsed ? 'mx-1' : 'mx-2'}`} />

        {/* ── Quick links ── */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p
              key="sys-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600"
            >
              Hệ thống
            </motion.p>
          )}
        </AnimatePresence>

        <div className="space-y-0.5">
          {[
            {
              label: 'Về trang chủ',
              to: '/home',
              icon: (
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ),
              danger: false,
            },
            {
              label: 'Đăng xuất',
              to: '/login',
              icon: (
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              ),
              danger: true,
            },
          ].map((link) => {
            if (collapsed) {
              return (
                <Tooltip key={link.label} label={link.label}>
                  <NavLink
                    to={link.to}
                    className={() =>
                      `flex h-11 w-full items-center justify-center rounded-xl transition-all duration-150 ${
                        link.danger
                          ? 'text-slate-600 hover:bg-rose-500/[0.08] hover:text-rose-400'
                          : 'text-slate-600 hover:bg-white/[0.05] hover:text-slate-300'
                      }`
                    }
                    aria-label={link.label}
                  >
                    {link.icon}
                  </NavLink>
                </Tooltip>
              );
            }

            return (
              <NavLink
                key={link.label}
                to={link.to}
                className={() =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    link.danger
                      ? 'text-slate-500 hover:bg-rose-500/[0.08] hover:text-rose-400'
                      : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
                  }`
                }
              >
                <span className="shrink-0">{link.icon}</span>
                <AnimatePresence initial={false}>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {link.label}
                  </motion.span>
                </AnimatePresence>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ── Footer / Profile ── */}
      <div className={`shrink-0 border-t border-white/[0.06] ${collapsed ? 'p-3' : 'p-4'}`}>
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed-avatar"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="flex justify-center"
            >
              <Tooltip label="Quản trị viên">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white shadow-lg shadow-cyan-500/20">
                  A
                </div>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div
              key="expanded-profile"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white shadow-md shadow-cyan-500/20">
                A
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white leading-none">Quản trị viên</p>
                <p className="mt-1 text-[11px] text-slate-500 leading-none">ArenaS System</p>
              </div>
              <span className="shrink-0 rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-cyan-300">
                ADMIN
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
