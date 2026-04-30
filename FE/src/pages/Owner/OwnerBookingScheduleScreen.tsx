import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerBookingScheduleBoard } from './OwnerBookingScheduleBoard';

const todayBadge = '5 lượt đặt hôm nay';

type BookingViewMode = 'day' | 'week';

const viewButtonClass = (active: boolean) =>
  active
    ? 'rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_25px_-18px_rgba(37,99,235,0.9)]'
    : 'px-4 py-2 text-sm font-semibold text-slate-400 transition hover:text-white';

export const OwnerBookingScheduleScreen: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('ownerSidebarCollapsed') === '1');
  const [viewMode, setViewMode] = useState<BookingViewMode>('day');

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.1),transparent_28%)]" />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-columns] xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="bookings"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-3xl">Lịch Đặt Sân</h1>
                <p className="mt-1 text-sm text-slate-400">Xin chào, Minh Tuấn 👋 — Thứ Hai, 02/03/2026</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  aria-label="Thông báo"
                >
                  🔔
                </button>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 font-black text-white shadow-[0_18px_35px_-20px_rgba(37,99,235,0.95)]">M</div>
              </div>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 shadow-[0_18px_35px_-24px_rgba(16,185,129,0.95)]">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-400/10">✓</span>
                {todayBadge}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]">Tất cả cơ sở</button>
                <button className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]">Tất cả trạng thái</button>
                <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-1">
                  <button type="button" onClick={() => setViewMode('day')} className={viewButtonClass(viewMode === 'day')}>
                    Ngày
                  </button>
                  <button type="button" onClick={() => setViewMode('week')} className={viewButtonClass(viewMode === 'week')}>
                    Tuần
                  </button>
                  <button type="button" className="px-4 py-2 text-sm font-semibold text-slate-400 transition hover:text-white">
                    Danh sách
                  </button>
                </div>
              </div>
            </div>

            <OwnerBookingScheduleBoard viewMode={viewMode} />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
