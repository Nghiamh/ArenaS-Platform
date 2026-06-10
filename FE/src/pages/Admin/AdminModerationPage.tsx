import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetModerationReviews,
  adminDeleteModerationReview,
  adminGetModerationReports,
  adminResolveReport,
  adminDismissReport,
  type AdminReview,
  type AdminReport,
} from '../../Axios/Axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModerationTab = 'reviews' | 'reports';
type ReportStatus  = 'pending' | 'resolved' | 'dismissed';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending:   'Chờ xử lý',
  resolved:  'Đã xử lý',
  dismissed: 'Bỏ qua',
};
const STATUS_CLS: Record<ReportStatus, string> = {
  pending:   'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30',
  resolved:  'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30',
  dismissed: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20',
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 5 5L20 7" /></svg>
);
const MinusIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
);
const FlagIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const XCloseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="h-5 w-5 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ─── Shared components ────────────────────────────────────────────────────────

const FlagBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-400/20">
    <FlagIcon />{children}
  </span>
);

const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLS[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);

const ItemCard: React.FC<{ pending?: boolean; accent?: string; children: React.ReactNode }> = ({ pending, accent = 'border-white/[0.06]', children }) => (
  <article className={`rounded-xl border p-4 transition-colors ${pending ? `${accent} bg-white/[0.025]` : 'border-white/[0.04] bg-white/[0.015]'}`}>
    {children}
  </article>
);

// ─── Detail Modal ─────────────────────────────────────────────────────────────

type DetailPayload =
  | { type: 'review'; item: AdminReview }
  | { type: 'report'; item: AdminReport };

