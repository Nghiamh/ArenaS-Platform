import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetAllCourts,
  adminUpdateCourtStatus,
  type AdminCourt,
  type OwnerCourtStatus,
} from '../../Axios/Axios';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OwnerCourtStatus, string> = {
  available: 'Hoạt động',
  open:      'Đang mở',
  closed:    'Đã đóng',
  pending:   'Chờ duyệt',
};
const STATUS_CLS: Record<OwnerCourtStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30',
  open:      'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30',
  closed:    'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20',
  pending:   'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30',
};

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);

// ─── Icons ────────────────────────────────────────────────────────────────────

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="m1 1 22 22" />
  </svg>
);
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TableSkeleton = () => (
  <tbody>
    {Array.from({ length: 7 }).map((_, i) => (
      <tr key={i} className="border-b border-white/[0.04]">
        {Array.from({ length: 9 }).map((__, j) => (
          <td key={j} className="px-4 py-4">
            <div className="h-4 animate-pulse rounded-md bg-white/[0.06]" style={{ width: `${55 + (j * 11) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
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
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchCourts = useCallback(async () => {
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
  }, [statusFilter, keyword]);

  useEffect(() => { fetchCourts(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleStatus = async (court: AdminCourt) => {
    const next: 'available' | 'closed' = court.status === 'closed' ? 'available' : 'closed';
    setUpdatingId(court.id);
    try {
      const updated = await adminUpdateCourtStatus(court.id, next);
      setCourts(prev => prev.map(c => c.id === court.id ? { ...c, status: updated.status } : c));
      showToast(next === 'closed' ? `Đã ẩn sân "${court.name}"` : `Đã hiện sân "${court.name}"`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cập nhật thất bại.', false);
    } finally { setUpdatingId(null); }
  };

  const stats = useMemo(() => ({
    total,
    available: courts.filter(c => c.status === 'available' || c.status === 'open').length,
    closed:    courts.filter(c => c.status === 'closed').length,
  }), [courts, total]);

  const displayed = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return courts.filter(c => {
      const byStatus  = statusFilter === 'all' || c.status === statusFilter;
      const byKeyword = !q || c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.sports.some(s => s.toLowerCase().includes(q));
      return byStatus && byKeyword;
    });
  }, [courts, keyword, statusFilter]);

  return (
    <AdminLayout activeKey="stadiums">
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1E] to-[#080C17] px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">Admin / Sân</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Quản lý sân</h1>
              <p className="mt-1 text-sm text-slate-400">Toàn bộ sân trong hệ thống — mọi chủ sân, mọi trạng thái</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                ← Dashboard
              </Link>
              <button
                onClick={fetchCourts}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
                Tải lại
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Tổng sân',        value: stats.total,     grad: 'from-slate-700/40 to-slate-800/20',   border: 'border-white/[0.07]',    text: 'text-white' },
              { label: 'Đang hoạt động',  value: stats.available, grad: 'from-emerald-500/15 to-teal-600/10', border: 'border-emerald-500/20',  text: 'text-emerald-100' },
              { label: 'Đã đóng / Ẩn',   value: stats.closed,    grad: 'from-rose-500/15 to-red-600/10',     border: 'border-rose-500/20',     text: 'text-rose-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.grad} p-5`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-black ${s.text}`}>{loading ? '—' : s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertIcon />
              <span className="flex-1">{error}</span>
              <button onClick={fetchCourts} className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold hover:bg-rose-500/30 transition">Thử lại</button>
            </div>
          )}

          {/* ── Court Table ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            {/* Controls */}
            <div className="flex flex-col gap-3 px-6 py-4 border-b border-white/[0.06] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base">Danh sách sân</h2>
                {!loading && (
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                    {displayed.length}{total > displayed.length ? ` / ${total}` : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchCourts()}
                    placeholder="Tên sân, địa điểm, môn..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500/50 sm:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as 'all' | OwnerCourtStatus)}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
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

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Sân</th>
                    <th className="px-4 py-3">Chủ sân</th>
                    <th className="px-4 py-3">Môn</th>
                    <th className="px-4 py-3">Địa điểm</th>
                    <th className="px-4 py-3 text-center">Sân con</th>
                    <th className="px-4 py-3 text-right">Giá/giờ</th>
                    <th className="px-4 py-3 text-center">Đánh giá</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-center">Hành động</th>
                  </tr>
                </thead>

                {loading ? (
                  <TableSkeleton />
                ) : (
                  <tbody className="divide-y divide-white/[0.04]">
                    {displayed.length === 0 ? (
                      <tr><td colSpan={9} className="py-20 text-center text-slate-500">Không tìm thấy sân phù hợp.</td></tr>
                    ) : (
                      displayed.map(court => {
                        const busy = updatingId === court.id;
                        return (
                          <tr key={court.id} className={`hover:bg-white/[0.025] transition-colors ${busy ? 'opacity-50' : ''}`}>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-white">{court.name}</p>
                              <p className="text-[10px] font-mono text-slate-600 mt-0.5">{court.id.slice(-8)}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-slate-400">{court.owner_id.slice(-8)}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {court.sports.map(s => (
                                  <span key={s} className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-400/20">{s}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-400 max-w-[160px] truncate text-xs" title={court.location}>{court.location}</td>
                            <td className="px-4 py-4 text-center font-semibold text-slate-200">{court.number_of_courts}</td>
                            <td className="px-4 py-4 text-right font-semibold text-emerald-300">{fmt(court.price_per_hour)}₫</td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-amber-300">★ <span className="font-semibold">{court.avg_rating.toFixed(1)}</span></span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[court.status]}`}>
                                {STATUS_LABEL[court.status]}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {court.status === 'closed' ? (
                                <button disabled={busy} onClick={() => handleToggleStatus(court)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed">
                                  <EyeIcon />{busy ? '...' : 'Hiện'}
                                </button>
                              ) : (
                                <button disabled={busy} onClick={() => handleToggleStatus(court)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:cursor-not-allowed">
                                  <EyeOffIcon />{busy ? '...' : 'Ẩn'}
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
              <div className="px-6 py-3 border-t border-white/[0.05]">
                <p className="text-xs text-slate-600">Hiển thị {displayed.length} / {total} sân</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-sm ${
          toast.ok ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200' : 'border-rose-400/30 bg-rose-500/20 text-rose-200'
        }`}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
};
