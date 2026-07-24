import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetOwnerApplications,
  adminApproveOwnerApplication,
  adminRejectOwnerApplication,
  adminRevokeOwnerApplication,
  type OwnerApplication,
  type OwnerApplicationStatus,
  type OwnerApplicationUser,
} from '../../Axios/Axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveUser(app: OwnerApplication): OwnerApplicationUser | null {
  if (typeof app.userId === 'object' && app.userId !== null) {
    return app.userId as OwnerApplicationUser;
  }
  return null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OwnerApplicationStatus, string> = {
  pending:  'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const STATUS_CLASS: Record<OwnerApplicationStatus, string> = {
  pending:  'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/35',
  approved: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
  rejected: 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/35',
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const DowngradeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z" />
    <path d="M16 3v5h5" />
    <path d="M12 11v6" />
    <path d="m9 14 3 3 3-3" />
  </svg>
);

// ─── Detail Modal ──────────────────────────────────────────────────────────────

type DetailModalProps = {
  app: OwnerApplication;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRevoke: (id: string) => void;
  loading: boolean;
  initialRejectMode?: boolean;
};

const DetailModal: React.FC<DetailModalProps> = ({ app, onClose, onApprove, onReject, onRevoke, loading, initialRejectMode = false }) => {
  const [rejectMode, setRejectMode] = useState(initialRejectMode);
  const [reason, setReason] = useState('');
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const user = resolveUser(app);

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(app._id, reason);
  };

  const field = (label: string, value: string | undefined) =>
    value ? (
      <div key={label} className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="text-sm text-slate-200">{value}</p>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 text-sm font-black text-violet-200 ring-1 ring-violet-500/25">
              {(user?.name || user?.userName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white leading-none">{user?.name || user?.userName || 'Người dùng'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[app.status]}`}>
              {STATUS_LABEL[app.status]}
            </span>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 arena-scroll">

          {/* User info */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Thông tin tài khoản</p>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
              {field('Họ tên', user?.name)}
              {field('Tên đăng nhập', user?.userName)}
              {field('Email', user?.email)}
              {field('Số điện thoại', user?.phone)}
              {field('Địa chỉ', user?.address)}
              {field('Ngày tham gia', user?.createdAt ? formatDate(user.createdAt) : undefined)}
            </div>
          </div>

          {/* Application info */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Hồ sơ đăng ký chủ sân</p>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
              {field('Họ và tên', app.contactName)}
              {field('Tên sân / Doanh nghiệp', app.businessName)}
              {field('Địa chỉ kinh doanh', app.businessAddress)}
              {field('Số điện thoại liên hệ', app.phone)}
              {field('CMND / CCCD', app.identityCard)}
              {field('Số tài khoản ngân hàng', app.bankAccount)}
              {field('Số sân lớn', app.largeCourts !== undefined ? String(app.largeCourts) : undefined)}
              {field('Số sân nhỏ', app.smallCourts !== undefined ? String(app.smallCourts) : undefined)}
              {field('Ngày nộp hồ sơ', formatDate(app.createdAt))}
            </div>
            {app.description && (
              <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Mô tả thêm</p>
                <p className="text-sm text-slate-300 leading-relaxed">{app.description}</p>
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {app.status === 'rejected' && app.rejectionReason && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-400">Lý do từ chối</p>
              <p className="text-sm text-rose-200">{app.rejectionReason}</p>
            </div>
          )}

          {/* Reject input */}
          {app.status === 'pending' && rejectMode && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Lý do từ chối <span className="text-rose-400">*</span></label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do từ chối hồ sơ..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-rose-500/60 focus:bg-white/[0.08] transition resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {app.status === 'pending' && (
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 shrink-0">
            {!rejectMode ? (
              <>
                <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
                  Đóng
                </button>
                <button
                  onClick={() => setRejectMode(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50"
                >
                  <XIcon /> Từ chối
                </button>
                <button
                  onClick={() => onApprove(app._id)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <CheckIcon /> Duyệt hồ sơ
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setRejectMode(false); setReason(''); }} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !reason.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XIcon /> Xác nhận từ chối
                </button>
              </>
            )}
          </div>
        )}
        {app.status === 'approved' && (
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 shrink-0">
            {!revokeConfirm ? (
              <>
                <button
                  onClick={() => setRevokeConfirm(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-50"
                >
                  <DowngradeIcon /> Hạ cấp về User
                </button>
                <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
                  Đóng
                </button>
              </>
            ) : (
              <div className="flex w-full flex-col gap-3">
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <p className="font-semibold">Xác nhận hạ cấp tài khoản?</p>
                  <p className="mt-1 text-xs text-amber-200/70">
                    Hành động này sẽ đổi role của <span className="font-bold text-amber-200">{resolveUser(app)?.name || resolveUser(app)?.userName}</span> về <span className="font-bold">Người dùng</span> và xóa trạng thái "Chủ sân đã được duyệt" khỏi hồ sơ của họ. Người dùng có thể đăng ký lại sau.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setRevokeConfirm(false)}
                    disabled={loading}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => onRevoke(app._id)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    <DowngradeIcon /> Xác nhận hạ cấp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {app.status === 'rejected' && (
          <div className="flex items-center justify-end border-t border-white/10 px-6 py-4 shrink-0">
            <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const AdminManageOwnerApplicationPage: React.FC = () => {
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | OwnerApplicationStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);
  const [selectedAppRejectMode, setSelectedAppRejectMode] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchData = useCallback(async (p: number, s: 'all' | OwnerApplicationStatus) => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await adminGetOwnerApplications({ status: s === 'all' ? 'all' : s, page: p, limit: 15 });
      setApplications(res.applications);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.error('[AdminOwnerApp] fetchData error:', msg);
      setFetchError(msg);
      showToast(`Lỗi: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, statusFilter);
  }, [fetchData, page, statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminApproveOwnerApplication(id);
      showToast('Đã duyệt hồ sơ. Tài khoản đã được nâng cấp lên chủ sân.');
      setSelectedApp(null);
      setSelectedAppRejectMode(false);
      fetchData(page, statusFilter);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Không thể duyệt hồ sơ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      await adminRejectOwnerApplication(id, reason);
      showToast('Đã từ chối hồ sơ.');
      setSelectedApp(null);
      setSelectedAppRejectMode(false);
      fetchData(page, statusFilter);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Không thể từ chối hồ sơ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setActionLoading(true);
    try {
      await adminRevokeOwnerApplication(id);
      showToast('Đã hạ cấp về User. Trạng thái chủ sân đã bị xóa khỏi hồ sơ người dùng.');
      setSelectedApp(null);
      setSelectedAppRejectMode(false);
      fetchData(page, statusFilter);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Không thể hạ cấp tài khoản.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) => {
      const user = resolveUser(app);
      return (
        app.businessName.toLowerCase().includes(q) ||
        app.phone.includes(q) ||
        (user?.name?.toLowerCase().includes(q)) ||
        (user?.email?.toLowerCase().includes(q)) ||
        (user?.userName?.toLowerCase().includes(q))
      );
    });
  }, [applications, keyword]);

  const stats = useMemo(() => ({
    total,
    pending:  applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }), [applications, total]);

  return (
    <AdminLayout activeKey="owner-applications">
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <header className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Admin / Chủ sân</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Duyệt hồ sơ chủ sân</h1>
                <p className="mt-2 text-sm text-slate-400">Xem xét và phê duyệt hồ sơ đăng ký trở thành chủ sân.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchData(page, statusFilter)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <RefreshIcon />
                  Làm mới
                </button>
                <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                  Về Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Tổng hồ sơ',    value: total,          border: 'border-slate-600/40',   bg: 'bg-slate-800/50',   text: 'text-slate-100',  sub: 'text-slate-400' },
                { label: 'Chờ duyệt',     value: stats.pending,  border: 'border-amber-400/20',   bg: 'bg-amber-500/10',   text: 'text-amber-100',  sub: 'text-amber-300' },
                { label: 'Đã duyệt',      value: stats.approved, border: 'border-emerald-400/20', bg: 'bg-emerald-500/10', text: 'text-emerald-100', sub: 'text-emerald-300' },
                { label: 'Từ chối',        value: stats.rejected, border: 'border-rose-400/20',    bg: 'bg-rose-500/10',    text: 'text-rose-100',    sub: 'text-rose-300' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${s.sub}`}>{s.label}</p>
                  <p className={`mt-2 text-3xl font-black ${s.text}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </header>

          {/* ── Table ── */}
          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Danh sách hồ sơ</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">{filtered.length}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo tên, email, sân..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-violet-500/50 sm:w-72"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as 'all' | OwnerApplicationStatus); setPage(1); }}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              {fetchError && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  <span className="font-semibold">Lỗi kết nối API:</span> {fetchError}
                  {fetchError.includes('missing_token') || fetchError.includes('Forbidden') || fetchError.includes('forbidden') ? (
                    <p className="mt-1 text-xs text-rose-400/80">Vui lòng đăng xuất và đăng nhập lại bằng tài khoản Admin.</p>
                  ) : null}
                </div>
              )}
              {loading ? (
                <div className="py-20 text-center text-slate-500">Đang tải...</div>
              ) : (
                <table className="w-full min-w-[780px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-3">Người đăng ký</th>
                      <th className="px-3 py-3">Tên sân</th>
                      <th className="px-3 py-3">Địa chỉ kinh doanh</th>
                      <th className="px-3 py-3">Số điện thoại</th>
                      <th className="px-3 py-3 text-center">Ngày nộp</th>
                      <th className="px-3 py-3 text-center">Trạng thái</th>
                      <th className="px-3 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-12 text-center text-slate-500">
                          Không tìm thấy hồ sơ phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((app) => {
                        const user = resolveUser(app);
                        return (
                          <tr key={app._id} className="border-b border-slate-700/30 transition-colors hover:bg-slate-800/40">
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 text-sm font-black text-violet-200 ring-1 ring-violet-500/25">
                                  {(user?.name || user?.userName || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{user?.name || user?.userName || '—'}</p>
                                  <p className="text-xs text-slate-500">{user?.email || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 font-medium text-slate-200">{app.businessName}</td>
                            <td className="px-3 py-4 max-w-[200px]">
                              <p className="truncate text-slate-400 text-xs">{app.businessAddress}</p>
                            </td>
                            <td className="px-3 py-4 text-slate-300">{app.phone}</td>
                            <td className="px-3 py-4 text-center text-slate-400">{formatDate(app.createdAt)}</td>
                            <td className="px-3 py-4 text-center">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[app.status]}`}>
                                {STATUS_LABEL[app.status]}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedApp(app)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/30"
                                >
                                  <EyeIcon />
                                  Xem
                                </button>
                                {app.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(app._id)}
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
                                    >
                                      <CheckIcon />
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => { setSelectedApp(app); setSelectedAppRejectMode(true); }}
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50"
                                    >
                                      <XIcon />
                                      Từ chối
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <p className="text-xs text-slate-500">
                Hiển thị {filtered.length} hồ sơ (trang {page}/{totalPages || 1})
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sau →
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Detail Modal ── */}
      {selectedApp && (
        <DetailModal
          app={selectedApp}
          onClose={() => { setSelectedApp(null); setSelectedAppRejectMode(false); }}
          onApprove={handleApprove}
          onReject={handleReject}
          onRevoke={handleRevoke}
          loading={actionLoading}
          initialRejectMode={selectedAppRejectMode}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-sm ${
          toast.type === 'success'
            ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
            : 'border-rose-400/30 bg-rose-500/20 text-rose-200'
        }`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
};
