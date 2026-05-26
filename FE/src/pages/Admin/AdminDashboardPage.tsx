import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CurrencyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 2.5-5 2.5-5 5 0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 17 9 11l4 4 8-8" />
    <path d="M14 7h7v7" />
  </svg>
);

const StadiumIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
    <path d="M12 5v14M4 12h16M8.5 9.5v5M15.5 9.5v5" />
  </svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
  </svg>
);

const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string | number;
  change: number;
  subLabel: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

interface BookingItem {
  id: string;
  courtName: string;
  sportType: string;
  date: string;
  time: string;
  customer: string;
  revenue: number;
  status: 'completed' | 'pending' | 'cancelled';
}

// ─── Static data ──────────────────────────────────────────────────────────────

const mockBookings: BookingItem[] = [
  { id: '001', courtName: 'Sân Bóng Đá A1', sportType: 'Bóng Đá', date: '2026-04-28', time: '18:00 - 20:00', customer: 'Nguyễn Văn A', revenue: 250000, status: 'completed' },
  { id: '002', courtName: 'Sân Cầu Lông B2', sportType: 'Cầu Lông', date: '2026-04-29', time: '19:00 - 21:00', customer: 'Trần Thị B', revenue: 180000, status: 'completed' },
  { id: '003', courtName: 'Sân Pickleball C1', sportType: 'Pickleball', date: '2026-04-30', time: '10:00 - 11:30', customer: 'Lê Văn C', revenue: 150000, status: 'pending' },
  { id: '004', courtName: 'Sân Bóng Đá A2', sportType: 'Bóng Đá', date: '2026-04-30', time: '20:00 - 22:00', customer: 'Phạm Minh D', revenue: 250000, status: 'pending' },
  { id: '005', courtName: 'Sân Cầu Lông B1', sportType: 'Cầu Lông', date: '2026-04-25', time: '17:00 - 19:00', customer: 'Vũ Anh E', revenue: 180000, status: 'cancelled' },
];