const DetailModal: React.FC<{ payload: DetailPayload; onClose: () => void }> = ({ payload, onClose }) => {
  const { type, item } = payload;
  const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex gap-4">
      <span className="w-36 shrink-0 text-xs font-semibold text-slate-500 pt-0.5">{label}</span>
      <span className="flex-1 text-slate-200 text-sm">{children}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0D1220] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {type === 'review' ? 'Chi tiết đánh giá' : 'Chi tiết báo cáo'}
            </p>
            <p className="mt-0.5 font-bold text-white">{item._id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white">
            <XCloseIcon />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto arena-scroll">
          {type === 'review' && (
            <>
              <Row label="Người đánh giá">{item.reviewer}</Row>
              <Row label="Sân">{item.stadiumName}</Row>
              <Row label="Điểm">
                <span className="flex items-center gap-0.5 text-amber-400">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= item.rating} />)}
                  <span className="ml-1 text-slate-300 text-xs">{item.rating}/5</span>
                </span>
              </Row>
              <Row label="Nội dung">
                <span className="italic text-slate-300">"{item.content || '(không có nội dung)'}"</span>
              </Row>
              <Row label="Ngày đánh giá">{fmtDate(item.createdAt)}</Row>
            </>
          )}
          {type === 'report' && (
            <>
              <Row label="Người báo cáo">{item.reporterName}</Row>
              <Row label="Đối tượng">
                <span className="mr-2">{item.targetName}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.targetType === 'user' ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'}`}>
                  {item.targetType === 'user' ? 'Người dùng' : 'Sân'}
                </span>
              </Row>
              <Row label="Lý do"><FlagBadge>{item.reason}</FlagBadge></Row>
              <Row label="Mô tả"><span className="text-slate-300">{item.description}</span></Row>
              <Row label="Trạng thái"><StatusBadge status={item.status} /></Row>
              <Row label="Ngày báo cáo">{fmtDate(item.createdAt)}</Row>
              {item.appeal_description && (
                <Row label="Kháng nghị">
                  <span className="block rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
                    {item.appeal_description}
                  </span>
                </Row>
              )}
              {item.chat_logs.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Lịch sử chat</p>
                  <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    {item.chat_logs.map((log, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="shrink-0 font-semibold text-slate-400">{log.sender_name}:</span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-white/[0.07] px-6 py-4 flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination: React.FC<{ page: number; totalPages: number; onChange: (p: number) => void }> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 disabled:opacity-30 hover:bg-white/[0.08] transition">
        ‹
      </button>
      <span className="text-sm text-slate-400">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 disabled:opacity-30 hover:bg-white/[0.08] transition">
        ›
      </button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminModerationPage: React.FC = () => {
  const [tab,          setTab]          = useState<ModerationTab>('reviews');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');

  // Reviews state
  const [reviews,      setReviews]      = useState<AdminReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage,  setReviewsPage]  = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Reports state
  const [reports,      setReports]      = useState<AdminReport[]>([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsPage,  setReportsPage]  = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [detail,  setDetail]  = useState<DetailPayload | null>(null);
  const [toast,   setToast]   = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // ── Fetch reviews ──
  const fetchReviews = useCallback(async (page: number) => {
    setReviewsLoading(true);
    try {
      const res = await adminGetModerationReviews({ page, limit: 20 });
      setReviews(res.reviews);
      setReviewsTotal(res.total);
      setReviewsTotalPages(res.totalPages);
      setReviewsPage(res.page);
    } catch {
      // ignore
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // ── Fetch reports ──
  const fetchReports = useCallback(async (page: number, status: string) => {
    setReportsLoading(true);
    try {
      const res = await adminGetModerationReports({ page, limit: 20, status: status === 'all' ? undefined : status });
      setReports(res.reports);
      setReportsTotal(res.total);
      setReportsTotalPages(res.totalPages);
      setReportsPage(res.page);
    } catch {
      // ignore
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);
  useEffect(() => { fetchReports(1, statusFilter); }, [fetchReports, statusFilter]);

  // ── Actions ──
  const handleDeleteReview = async (reviewId: string) => {
    try {
      await adminDeleteModerationReview(reviewId);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      setReviewsTotal(t => t - 1);
      showToast('Đã xoá đánh giá.');
    } catch (e: any) {
      showToast(e.message || 'Lỗi xoá đánh giá.');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await adminResolveReport(reportId);
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
      showToast('Đã xử lý báo cáo.');
    } catch (e: any) {
      showToast(e.message || 'Lỗi xử lý báo cáo.');
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await adminDismissReport(reportId);
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'dismissed' } : r));
      showToast('Đã bỏ qua báo cáo.');
    } catch (e: any) {
      showToast(e.message || 'Lỗi bỏ qua báo cáo.');
    }
  };

  const pendingReports = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);

  const TABS: { key: ModerationTab; label: string; count?: number; emoji: string }[] = [
    { key: 'reviews', label: 'Đánh giá',  emoji: '⭐', count: reviewsTotal },
    { key: 'reports', label: 'Báo cáo',   emoji: '🚨', count: pendingReports },
  ];

  return (
    <AdminLayout activeKey="moderation">
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1E] to-[#080C17] px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">Admin / Kiểm duyệt</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Kiểm duyệt nội dung</h1>
              <p className="mt-1 text-sm text-slate-400">Quản lý đánh giá sân và xử lý báo cáo vi phạm</p>
            </div>
            <div className="flex items-center gap-3">
              {pendingReports > 0 && (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-sm font-bold text-amber-200">
                  {pendingReports} báo cáo chờ xử lý
                </span>
              )}
              <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                ← Dashboard
              </Link>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-orange-600/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tổng đánh giá</p>
              <p className="mt-2 text-3xl font-black text-amber-100">{reviewsTotal}</p>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/15 to-red-600/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Báo cáo chờ xử lý</p>
              <p className="mt-2 text-3xl font-black text-rose-100">{reportsTotal}</p>
            </div>
          </div>

          {/* ── Content ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            {/* Tab bar */}
            <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 pt-4 pb-0 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setStatusFilter('all'); }}
                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${tab === t.key ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                    {(t.count ?? 0) > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-amber-500/25 text-amber-200' : 'bg-white/10 text-slate-400'}`}>{t.count}</span>
                    )}
                    {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />}
                  </button>
                ))}
              </div>
              {tab === 'reports' && (
                <div className="pb-3">
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as 'all' | ReportStatus); setReportsPage(1); }}
                    className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="resolved">Đã xử lý</option>
                    <option value="dismissed">Bỏ qua</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-5 space-y-3">

              {/* ── Reviews tab ── */}
              {tab === 'reviews' && (
                reviewsLoading ? (
                  <div className="py-16 flex justify-center"><SpinnerIcon /></div>
                ) : reviews.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {reviews.map(item => (
                      <ItemCard key={item._id} accent="border-amber-500/15">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-bold text-white">{item.reviewer}</span>
                              <span className="text-slate-500 text-xs">→</span>
                              <span className="text-slate-300 text-sm">{item.stadiumName}</span>
                              <span className="flex items-center gap-0.5 text-amber-400">
                                {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= item.rating} />)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2 italic">"{item.content || '(không có nội dung)'}"</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <span className="text-xs text-slate-600">{fmtDate(item.createdAt)}</span>
                              <button onClick={() => setDetail({ type: 'review', item })}
                                className="text-xs text-cyan-400 hover:underline transition">Chi tiết</button>
                            </div>
                          </div>
                          {/* Admin không được duyệt/dismiss — chỉ có thể xoá đánh giá */}
                          <button
                            onClick={() => handleDeleteReview(item._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30"
                          >
                            <TrashIcon /> Xoá
                          </button>
                        </div>
                      </ItemCard>
                    ))}
                    <Pagination page={reviewsPage} totalPages={reviewsTotalPages} onChange={(p) => fetchReviews(p)} />
                  </>
                )
              )}

              {/* ── Reports tab ── */}
              {tab === 'reports' && (
                reportsLoading ? (
                  <div className="py-16 flex justify-center"><SpinnerIcon /></div>
                ) : reports.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {reports.map(item => (
                      <ItemCard key={item._id} pending={item.status === 'pending'} accent="border-rose-500/15">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-bold text-white">{item.reporterName}</span>
                              <span className="text-slate-500 text-xs">báo cáo</span>
                              <span className="font-semibold text-slate-200">{item.targetName}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.targetType === 'user' ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'}`}>
                                {item.targetType === 'user' ? 'Người dùng' : 'Sân'}
                              </span>
                              <StatusBadge status={item.status} />
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <FlagBadge>{item.reason}</FlagBadge>
                              <span className="text-xs text-slate-600">{fmtDate(item.createdAt)}</span>
                              <button onClick={() => setDetail({ type: 'report', item })}
                                className="text-xs text-cyan-400 hover:underline transition">Chi tiết</button>
                            </div>
                          </div>
                          {item.status === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleResolveReport(item._id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30">
                                <CheckIcon /> Xử lý
                              </button>
                              <button onClick={() => handleDismissReport(item._id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-500/25">
                                <MinusIcon /> Bỏ qua
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">Đã xử lý</span>
                          )}
                        </div>
                      </ItemCard>
                    ))}
                    <Pagination page={reportsPage} totalPages={reportsTotalPages} onChange={(p) => fetchReports(p, statusFilter)} />
                  </>
                )
              )}
            </div>
          </section>
        </div>
      </div>

      {detail && <DetailModal payload={detail} onClose={() => setDetail(null)} />}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-xl backdrop-blur-sm">
          ✓ {toast}
        </div>
      )}
    </AdminLayout>
  );
};

const EmptyState = () => (
  <div className="py-20 text-center">
    <p className="text-5xl mb-3">✓</p>
    <p className="font-semibold text-slate-400">Không có nội dung nào.</p>
  </div>
);
