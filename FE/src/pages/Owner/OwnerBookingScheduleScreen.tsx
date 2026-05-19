import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerBookingScheduleBoard } from './OwnerBookingScheduleBoard';

type BookingViewMode = 'day' | 'week';

const VIEW_TABS: { key: BookingViewMode | 'list'; label: string }[] = [
  { key: 'day',  label: '📅 Ngày' },
  { key: 'week', label: '📆 Tuần' },
  { key: 'list', label: '📋 DS' },
];

const STATS = [
  { label: 'Lượt đặt hôm nay', value: '5',    unit: '',    color: '#3b82f6', glow: 'rgba(59,130,246,0.25)' },
  { label: 'Đang diễn ra',     value: '2',    unit: '',    color: '#10b981', glow: 'rgba(16,185,129,0.25)' },
  { label: 'Doanh thu hôm nay',value: '2.8', unit: 'M₫', color: '#8b5cf6', glow: 'rgba(139,92,246,0.25)' },
  { label: 'Tỉ lệ kín sân',   value: '62',   unit: '%',   color: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
];

export const OwnerBookingScheduleScreen: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem('ownerSidebarCollapsed') === '1'
  );
  const [viewMode, setViewMode] = useState<BookingViewMode>('day');

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  return (
    <div className="relative min-h-screen bg-[#020B1F] text-slate-100" style={{ overflow: 'hidden' }}>
      {/* Background glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 15% 15%, rgba(37,99,235,0.14) 0%, transparent 35%),
            radial-gradient(circle at 85% 8%,  rgba(14,165,233,0.08) 0%, transparent 30%),
            radial-gradient(circle at 50% 90%, rgba(139,92,246,0.06) 0%, transparent 40%)
          `,
        }}
      />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="bookings"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[1600px] space-y-6"
          >

            {/* ── Page header ── */}
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Lịch Đặt Sân</h1>
                <p className="mt-1 text-sm text-slate-500">Xin chào, Minh Tuấn 👋 · Thứ Hai, 02/03/2026</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-lg transition hover:border-white/20 hover:bg-white/[0.08]"
                  aria-label="Thông báo"
                >
                  🔔
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 font-black text-white" style={{ boxShadow: '0 10px 24px -10px rgba(99,102,241,0.7)' }}>
                  M
                </div>
              </div>
            </header>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map(s => (
                <div
                  key={s.label}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                  style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 16px 30px -20px ${s.glow}` }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6, borderRadius: '2px 2px 0 0' }} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {s.value}<span className="ml-0.5 text-base font-bold" style={{ color: s.color }}>{s.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-white">
                  Tất cả cơ sở ▾
                </button>
                <button className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-white">
                  Trạng thái ▾
                </button>
              </div>

              {/* View tabs */}
              <div className="flex items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                {VIEW_TABS.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => tab.key !== 'list' && setViewMode(tab.key as BookingViewMode)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                      viewMode === tab.key
                        ? 'bg-blue-600 text-white shadow-[0_6px_18px_-8px_rgba(37,99,235,0.9)]'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Board ── */}
            <OwnerBookingScheduleBoard viewMode={viewMode} />

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-4 text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-wider">Nguồn đặt:</span>
              <span className="flex items-center gap-1.5">📱 Qua App</span>
              <span className="flex items-center gap-1.5">📞 Điện thoại</span>
              <span className="flex items-center gap-1.5">🚶 Đến trực tiếp</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Sân hoạt động
                <span className="ml-2 h-2 w-2 rounded-full bg-slate-600" /> Đóng cửa
              </span>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
};