const STATUS_CONFIG = {
  completed: { label: 'Hoàn thành', className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' },
  pending:   { label: 'Chờ xác nhận', className: 'bg-amber-500/15 text-amber-300 border border-amber-500/25' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-500/15 text-red-300 border border-red-500/25' },
} as const;

const SPORT_BADGE: Record<string, string> = {
  'Bóng Đá':   'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  'Cầu Lông':  'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25',
  Pickleball:  'bg-pink-500/15 text-pink-300 border border-pink-500/25',
};

const chartData = [
  { day: 'T2', revenue: 2.5 },
  { day: 'T3', revenue: 3.8 },
  { day: 'T4', revenue: 3.2 },
  { day: 'T5', revenue: 4.1 },
  { day: 'T6', revenue: 5.2 },
  { day: 'T7', revenue: 4.8 },
  { day: 'CN', revenue: 3.9 },
];

const sportStats = [
  { sport: 'Bóng Đá',  count: 12, bar: 'bg-blue-500',   pct: 45 },
  { sport: 'Cầu Lông', count: 8,  bar: 'bg-yellow-500', pct: 30 },
  { sport: 'Pickleball', count: 7, bar: 'bg-pink-500',  pct: 25 },
];

const quickActions = [
  { label: 'Quản lý sân',    desc: 'Duyệt và cập nhật sân',  icon: <StadiumIcon />,   color: 'from-cyan-600 to-blue-700',    to: '/admin/manage-stadiums' },
  { label: 'Quản lý booking', desc: 'Xem và xử lý đơn đặt', icon: <ClipboardIcon />, color: 'from-emerald-600 to-teal-700',  to: '#' },
  { label: 'Người dùng',     desc: 'Quản lý tài khoản',     icon: <UsersIcon />,     color: 'from-purple-600 to-violet-700', to: '/admin/manage-users' },
  { label: 'Báo cáo',        desc: 'Thống kê doanh thu',    icon: <BarChartIcon />,  color: 'from-orange-600 to-amber-700',  to: '#' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminDashboardPage: React.FC = () => {
  const stats = useMemo<StatCard[]>(() => {
    const total = mockBookings.length;
    const completed = mockBookings.filter(b => b.status === 'completed').length;
    const totalRevenue = mockBookings.reduce((s, b) => s + b.revenue, 0);
    const avgRevenue = Math.round(totalRevenue / total);

    return [
      {
        label: 'Tổng booking',
        value: total,
        change: 12.5,
        subLabel: 'trong tháng này',
        icon: <CalendarIcon />,
        accentColor: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
      },
      {
        label: 'Hoàn thành',
        value: completed,
        change: 8.2,
        subLabel: `tỉ lệ ${Math.round((completed / total) * 100)}%`,
        icon: <CheckCircleIcon />,
        accentColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
      },
      {
        label: 'Tổng doanh thu',
        value: `${(totalRevenue / 1_000_000).toFixed(1)}M₫`,
        change: 15.3,
        subLabel: 'tháng 04/2026',
        icon: <CurrencyIcon />,
        accentColor: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
      },
      {
        label: 'Trung bình/booking',
        value: `${Math.round(avgRevenue / 1000)}K₫`,
        change: 5.1,
        subLabel: 'so với tuần trước',
        icon: <TrendingUpIcon />,
        accentColor: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
      },
    ];
  }, []);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  const yAxisLabels = [6, 4, 2, 0];

  return (
    <AdminLayout activeKey="dashboard">
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8 text-white">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                Bảng điều khiển
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Tổng quan hệ thống</h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Theo dõi hoạt động sân thể thao — Tháng 04/2026
              </p>
            </div>
            <div className="hidden sm:flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">Hệ thống hoạt động bình thường</span>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} ${stat.bgColor} p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.015] hover:shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{stat.subLabel}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${stat.bgColor} ${stat.accentColor} shrink-0`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-400">
                    <ArrowUpIcon />
                    {stat.change}%
                  </span>
                  <span className="text-[11px] text-slate-500">so với tuần trước</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold">Doanh thu hàng tuần</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Tổng doanh thu theo ngày (triệu đồng)</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-xs text-slate-400">Tuần này</span>
                </div>
              </div>

              <div className="flex gap-3 h-52">
                {/* Y-axis */}
                <div className="flex flex-col justify-between pb-7 text-right">
                  {yAxisLabels.map(v => (
                    <span key={v} className="text-[10px] text-slate-500 w-5">{v}M</span>
                  ))}
                </div>

                {/* Bars + X labels */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex-1 flex items-end gap-2 border-b border-white/[0.06]">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="group relative flex flex-col items-center flex-1">
                        {/* Tooltip */}
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                          {item.revenue}M₫
                        </span>
                        {/* Bar background track */}
                        <div className="relative w-full rounded-t-lg overflow-hidden bg-white/[0.04]" style={{ height: '140px' }}>
                          <div
                            className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-cyan-600 via-cyan-500 to-blue-400 transition-all duration-700 group-hover:from-cyan-500 group-hover:to-blue-300"
                            style={{ height: `${(item.revenue / maxRevenue) * 140}px` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* X-axis labels */}
                  <div className="flex gap-2">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="flex-1 text-center">
                        <span className="text-[11px] text-slate-400">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sport breakdown */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm flex flex-col">
              <h2 className="text-base font-bold">Phân loại sân</h2>
              <p className="mt-0.5 text-xs text-slate-400 mb-6">Tổng số sân theo môn thể thao</p>

              <div className="space-y-5 flex-1">
                {sportStats.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{item.sport}</span>
                      <span className="text-xs font-bold">{item.count} sân</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full ${item.bar} rounded-full transition-all duration-700`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-slate-500">{item.pct}%</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-400">Tổng số sân</p>
                  <span className="text-2xl font-black">27</span>
                </div>
                <Link
                  to="/admin/manage-stadiums"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <StadiumIcon />
                  Quản lý sân
                </Link>
              </div>
            </div>
          </div>

          {/* ── Bookings Table ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-bold">Booking gần đây</h2>
                <p className="mt-0.5 text-xs text-slate-400">5 booking mới nhất trong hệ thống</p>
              </div>
              <button className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                Xem tất cả →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Sân', 'Môn', 'Khách hàng', 'Thời gian', 'Doanh thu', 'Trạng thái'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                          i === 4 ? 'text-right' : i === 5 ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {mockBookings.map(booking => {
                    const statusCfg = STATUS_CONFIG[booking.status];
                    const sportClass = SPORT_BADGE[booking.sportType] ?? 'bg-slate-500/15 text-slate-300 border border-slate-500/25';
                    return (
                      <tr key={booking.id} className="hover:bg-white/[0.025] transition-colors duration-150">
                        <td className="px-5 py-4 font-semibold text-white">{booking.courtName}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${sportClass}`}>
                            {booking.sportType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{booking.customer}</td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-slate-300">{booking.date}</p>
                          <p className="text-[11px] text-slate-500">{booking.time}</p>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-400">
                          {booking.revenue.toLocaleString('vi-VN')}₫
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <p className="text-xs text-slate-500">Hiển thị 1–5 trong tổng số 128 booking</p>
              <div className="flex gap-1.5">
                <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors duration-200">
                  ← Trước
                </button>
                <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors duration-200">
                  Sau →
                </button>
              </div>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <Link
                key={idx}
                to={action.to}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-5 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30`}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                <div className="relative">
                  <div className="mb-3 w-fit rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
                    {action.icon}
                  </div>
                  <h3 className="font-bold text-sm leading-5">{action.label}</h3>
                  <p className="mt-0.5 text-xs text-white/70">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </main>
    </AdminLayout>
  );
};
