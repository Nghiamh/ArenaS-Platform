import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetAllCourts,
  adminApproveCourt,
  adminRejectCourt,
  adminUpdateCourtStatus,
  type AdminCourt,
  type OwnerCourtStatus,
} from '../../Axios/Axios';

// ─── Config maps ──────────────────────────────────────────────────────────────

const statusLabel: Record<OwnerCourtStatus, string> = {
  available: 'Đang hoạt động',
  open:      'Đang mở',
  closed:    'Đã đóng',
  pending:   'Chờ duyệt',
};

const statusClass: Record<OwnerCourtStatus, string> = {
  available: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
  open:      'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/35',
  closed:    'bg-slate-500/20 text-slate-300 ring-1 ring-slate-400/25',
  pending:   'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/35',
};

const sportTypeLabel: Record<string, string> = {
  football_5: 'Bóng đá 5',
  football_7: 'Bóng đá 7',
  badminton:  'Cầu lông',
  tennis:     'Tennis',
  pickleball: 'Pickleball',
  other:      'Khác',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const TableSkeleton: React.FC = () => (
  <tbody>
    {Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} className="border-b border-slate-700/30">
        {Array.from({ length: 8 }).map((__, j) => (
          <td key={j} className="px-3 py-4">
            <div className="h-4 animate-pulse rounded-md bg-slate-700/50" style={{ width: `${60 + (j * 13) % 35}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ─── Icons ────────────────────────────────────────────────────────────────────

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="m1 1 22 22" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminManageStadiumPage: React.FC = () => {
  const [courts,       setCourts]       = useState<AdminCourt[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [keyword,      setKeyword]      = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OwnerCourtStatus>('all');
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; type: 'ok' | 'err' }>({ msg: '', type: 'ok' });

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 2800);
  };

  /* ── Fetch from real admin API ── */
  const fetchCourts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(keyword.trim() && { keyword: keyword.trim() }),
        limit: 100,
      };
      const result = await adminGetAllCourts(params);
      setCourts(result.courts);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu sân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourts(); }, []);

  /* ── Approve / Reject handlers ── */
  const handleApprove = async (court: AdminCourt) => {
    setUpdatingId(court.id);
    try {
      const updated = await adminApproveCourt(court.id);
      setCourts((prev) => prev.map((c) => c.id === court.id ? { ...c, status: updated.status } : c));
      showToast(`Đã duyệt sân "${court.name}".`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Duyệt sân thất bại.', 'err');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (court: AdminCourt) => {
    setUpdatingId(court.id);
    try {
      const updated = await adminRejectCourt(court.id);
      setCourts((prev) => prev.map((c) => c.id === court.id ? { ...c, status: updated.status } : c));
      showToast(`Đã từ chối sân "${court.name}".`, 'err');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Từ chối thất bại.', 'err');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Stats (reactive) ── */
  const stats = useMemo(() => ({
    total:     total,
    available: courts.filter((c) => c.status === 'available' || c.status === 'open').length,
    closed:    courts.filter((c) => c.status === 'closed').length,
    pending:   courts.filter((c) => c.status === 'pending').length,
  }), [courts, total]);

  /* ── Client-side filter (for instant search UX before re-fetching) ── */
  const displayed = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return courts.filter((c) => {
      const byStatus  = statusFilter === 'all' || c.status === statusFilter;
      const byKeyword = !q ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.sports.some((s) => s.toLowerCase().includes(q));
      return byStatus && byKeyword;
    });
  }, [courts, keyword, statusFilter]);

  /* ── Toggle visibility — gọi real API ── */
  const handleToggleStatus = async (court: AdminCourt) => {
    const next: 'available' | 'closed' = court.status === 'closed' ? 'available' : 'closed';
    setUpdatingId(court.id);
    try {
      const updated = await adminUpdateCourtStatus(court.id, next);
      setCourts((prev) => prev.map((c) => c.id === court.id ? { ...c, status: updated.status } : c));
      showToast(next === 'closed' ? `Đã ẩn sân "${court.name}".` : `Đã hiện sân "${court.name}".`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cập nhật thất bại.', 'err');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout activeKey="stadiums">
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <header className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin / Sân</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quản lý & duyệt sân</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Danh sách toàn bộ sân — mọi chủ sân, mọi trạng thái. Nguồn: <code className="rounded bg-black/30 px-1 text-xs">GET /api/admin/courts</code>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link to="/admin/dashboard"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                  Về Dashboard
                </Link>
                <button
                  onClick={fetchCourts}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
                  Tải lại
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Tổng sân',           value: loading ? '—' : stats.total,     border: 'border-slate-600/40',   bg: 'bg-slate-800/50',   text: 'text-slate-100',   sub: 'text-slate-400'   },
                { label: 'Đang hoạt động',      value: loading ? '—' : stats.available, border: 'border-emerald-400/20', bg: 'bg-emerald-500/10', text: 'text-emerald-100', sub: 'text-emerald-300' },
                { label: 'Đã đóng / Bị ẩn',    value: loading ? '—' : stats.closed,    border: 'border-rose-400/20',   bg: 'bg-rose-500/10',    text: 'text-rose-100',    sub: 'text-rose-300'    },
                { label: 'Chờ duyệt',           value: loading ? '—' : stats.pending,   border: 'border-amber-400/30',  bg: 'bg-amber-500/10',   text: 'text-amber-100',   sub: 'text-amber-300'   },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${s.sub}`}>{s.label}</p>
                  <p className={`mt-2 text-3xl font-black ${s.text}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </header>

          {/* ── Error banner ── */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertIcon />
              <span className="flex-1">{error}</span>
              <button onClick={fetchCourts}
                className="shrink-0 rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold hover:bg-rose-500/30 transition">
                Thử lại
              </button>
            </div>
          )}

          {/* ── Pending approval queue ── */}
          {!loading && stats.pending > 0 && (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                  <AlertIcon />
                </span>
                <h2 className="text-lg font-black tracking-tight text-amber-100">
                  Hàng chờ duyệt
                </h2>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                  {stats.pending}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-amber-400/20 text-left text-xs font-semibold uppercase tracking-wider text-amber-400/70">
                      <th className="px-3 py-2">Sân</th>
                      <th className="px-3 py-2">Chủ sân (ID)</th>
                      <th className="px-3 py-2">Môn</th>
                      <th className="px-3 py-2">Địa điểm</th>
                      <th className="px-3 py-2 text-right">Giá / giờ</th>
                      <th className="px-3 py-2 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courts.filter((c) => c.status === 'pending').map((court) => {
                      const isUpdating = updatingId === court.id;
                      return (
                        <tr key={court.id}
                          className={`border-b border-amber-400/10 transition-colors hover:bg-amber-500/5 ${isUpdating ? 'opacity-60' : ''}`}>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-white">{court.name}</p>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{court.id.slice(-8)}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-xs text-slate-400 bg-white/5 rounded-md px-1.5 py-0.5">
                              {court.owner_id.slice(-8)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {court.sports.map((s) => (
                                <span key={s} className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-400/25">
                                  {sportTypeLabel[s] ?? s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-300 max-w-[160px] truncate" title={court.location}>
                            {court.location}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-emerald-300">
                            {fmtCurrency(court.price_per_hour)}₫
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                disabled={isUpdating}
                                onClick={() => handleApprove(court)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckIcon />
                                {isUpdating ? '...' : 'Duyệt'}
                              </button>
                              <button
                                disabled={isUpdating}
                                onClick={() => handleReject(court)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XIcon />
                                {isUpdating ? '...' : 'Từ chối'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Court table ── */}
          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Danh sách sân</h2>
                {!loading && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                    {displayed.length}{total > displayed.length ? ` / ${total}` : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchCourts()}
                    placeholder="Tên sân, địa điểm, môn thể thao..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500/50 sm:w-72"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | OwnerCourtStatus)}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="available">Đang hoạt động</option>
                  <option value="open">Đang mở</option>
                  <option value="closed">Đã đóng</option>
                </select>
                <button onClick={fetchCourts}
                  className="rounded-xl bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/25">
                  Tìm
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3">Sân</th>
                    <th className="px-3 py-3">Chủ sân (ID)</th>
                    <th className="px-3 py-3">Môn</th>
                    <th className="px-3 py-3">Địa điểm</th>
                    <th className="px-3 py-3 text-center">Sân con</th>
                    <th className="px-3 py-3 text-right">Giá / giờ</th>
                    <th className="px-3 py-3 text-center">Đánh giá</th>
                    <th className="px-3 py-3 text-center">Trạng thái</th>
                    <th className="px-3 py-3 text-center">Hành động</th>
                  </tr>
                </thead>

                {loading ? (
                  <TableSkeleton />
                ) : (
                  <tbody>
                    {displayed.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-16 text-center text-slate-500">
                          Không tìm thấy sân phù hợp.
                        </td>
                      </tr>
                    ) : (
                      displayed.map((court) => {
                        const isUpdating = updatingId === court.id;
                        return (
                          <tr key={court.id}
                            className={`border-b border-slate-700/30 transition-colors hover:bg-slate-800/40 ${isUpdating ? 'opacity-60' : ''}`}>

                            {/* Name + ID */}
                            <td className="px-3 py-4">
                              <p className="font-semibold text-white">{court.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{court.id.slice(-8)}</p>
                            </td>

                            {/* Owner ID */}
                            <td className="px-3 py-4">
                              <span className="font-mono text-xs text-slate-400 bg-white/5 rounded-md px-1.5 py-0.5">
                                {court.owner_id.slice(-8)}
                              </span>
                            </td>

                            {/* Sports */}
                            <td className="px-3 py-4">
                              <div className="flex flex-wrap gap-1">
                                {court.sports.map((s) => (
                                  <span key={s} className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-400/25">
                                    {sportTypeLabel[s] ?? s}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Location */}
                            <td className="px-3 py-4 text-slate-300 max-w-[160px] truncate" title={court.location}>
                              {court.location}
                            </td>

                            {/* Sub-courts */}
                            <td className="px-3 py-4 text-center font-semibold text-slate-200">
                              {court.number_of_courts}
                            </td>

                            {/* Price */}
                            <td className="px-3 py-4 text-right font-semibold text-emerald-300">
                              {fmtCurrency(court.price_per_hour)}₫
                            </td>

                            {/* Rating */}
                            <td className="px-3 py-4 text-center">
                              <span className="inline-flex items-center gap-1 text-amber-300">
                                ★ <span className="font-semibold">{court.avg_rating.toFixed(1)}</span>
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-4 text-center">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[court.status]}`}>
                                {statusLabel[court.status]}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-4 text-center">
                              {court.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleApprove(court)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <CheckIcon />
                                    {isUpdating ? '...' : 'Duyệt'}
                                  </button>
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleReject(court)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <XIcon />
                                    {isUpdating ? '...' : 'Từ chối'}
                                  </button>
                                </div>
                              ) : court.status === 'closed' ? (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => handleToggleStatus(court)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <EyeIcon />
                                  {isUpdating ? 'Đang lưu...' : 'Hiện'}
                                </button>
                              ) : (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => handleToggleStatus(court)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <EyeOffIcon />
                                  {isUpdating ? 'Đang lưu...' : 'Ẩn'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                )}
              </table>
            </div>

            {!loading && displayed.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <p className="text-xs text-slate-500">
                  Hiển thị {displayed.length} / {total} sân · <code className="text-slate-600">PUT /api/admin/courts/:id/status</code>
                </p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-sm transition ${
          toast.type === 'ok'
            ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
            : 'border-rose-400/30 bg-rose-500/20 text-rose-200'
        }`}>
          {toast.type === 'ok' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
};
