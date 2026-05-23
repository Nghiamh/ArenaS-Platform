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

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const monthLabel = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
};

const growthPct = (current: number, prev: number) => {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
    <path d="M16 3H8L4 7h16l-4-4Z" />
    <circle cx="16" cy="13" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const PackageIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
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

const RowSkeleton: React.FC = () => (
  <tbody>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="border-b border-slate-700/30">
        {Array.from({ length: 6 }).map((__, j) => (
          <td key={j} className="px-3 py-4">
            <div className="h-4 animate-pulse rounded bg-slate-700/50" style={{ width: `${55 + (j * 11) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ─── Type badge ───────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: AdminIncomeType }> = ({ type }) =>
  type === 'deposit' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/25">
      <WalletIcon />
      Nạp ví
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200 ring-1 ring-violet-400/25">
      <PackageIcon />
      Mua gói
    </span>
  );

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminIncomePage: React.FC = () => {
  const [items,        setItems]        = useState<AdminIncomeEntry[]>([]);
  const [summary,      setSummary]      = useState<AdminIncomeSummary | null>(null);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [typeFilter,   setTypeFilter]   = useState<'all' | AdminIncomeType>('all');
  const [keyword,      setKeyword]      = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const fetchIncome = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetIncome({
        type: typeFilter,
        page: p,
        limit: 20,
        ...(dateFrom && { dateFrom }),
        ...(dateTo   && { dateTo   }),
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

  useEffect(() => { fetchIncome(1); }, [typeFilter, dateFrom, dateTo]);

  /* client-side keyword filter on current page */
  const displayed = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.userName.toLowerCase().includes(q)  ||
        it.userEmail.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q),
    );
  }, [items, keyword]);

  const growth = summary ? growthPct(summary.thisMonthRevenue, summary.lastMonthRevenue) : 0;

  return (
    <AdminLayout activeKey="income">
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <header className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin / Thu nhập</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quản lý thu nhập</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Giao dịch dương (+): nạp tiền ví &amp; mua gói. Nguồn: <code className="rounded bg-black/30 px-1 text-xs">GET /api/admin/income</code>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/admin/dashboard"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                  Về Dashboard
                </Link>
                <button
                  onClick={() => fetchIncome(1)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
                  Tải lại
                </button>
              </div>
            </div>

            {/* ── Summary cards ── */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total revenue */}
              <div className="col-span-full rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 p-5 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Tổng doanh thu</p>
                <p className="mt-2 text-3xl font-black text-emerald-100">
                  {summary ? fmtCurrency(summary.totalRevenue) : '—'}₫
                </p>
                <p className="mt-1 text-xs text-emerald-400/70">Tích lũy tất cả thời gian</p>
              </div>

              {/* This month */}
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{monthLabel(0)}</p>
                <p className="mt-2 text-3xl font-black text-cyan-100">
                  {summary ? fmtCurrency(summary.thisMonthRevenue) : '—'}₫
                </p>
                {summary && (
                  <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${growth >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {growth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                    {Math.abs(growth)}% so với {monthLabel(-1)}
                  </span>
                )}
              </div>

              {/* Deposits */}
              <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Nạp tiền ví</p>
                <p className="mt-2 text-3xl font-black text-sky-100">
                  {summary ? fmtCurrency(summary.depositTotal) : '—'}₫
                </p>
                <p className="mt-1 text-xs text-sky-400/70">
                  {summary ? summary.depositCount.toLocaleString('vi-VN') : '—'} giao dịch
                </p>
              </div>

              {/* Subscriptions */}
              <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Mua gói</p>
                <p className="mt-2 text-3xl font-black text-violet-100">
                  {summary ? fmtCurrency(summary.subscriptionTotal) : '—'}₫
                </p>
                <p className="mt-1 text-xs text-violet-400/70">
                  {summary ? summary.subscriptionCount.toLocaleString('vi-VN') : '—'} đơn
                </p>
              </div>
            </div>
          </header>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertIcon />
              <span className="flex-1">{error}</span>
              <button onClick={() => fetchIncome(1)}
                className="shrink-0 rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold hover:bg-rose-500/30 transition">
                Thử lại
              </button>
            </div>
          )}

          {/* ── Table ── */}
          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            {/* Controls */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Danh sách giao dịch</h2>
                {!loading && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                    {total}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Keyword */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tên, email, mô tả..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500/50 sm:w-56"
                  />
                </div>
                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value as 'all' | AdminIncomeType); setPage(1); }}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="deposit">Nạp tiền ví</option>
                  <option value="subscription">Mua gói</option>
                </select>
                {/* Date range */}
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none [color-scheme:dark]"
                />
                <span className="self-center text-slate-500 text-sm">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none [color-scheme:dark]"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 hover:text-white transition"
                  >
                    Xoá lọc
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3">Thời gian</th>
                    <th className="px-3 py-3">Loại</th>
                    <th className="px-3 py-3">Người dùng</th>
                    <th className="px-3 py-3">Mô tả</th>
                    <th className="px-3 py-3">Mã giao dịch</th>
                    <th className="px-3 py-3 text-right">Số tiền (+)</th>
                  </tr>
                </thead>

                {loading ? (
                  <RowSkeleton />
                ) : (
                  <tbody>
                    {displayed.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-16 text-center text-slate-500">
                          Không có giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      displayed.map((it) => (
                        <tr key={it.id}
                          className="border-b border-slate-700/30 transition-colors hover:bg-slate-800/40">
                          <td className="px-3 py-4 text-slate-400 whitespace-nowrap text-xs">
                            {fmtDate(it.createdAt)}
                          </td>
                          <td className="px-3 py-4">
                            <TypeBadge type={it.type} />
                          </td>
                          <td className="px-3 py-4">
                            <p className="font-semibold text-white">{it.userName}</p>
                            <p className="text-[11px] text-slate-500">{it.userEmail}</p>
                          </td>
                          <td className="px-3 py-4 text-slate-300">{it.description}</td>
                          <td className="px-3 py-4">
                            {it.transferCode ? (
                              <span className="font-mono text-xs text-slate-400 bg-white/5 rounded-md px-1.5 py-0.5">
                                {it.transferCode}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <span className="font-black text-emerald-300">
                              +{fmtCurrency(it.amount)}₫
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                )}
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <p className="text-xs text-slate-500">
                  Trang {page} / {totalPages} · {total} giao dịch
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => fetchIncome(page - 1)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronIcon dir="left" /> Trước
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button key={p}
                        onClick={() => fetchIncome(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                          p === page
                            ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30'
                            : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}>
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => fetchIncome(page + 1)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sau <ChevronIcon dir="right" />
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </AdminLayout>
  );
};
