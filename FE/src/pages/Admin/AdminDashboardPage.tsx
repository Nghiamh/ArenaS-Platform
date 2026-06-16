import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetAllCourts,
  adminGetIncome,
  adminApproveCourt,
  adminRejectCourt,
  getCurrentUserProfile,
  adminGetReviewStats,
  type AdminCourt,
  type AdminIncomeSummary,
  type AdminIncomeEntry,
  type CourtReviewStat,
} from '../../Axios/Axios';

// ─── Icons ────────────────────────────────────────────────────────────────────

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const TrendUpIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const TrendDownIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);
const fmtM = (v: number) => `${(v / 1_000_000).toFixed(1)}M₫`;
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return iso; }
};

const SPORT_COLORS: Record<string, { bar: string; dot: string; text: string }> = {
  'Bóng Đá':  { bar: 'from-blue-500 to-blue-600',   dot: 'bg-blue-500',   text: 'text-blue-300' },
  'Cầu Lông': { bar: 'from-yellow-500 to-amber-500', dot: 'bg-yellow-500', text: 'text-yellow-300' },
  Pickleball: { bar: 'from-pink-500 to-rose-500',    dot: 'bg-pink-500',   text: 'text-pink-300' },
  Tennis:     { bar: 'from-orange-500 to-amber-600', dot: 'bg-orange-500', text: 'text-orange-300' },
};
const defaultColor = { bar: 'from-slate-500 to-slate-600', dot: 'bg-slate-500', text: 'text-slate-300' };

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className ?? ''}`} />
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminDashboardPage: React.FC = () => {
  const [courts,       setCourts]       = useState<AdminCourt[]>([]);
  const [totalCourts,  setTotalCourts]  = useState(0);
  const [incomeSummary, setIncomeSummary] = useState<AdminIncomeSummary | null>(null);
  const [incomeItems,  setIncomeItems]  = useState<AdminIncomeEntry[]>([]);
  const [reviewStats,  setReviewStats]  = useState<CourtReviewStat[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [adminName,    setAdminName]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [approving,    setApproving]    = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courtsRes, incomeRes, profileRes, reviewRes] = await Promise.all([
        adminGetAllCourts({ limit: 200 }),
        adminGetIncome({ limit: 5 }),
        getCurrentUserProfile().catch(() => null),
        adminGetReviewStats().catch(() => null),
      ]);
      setCourts(courtsRes.courts);
      setTotalCourts(courtsRes.total);
      setIncomeSummary(incomeRes.summary);
      setIncomeItems(incomeRes.items);
      if (reviewRes) {
        setReviewStats(reviewRes.stats);
        setTotalReviews(reviewRes.totalReviews);
      }
      if (profileRes) setAdminName(profileRes.user.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (court: AdminCourt) => {
    setApproving(court.id);
    try {
      const updated = await adminApproveCourt(court.id);
      setCourts(prev => prev.map(c => c.id === court.id ? { ...c, status: updated.status } : c));
      showToast(`Đã duyệt sân "${court.name}"`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Duyệt thất bại', false);
    } finally { setApproving(null); }
  };

  const handleReject = async (court: AdminCourt) => {
    setApproving(court.id);
    try {
      const updated = await adminRejectCourt(court.id);
      setCourts(prev => prev.map(c => c.id === court.id ? { ...c, status: updated.status } : c));
      showToast(`Đã từ chối sân "${court.name}"`, false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Từ chối thất bại', false);
    } finally { setApproving(null); }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const pendingCourts = useMemo(() => courts.filter(c => c.status === 'pending'), [courts]);
  const activeCourts  = useMemo(() => courts.filter(c => c.status === 'available' || c.status === 'open').length, [courts]);

  const courtTypeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    courts.forEach(court => court.sports.forEach(sport => { counts[sport] = (counts[sport] || 0) + 1; }));
    const total = Math.max(Object.values(counts).reduce((s, c) => s + c, 0), 1);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([sport, count]) => ({
        sport, count,
        pct: Math.round((count / total) * 100),
        colors: SPORT_COLORS[sport] ?? defaultColor,
      }));
  }, [courts]);

  const revenueTrend = useMemo(() => {
    if (!incomeSummary?.lastMonthRevenue) return null;
    return Math.round(((incomeSummary.thisMonthRevenue - incomeSummary.lastMonthRevenue) / incomeSummary.lastMonthRevenue) * 100);
  }, [incomeSummary]);

  const depositPct = useMemo(() => {
    if (!incomeSummary?.totalRevenue) return 50;
    return Math.round((incomeSummary.depositTotal / incomeSummary.totalRevenue) * 100);
  }, [incomeSummary]);

  // ── Stat cards ────────────────────────────────────────────────────────────

  const statCards = useMemo(() => [
    {
      label: 'Tổng số sân',
      value: loading ? null : totalCourts,
      sub: loading ? null : `${activeCourts} đang hoạt động`,
      icon: '🏟️',
      gradient: 'from-cyan-500/15 to-blue-600/10',
      border: 'border-cyan-500/20',
      valueColor: 'text-cyan-100',
    },
    {
      label: 'Sân chờ duyệt',
      value: loading ? null : pendingCourts.length,
      sub: pendingCourts.length > 0 ? 'cần xét duyệt ngay' : 'không có sân chờ',
      icon: pendingCourts.length > 0 ? '⏳' : '✅',
      gradient: pendingCourts.length > 0 ? 'from-amber-500/15 to-orange-600/10' : 'from-emerald-500/10 to-teal-600/5',
      border: pendingCourts.length > 0 ? 'border-amber-500/25' : 'border-emerald-500/20',
      valueColor: pendingCourts.length > 0 ? 'text-amber-100' : 'text-emerald-100',
    },
    {
      label: 'Tổng doanh thu',
      value: loading ? null : incomeSummary ? fmtM(incomeSummary.totalRevenue) : '—',
      sub: incomeSummary ? `${(incomeSummary.depositCount + incomeSummary.subscriptionCount).toLocaleString()} giao dịch` : '—',
      icon: '💰',
      gradient: 'from-emerald-500/15 to-green-600/10',
      border: 'border-emerald-500/20',
      valueColor: 'text-emerald-100',
    },
    {
      label: 'Doanh thu tháng này',
      value: loading ? null : incomeSummary ? fmtM(incomeSummary.thisMonthRevenue) : '—',
      sub: revenueTrend !== null ? `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}% so tháng trước` : 'Đang tính...',
      trend: revenueTrend,
      icon: '📈',
      gradient: 'from-violet-500/15 to-purple-600/10',
      border: 'border-violet-500/20',
      valueColor: 'text-violet-100',
    },
    {
      label: 'Tổng đánh giá',
      value: loading ? null : totalReviews,
      sub: loading ? null : reviewStats.length > 0
        ? `trung bình ${(reviewStats.reduce((s, r) => s + r.avgRating, 0) / reviewStats.length).toFixed(1)}★ toàn hệ thống`
        : 'chưa có đánh giá',
      icon: '⭐',
      gradient: 'from-yellow-500/15 to-amber-600/10',
      border: 'border-yellow-500/20',
      valueColor: 'text-yellow-100',
    },
  ], [loading, totalCourts, activeCourts, pendingCourts.length, incomeSummary, revenueTrend, totalReviews, reviewStats]);

  return (
    <AdminLayout activeKey="dashboard">
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1E] to-[#080C17] px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-7">

          {/* ── Page Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">Bảng điều khiển</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                {adminName ? `Xin chào, ${adminName}` : 'Tổng quan hệ thống'}
              </h1>
              <p className="mt-1 text-sm text-slate-400">Quản lý toàn bộ hoạt động ArenaS</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300">Hệ thống online</span>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
                Làm mới
              </button>
            </div>
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertIcon />
              <span className="flex-1">{error}</span>
              <button onClick={fetchData} className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold hover:bg-rose-500/30 transition">
                Thử lại
              </button>
            </div>
          )}

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-black/20`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                    <div className="mt-2 min-h-[2rem]">
                      {loading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <p className={`text-2xl font-black tracking-tight ${card.valueColor}`}>{card.value}</p>
                      )}
                    </div>
                    {!loading && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                        {'trend' in card && card.trend !== null && card.trend !== undefined && (
                          <span className={card.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {card.trend >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                          </span>
                        )}
                        {card.sub}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl shrink-0">{card.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Middle Row: Revenue + Court Types ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Revenue Panel — 3/5 */}
            <div className="lg:col-span-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-black text-base">Tổng quan doanh thu</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Phân loại & so sánh theo tháng</p>
                </div>
                <Link to="/admin/income" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
                  Chi tiết →
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : incomeSummary ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Nạp tiền ví</p>
                      <p className="mt-1.5 text-xl font-black text-cyan-100">{fmtM(incomeSummary.depositTotal)}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{incomeSummary.depositCount} giao dịch</p>
                    </div>
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Mua gói</p>
                      <p className="mt-1.5 text-xl font-black text-violet-100">{fmtM(incomeSummary.subscriptionTotal)}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{incomeSummary.subscriptionCount} gói</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Tháng này</p>
                        {revenueTrend !== null && (
                          <span className={`flex items-center gap-0.5 text-[10px] font-bold ${revenueTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {revenueTrend >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                            {Math.abs(revenueTrend)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xl font-black text-emerald-100">{fmtM(incomeSummary.thisMonthRevenue)}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tháng trước</p>
                      <p className="mt-1.5 text-xl font-black text-slate-300">{fmtM(incomeSummary.lastMonthRevenue)}</p>
                    </div>
                  </div>

                  {/* Revenue split bar */}
                  <div>
                    <div className="flex justify-between mb-1.5 text-[11px] text-slate-500">
                      <span>Nạp tiền {depositPct}%</span>
                      <span>Mua gói {100 - depositPct}%</span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-700" style={{ width: `${depositPct}%` }} />
                      <div className="flex-1 bg-gradient-to-r from-violet-600 to-violet-500" />
                    </div>
                    <div className="mt-2 flex gap-4">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="h-2 w-2 rounded-sm bg-cyan-500" />Nạp ví
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="h-2 w-2 rounded-sm bg-violet-500" />Mua gói
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">Không có dữ liệu doanh thu</p>
              )}
            </div>

            {/* Court Types — 2/5 */}
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-black text-base">Phân loại sân</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Theo môn thể thao</p>
                </div>
                <Link to="/admin/manage-stadiums" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
                  Quản lý →
                </Link>
              </div>

              <div className="flex-1 space-y-4">
                {loading ? (
                  [1,2,3].map(i => <Skeleton key={i} className="h-10" />)
                ) : courtTypeStats.length > 0 ? (
                  courtTypeStats.map(({ sport, count, pct, colors }) => (
                    <div key={sport}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                          <span className="text-sm font-semibold">{sport}</span>
                        </div>
                        <span className={`text-xs font-bold ${colors.text}`}>{count} sân</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-right text-[10px] text-slate-600">{pct}%</p>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-slate-500">Chưa có sân nào</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Tổng cộng</span>
                  <span className="text-lg font-black">{loading ? '...' : totalCourts} sân</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Pending Courts ── */}
          {!loading && pendingCourts.length > 0 && (
            <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/15">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                    <AlertIcon />
                  </span>
                  <div>
                    <h2 className="font-black text-amber-100">Sân chờ phê duyệt</h2>
                    <p className="text-xs text-slate-500">{pendingCourts.length} sân đang chờ xét duyệt</p>
                  </div>
                </div>
                <Link to="/admin/manage-stadiums" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
                  Xem tất cả →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-amber-500/10 text-left">
                      {['Tên sân', 'Môn thể thao', 'Địa chỉ', 'Giá/giờ', 'Thao tác'].map((h, i) => (
                        <th key={h} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-amber-500/60 ${i >= 3 ? 'text-right' : ''} ${i === 4 ? 'text-center' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCourts.slice(0, 5).map(court => (
                      <tr key={court.id} className={`border-b border-amber-500/[0.08] hover:bg-amber-500/[0.04] transition-colors ${approving === court.id ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-white">{court.name}</p>
                          <p className="text-[10px] font-mono text-slate-600 mt-0.5">{court.id.slice(-8)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {court.sports.map(s => (
                              <span key={s} className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-400/20">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs max-w-[180px] truncate">{court.location}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-300">{fmt(court.price_per_hour)}₫</td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={approving === court.id}
                              onClick={() => handleApprove(court)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed"
                            >
                              <CheckIcon />{approving === court.id ? '...' : 'Duyệt'}
                            </button>
                            <button
                              disabled={approving === court.id}
                              onClick={() => handleReject(court)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30 disabled:cursor-not-allowed"
                            >
                              <XIcon />{approving === court.id ? '...' : 'Từ chối'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Recent Transactions ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="font-black text-base">Giao dịch gần đây</h2>
                <p className="mt-0.5 text-xs text-slate-400">5 giao dịch thu nhập mới nhất</p>
              </div>
              <Link to="/admin/income" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
                Xem tất cả →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['Loại', 'Người dùng', 'Mô tả', 'Ngày', 'Số tiền'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${i === 4 ? 'text-right' : 'text-left'} ${i === 2 ? 'hidden md:table-cell' : ''} ${i === 3 ? 'hidden sm:table-cell' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i}><td colSpan={5} className="px-5 py-3"><Skeleton className="h-8" /></td></tr>
                    ))
                  ) : incomeItems.length > 0 ? (
                    incomeItems.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          {item.type === 'deposit' ? (
                            <span className="inline-flex rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/20">
                              Nạp ví
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-400/20">
                              Mua gói
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{item.userName}</p>
                          <p className="text-[11px] text-slate-500">{item.userEmail}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell max-w-[200px] truncate">{item.description}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap">{fmtDate(item.createdAt)}</td>
                        <td className="px-5 py-4 text-right font-black text-emerald-300">+{fmt(item.amount)}₫</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-500">Chưa có giao dịch nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Review Stats by Court ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="font-black text-base">Đánh giá theo sân</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Tổng {loading ? '…' : totalReviews} đánh giá · {loading ? '…' : reviewStats.length} sân có đánh giá
                </p>
              </div>
              <Link to="/admin/moderation" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
                Chi tiết →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['#', 'Tên sân', 'Số đánh giá', 'Trung bình'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${i >= 2 ? 'text-right' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i}><td colSpan={4} className="px-5 py-3"><Skeleton className="h-7" /></td></tr>
                    ))
                  ) : reviewStats.length > 0 ? (
                    reviewStats.slice(0, 10).map((stat, idx) => {
                      const stars = Math.round(stat.avgRating);
                      return (
                        <tr key={stat.court_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 text-slate-600 text-xs w-8">{idx + 1}</td>
                          <td className="px-5 py-3.5 font-semibold text-white">{stat.courtName}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-bold text-yellow-300 ring-1 ring-yellow-400/20">
                              {stat.totalReviews} đánh giá
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1.5 text-sm font-black text-amber-300">
                              <span>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                              <span className="text-white/70 text-xs font-semibold">{stat.avgRating.toFixed(1)}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-500">Chưa có đánh giá nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {!loading && reviewStats.length > 10 && (
              <div className="px-6 py-3 border-t border-white/[0.06] text-right">
                <Link to="/admin/moderation" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
                  Xem thêm {reviewStats.length - 10} sân →
                </Link>
              </div>
            )}
          </section>

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Quản lý sân',   sub: 'Duyệt & cập nhật',    icon: '🏟️', grad: 'from-cyan-600 to-blue-700',    to: '/admin/manage-stadiums' },
              { label: 'Thu nhập',      sub: 'Xem giao dịch',        icon: '💳', grad: 'from-emerald-600 to-teal-700', to: '/admin/income' },
              { label: 'Người dùng',   sub: 'Quản lý tài khoản',     icon: '👥', grad: 'from-violet-600 to-purple-700',to: '/admin/manage-users' },
              { label: 'Kiểm duyệt',   sub: 'Xử lý vi phạm',        icon: '🛡️', grad: 'from-orange-600 to-amber-700', to: '/admin/moderation' },
            ].map((a, i) => (
              <Link
                key={i}
                to={a.to}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.grad} p-5 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30`}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="relative">
                  <div className="mb-3 w-fit rounded-xl bg-white/15 p-2.5 backdrop-blur-sm text-2xl">{a.icon}</div>
                  <h3 className="font-black text-sm">{a.label}</h3>
                  <p className="mt-0.5 text-xs text-white/65">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-sm transition-all ${
          toast.ok
            ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
            : 'border-rose-400/30 bg-rose-500/20 text-rose-200'
        }`}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
};
