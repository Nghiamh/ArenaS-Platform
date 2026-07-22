import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetIncome,
  type AdminIncomeEntry,
  type AdminIncomeSummary,
  type AdminIncomeType,
} from '../../Axios/Axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt    = (v: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);
const fmtVnd = (v: number) => `${fmt(v)}₫`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const monthLabel = (offset: number) => {
  const d = new Date(); d.setMonth(d.getMonth() + offset);
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
};
const growthPct = (cur: number, prev: number) => {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
};

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
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const TrendUpIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const TrendDownIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
  </svg>
);
const ChevronIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const RowSkeleton = () => (
  <tbody>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="border-b border-white/[0.04]">
        {Array.from({ length: 6 }).map((__, j) => (
          <td key={j} className="px-4 py-4">
            <div className="h-4 animate-pulse rounded-md bg-white/[0.06]" style={{ width: `${55 + (j * 11) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ─── Type Badge ───────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: AdminIncomeType }> = ({ type }) =>
  type === 'deposit' ? (
    <span className="inline-flex rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/25">
      Nạp ví
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-400/25">
      Mua gói
    </span>
  );

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminIncomePage: React.FC = () => {
  const [items,      setItems]      = useState<AdminIncomeEntry[]>([]);
  const [summary,    setSummary]    = useState<AdminIncomeSummary | null>(null);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | AdminIncomeType>('all');
  const [keyword,    setKeyword]    = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');

  const fetchIncome = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetIncome({
        type: typeFilter,
        page: p,
        limit: 20,
        ...(dateFrom && { dateFrom }),
        ...(dateTo   && { dateTo }),
      });
      setItems(res.items);
      setSummary(res.summary);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu thu nhập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncome(1); }, [typeFilter, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      it.userName.toLowerCase().includes(q) ||
      it.userEmail.toLowerCase().includes(q) ||
      it.description.toLowerCase().includes(q),
    );
  }, [items, keyword]);

  const growth = summary ? growthPct(summary.thisMonthRevenue, summary.lastMonthRevenue) : 0;

  const depositPct = summary?.totalRevenue
    ? Math.round((summary.depositTotal / summary.totalRevenue) * 100)
    : 50;

  return (
    <AdminLayout activeKey="income">
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1E] to-[#080C17] px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">Admin / Thu nhập</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Quản lý thu nhập</h1>
              <p className="mt-1 text-sm text-slate-400">Giao dịch dương: nạp tiền ví & mua gói subscription</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                ← Dashboard
              </Link>
              <button
                onClick={() => fetchIncome(1)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
                Tải lại
              </button>
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total */}
            <div className="sm:col-span-2 lg:col-span-1 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-teal-600/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">Tổng doanh thu</p>
              <p className="mt-2 text-2xl font-black text-emerald-100">{summary ? fmtVnd(summary.totalRevenue) : '—'}</p>
              <p className="mt-1 text-[11px] text-slate-500">Tích lũy tất cả thời gian</p>
            </div>

            {/* This month */}
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-blue-600/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">{monthLabel(0)}</p>
              <p className="mt-2 text-2xl font-black text-cyan-100">{summary ? fmtVnd(summary.thisMonthRevenue) : '—'}</p>
              {summary && (
                <p className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {growth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                  {Math.abs(growth)}% vs {monthLabel(-1)}
                </p>
              )}
            </div>

            {/* Deposits */}
            <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/15 to-cyan-600/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-400">Nạp tiền ví</p>
              <p className="mt-2 text-2xl font-black text-sky-100">{summary ? fmtVnd(summary.depositTotal) : '—'}</p>
              <p className="mt-1 text-[11px] text-slate-500">{summary?.depositCount.toLocaleString('vi-VN') ?? '—'} giao dịch</p>
            </div>

            {/* Subscriptions */}
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-purple-600/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">Mua gói</p>
              <p className="mt-2 text-2xl font-black text-violet-100">{summary ? fmtVnd(summary.subscriptionTotal) : '—'}</p>
              <p className="mt-1 text-[11px] text-slate-500">{summary?.subscriptionCount.toLocaleString('vi-VN') ?? '—'} đơn</p>
            </div>
          </div>

          {/* Revenue split bar */}
          {summary && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-4">
              <div className="flex justify-between mb-2 text-xs text-slate-400">
                <span>Nạp ví · {depositPct}%  · {fmt(summary.depositTotal)}₫</span>
                <span>Mua gói · {100 - depositPct}% · {fmt(summary.subscriptionTotal)}₫</span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-700" style={{ width: `${depositPct}%` }} />
                <div className="flex-1 bg-gradient-to-r from-violet-600 to-purple-500" />
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertIcon />
              <span className="flex-1">{error}</span>
              <button onClick={() => fetchIncome(1)} className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold hover:bg-rose-500/30 transition">Thử lại</button>
            </div>
          )}

          {/* ── Table ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            {/* Controls */}
            <div className="flex flex-col gap-3 px-6 py-4 border-b border-white/[0.06] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base">Danh sách giao dịch</h2>
                {!loading && (
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-slate-300">{total}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="Tên, email, mô tả..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500/50 sm:w-52"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={e => { setTypeFilter(e.target.value as 'all' | AdminIncomeType); setPage(1); }}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="deposit">Nạp tiền ví</option>
                  <option value="subscription">Mua gói</option>
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-slate-200 outline-none [color-scheme:dark]" />
                <span className="self-center text-slate-500 text-sm">–</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-slate-200 outline-none [color-scheme:dark]" />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 hover:text-white transition">
                    Xoá lọc
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3">Mã giao dịch</th>
                    <th className="px-4 py-3 text-right">Số tiền (+)</th>
                  </tr>
                </thead>

                {loading ? (
                  <RowSkeleton />
                ) : (
                  <tbody className="divide-y divide-white/[0.04]">
                    {displayed.length === 0 ? (
                      <tr><td colSpan={6} className="py-20 text-center text-slate-500">Không có giao dịch nào.</td></tr>
                    ) : (
                      displayed.map(it => (
                        <tr key={it.id} className="hover:bg-white/[0.025] transition-colors">
                          <td className="px-4 py-4 text-slate-500 whitespace-nowrap text-xs">{fmtDate(it.createdAt)}</td>
                          <td className="px-4 py-4"><TypeBadge type={it.type} /></td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">{it.userName}</p>
                            <p className="text-[11px] text-slate-500">{it.userEmail}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-400 text-xs max-w-[200px] truncate">{it.description}</td>
                          <td className="px-4 py-4">
                            {it.transferCode
                              ? <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-slate-400">{it.transferCode}</span>
                              : <span className="text-slate-600 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-4 text-right font-black text-emerald-300">+{fmt(it.amount)}₫</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                )}
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.05]">
                <p className="text-xs text-slate-500">Trang {page} / {totalPages} · {total} giao dịch</p>
                <div className="flex items-center gap-1.5">
                  <button disabled={page <= 1} onClick={() => fetchIncome(page - 1)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-40">
                    <ChevronIcon dir="left" /> Trước
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button key={p} onClick={() => fetchIncome(p)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button disabled={page >= totalPages} onClick={() => fetchIncome(page + 1)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-40">
                    Sau <ChevronIcon dir="right" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};
