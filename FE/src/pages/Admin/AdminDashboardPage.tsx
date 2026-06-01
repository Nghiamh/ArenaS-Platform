import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetAllCourts,
  adminGetIncome,
  adminApproveCourt,
  adminRejectCourt,
  getCurrentUserProfile,
  AdminCourt,
  AdminIncomeSummary,
  AdminIncomeEntry,
} from '../../Axios/Axios';

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
  change: number | null;
  subLabel: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const SPORT_BADGE: Record<string, string> = {
  'Bóng Đá':   'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  'Cầu Lông':  'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25',
  Pickleball:  'bg-pink-500/15 text-pink-300 border border-pink-500/25',
  Tennis:      'bg-orange-500/15 text-orange-300 border border-orange-500/25',
};

const SPORT_BAR: Record<string, string> = {
  'Bóng Đá':  'bg-blue-500',
  'Cầu Lông': 'bg-yellow-500',
  Pickleball: 'bg-pink-500',
  Tennis:     'bg-orange-500',
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

const quickActions = [
  { label: 'Quản lý sân',    desc: 'Duyệt và cập nhật sân',  icon: <StadiumIcon />,   color: 'from-cyan-600 to-blue-700',    to: '/admin/manage-stadiums' },
  { label: 'Thu nhập',       desc: 'Xem giao dịch hệ thống', icon: <ClipboardIcon />, color: 'from-emerald-600 to-teal-700',  to: '/admin/income' },
  { label: 'Người dùng',     desc: 'Quản lý tài khoản',     icon: <UsersIcon />,     color: 'from-purple-600 to-violet-700', to: '/admin/manage-users' },
  { label: 'Báo cáo',        desc: 'Thống kê doanh thu',    icon: <BarChartIcon />,  color: 'from-orange-600 to-amber-700',  to: '#' },
];

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function incomeTypeBadge(type: string) {
  return type === 'deposit'
    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
    : 'bg-purple-500/15 text-purple-300 border border-purple-500/25';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminDashboardPage: React.FC = () => {
  const [courts, setCourts] = useState<AdminCourt[]>([]);
  const [totalCourts, setTotalCourts] = useState(0);
  const [incomeSummary, setIncomeSummary] = useState<AdminIncomeSummary | null>(null);
  const [incomeItems, setIncomeItems] = useState<AdminIncomeEntry[]>([]);
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courtsRes, incomeRes, profileRes] = await Promise.all([
        adminGetAllCourts({ limit: 200 }),
        adminGetIncome({ limit: 5 }),
        getCurrentUserProfile().catch(() => null),
      ]);
      setCourts(courtsRes.courts);
      setTotalCourts(courtsRes.total);
      setIncomeSummary(incomeRes.summary);
      setIncomeItems(incomeRes.items);
      if (profileRes) setAdminName(profileRes.user.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (courtId: string) => {
    setApproving(courtId);
    try {
      await adminApproveCourt(courtId);
      setCourts(prev => prev.map(c => c.id === courtId ? { ...c, status: 'available' } : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi phê duyệt sân');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (courtId: string) => {
    setApproving(courtId);
    try {
      await adminRejectCourt(courtId);
      setCourts(prev => prev.map(c => c.id === courtId ? { ...c, status: 'closed' } : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi từ chối sân');
    } finally {
      setApproving(null);
    }
  };

  const pendingCourts = useMemo(() => courts.filter(c => c.status === 'pending'), [courts]);

  const courtTypeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    courts.forEach(court => court.sports.forEach(sport => { counts[sport] = (counts[sport] || 0) + 1; }));
    const total = Math.max(Object.values(counts).reduce((s, c) => s + c, 0), 1);
    return Object.entries(counts).map(([sport, count]) => ({
      sport, count,
      bar: SPORT_BAR[sport] ?? 'bg-slate-500',
      pct: Math.round((count / total) * 100),
    }));
  }, [courts]);

  const revenueTrend = useMemo(() => {
    if (!incomeSummary?.lastMonthRevenue) return null;
    return Math.round(((incomeSummary.thisMonthRevenue - incomeSummary.lastMonthRevenue) / incomeSummary.lastMonthRevenue) * 100);
  }, [incomeSummary]);

  const stats = useMemo<StatCard[]>(() => [
    {
      label: 'Tổng số sân',
      value: loading ? '...' : totalCourts,
      change: null,
      subLabel: 'trong toàn hệ thống',
      icon: <CalendarIcon />,
      accentColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      label: 'Sân chờ duyệt',
      value: loading ? '...' : pendingCourts.length,
      change: null,
      subLabel: pendingCourts.length > 0 ? 'cần xem xét ngay' : 'không có sân chờ',
      icon: <CheckCircleIcon />,
      accentColor: pendingCourts.length > 0 ? 'text-amber-400' : 'text-emerald-400',
      bgColor: pendingCourts.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
      borderColor: pendingCourts.length > 0 ? 'border-amber-500/20' : 'border-emerald-500/20',
    },
    {
      label: 'Tổng doanh thu',
      value: loading ? '...' : incomeSummary ? `${(incomeSummary.totalRevenue / 1_000_000).toFixed(1)}M₫` : '—',
      change: revenueTrend,
      subLabel: incomeSummary ? `${incomeSummary.depositCount + incomeSummary.subscriptionCount} giao dịch` : '—',
      icon: <CurrencyIcon />,
      accentColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Doanh thu tháng này',
      value: loading ? '...' : incomeSummary ? `${(incomeSummary.thisMonthRevenue / 1_000_000).toFixed(1)}M₫` : '—',
      change: revenueTrend,
      subLabel: incomeSummary ? `tháng trước: ${(incomeSummary.lastMonthRevenue / 1_000_000).toFixed(1)}M₫` : '—',
      icon: <TrendingUpIcon />,
      accentColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
  ], [loading, totalCourts, pendingCourts.length, incomeSummary, revenueTrend]);

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
                {adminName ? `Xin chào, ${adminName}! ` : ''}Theo dõi hoạt động sân thể thao
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors disabled:opacity-50"
              >
                {loading ? '⟳ Đang tải...' : '⟳ Làm mới'}
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">Hệ thống hoạt động bình thường</span>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
              {error}
            </div>
          )}

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
                    {loading ? (
                      <div className="mt-2 h-7 w-20 animate-pulse rounded-lg bg-white/[0.08]" />
                    ) : (
                      <p className="mt-2 text-2xl font-black tracking-tight">{stat.value}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-500">{stat.subLabel}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${stat.bgColor} ${stat.accentColor} shrink-0`}>
                    {stat.icon}
                  </div>
                </div>
                {stat.change !== null && !loading && (
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      <ArrowUpIcon />
                      {Math.abs(stat.change)}%
                    </span>
                    <span className="text-[11px] text-slate-500">so với tháng trước</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue breakdown from API */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold">Tổng quan doanh thu</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Phân loại theo hình thức giao dịch</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-xs text-slate-400">Toàn thời gian</span>
                </div>
              </div>

              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : incomeSummary ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                    <p className="text-xs text-slate-400 mb-1">Nạp Tiền (Deposit)</p>
                    <p className="text-2xl font-black text-blue-300">{(incomeSummary.depositTotal / 1_000_000).toFixed(1)}M₫</p>
                    <p className="text-[11px] text-slate-500 mt-1">{incomeSummary.depositCount} giao dịch</p>
                  </div>
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
                    <p className="text-xs text-slate-400 mb-1">Đăng Ký Gói (Subscription)</p>
                    <p className="text-2xl font-black text-purple-300">{(incomeSummary.subscriptionTotal / 1_000_000).toFixed(1)}M₫</p>
                    <p className="text-[11px] text-slate-500 mt-1">{incomeSummary.subscriptionCount} giao dịch</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs text-slate-400 mb-1">Tháng Này</p>
                    <p className="text-2xl font-black text-emerald-300">{(incomeSummary.thisMonthRevenue / 1_000_000).toFixed(1)}M₫</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-400 mb-1">Tháng Trước</p>
                    <p className="text-2xl font-black text-slate-300">{(incomeSummary.lastMonthRevenue / 1_000_000).toFixed(1)}M₫</p>
                    {revenueTrend !== null && (
                      <p className={`text-[11px] mt-1 font-bold ${revenueTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {revenueTrend >= 0 ? '↑' : '↓'} {Math.abs(revenueTrend)}%
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Fallback chart when no income data */
                <div className="flex gap-3 h-52">
                  <div className="flex flex-col justify-between pb-7 text-right">
                    {yAxisLabels.map(v => (
                      <span key={v} className="text-[10px] text-slate-500 w-5">{v}M</span>
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex-1 flex items-end gap-2 border-b border-white/[0.06]">
                      {chartData.map((item, i) => (
                        <div key={i} className="group relative flex flex-col items-center flex-1">
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                            {item.revenue}M₫
                          </span>
                          <div className="relative w-full rounded-t-lg overflow-hidden bg-white/[0.04]" style={{ height: '140px' }}>
                            <div
                              className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-cyan-600 via-cyan-500 to-blue-400 transition-all duration-700"
                              style={{ height: `${(item.revenue / maxRevenue) * 140}px` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {chartData.map((item, i) => (
                        <div key={i} className="flex-1 text-center">
                          <span className="text-[11px] text-slate-400">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sport breakdown — real data from API */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm flex flex-col">
              <h2 className="text-base font-bold">Phân loại sân</h2>
              <p className="mt-0.5 text-xs text-slate-400 mb-6">Tổng số sân theo môn thể thao</p>

              <div className="space-y-5 flex-1">
                {loading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.06]" />)
                ) : courtTypeStats.length > 0 ? (
                  courtTypeStats.map((item, idx) => (
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
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Chưa có sân nào trong hệ thống</p>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-400">Tổng số sân</p>
                  <span className="text-2xl font-black">{loading ? '...' : totalCourts}</span>
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

          {/* ── Pending Courts ── */}
          {!loading && pendingCourts.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-amber-500/20">
                <div>
                  <h2 className="text-base font-bold text-amber-300">Sân chờ phê duyệt</h2>
                  <p className="mt-0.5 text-xs text-slate-400">{pendingCourts.length} sân đang chờ xét duyệt</p>
                </div>
                <Link to="/admin/manage-stadiums" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  Xem tất cả →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Tên sân', 'Môn thể thao', 'Địa chỉ', 'Giá/giờ', 'Thao tác'].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                            i === 3 ? 'text-right' : i === 4 ? 'text-center' : 'text-left'
                          } ${i === 2 ? 'hidden md:table-cell' : ''}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {pendingCourts.slice(0, 5).map(court => (
                      <tr key={court.id} className="hover:bg-white/[0.025] transition-colors duration-150">
                        <td className="px-5 py-4 font-semibold text-white">{court.name}</td>
                        <td className="px-5 py-4">
                          {court.sports.map(sport => (
                            <span key={sport} className={`mr-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${SPORT_BADGE[sport] ?? 'bg-slate-500/15 text-slate-300 border border-slate-500/25'}`}>
                              {sport}
                            </span>
                          ))}
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell max-w-[180px] truncate">{court.location}</td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-400">{court.price_per_hour.toLocaleString('vi-VN')}₫</td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(court.id)}
                              disabled={approving === court.id}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                            >
                              {approving === court.id ? '...' : 'Duyệt'}
                            </button>
                            <button
                              onClick={() => handleReject(court.id)}
                              disabled={approving === court.id}
                              className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                            >
                              {approving === court.id ? '...' : 'Từ chối'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Recent Income Transactions ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-bold">Giao dịch gần đây</h2>
                <p className="mt-0.5 text-xs text-slate-400">5 giao dịch thu nhập mới nhất trong hệ thống</p>
              </div>
              <Link to="/admin/income" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                Xem tất cả →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Loại', 'Người dùng', 'Mô tả', 'Ngày', 'Số tiền'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                          i === 4 ? 'text-right' : 'text-left'
                        } ${i === 2 ? 'hidden md:table-cell' : ''} ${i === 3 ? 'hidden sm:table-cell' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td colSpan={5} className="px-5 py-4">
                          <div className="h-8 animate-pulse rounded-lg bg-white/[0.06]" />
                        </td>
                      </tr>
                    ))
                  ) : incomeItems.length > 0 ? (
                    incomeItems.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.025] transition-colors duration-150">
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${incomeTypeBadge(item.type)}`}>
                            {item.type === 'deposit' ? 'Nạp tiền' : 'Đăng ký'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{item.userName}</p>
                          <p className="text-[11px] text-slate-500">{item.userEmail}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell max-w-[200px] truncate">{item.description}</td>
                        <td className="px-5 py-4 text-xs text-slate-400 hidden sm:table-cell">{formatDate(item.createdAt)}</td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-400">
                          {item.amount.toLocaleString('vi-VN')}₫
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                        Chưa có giao dịch nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
