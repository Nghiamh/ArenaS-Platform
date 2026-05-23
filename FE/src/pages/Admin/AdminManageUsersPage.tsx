import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';

type UserRole = 'customer' | 'owner' | 'admin';
type UserStatus = 'active' | 'banned' | 'unverified';
type EditTab = 'info' | 'password' | 'role';

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  totalBookings: number;
  totalSpent: number;
};

const mockUsers: UserItem[] = [
  { id: 'USR-001', fullName: 'Nguyễn Văn An',    email: 'an.nguyen@gmail.com',   phone: '0901234567', role: 'customer', status: 'active',     joinedAt: '2026-01-15', totalBookings: 24, totalSpent: 4800000 },
  { id: 'USR-002', fullName: 'Trần Thị Bình',    email: 'binh.tran@gmail.com',   phone: '0912345678', role: 'customer', status: 'active',     joinedAt: '2026-02-03', totalBookings: 12, totalSpent: 2160000 },
  { id: 'USR-003', fullName: 'Lê Quốc Cường',    email: 'cuong.le@gmail.com',    phone: '0923456789', role: 'owner',    status: 'active',     joinedAt: '2026-01-22', totalBookings: 0,  totalSpent: 0 },
  { id: 'USR-004', fullName: 'Phạm Minh Dũng',   email: 'dung.pham@gmail.com',   phone: '0934567890', role: 'customer', status: 'banned',     joinedAt: '2025-11-10', totalBookings: 5,  totalSpent: 750000 },
  { id: 'USR-005', fullName: 'Vũ Thị Hoa',       email: 'hoa.vu@gmail.com',      phone: '0945678901', role: 'owner',    status: 'unverified', joinedAt: '2026-05-18', totalBookings: 0,  totalSpent: 0 },
  { id: 'USR-006', fullName: 'Đỗ Thanh Long',    email: 'long.do@gmail.com',     phone: '0956789012', role: 'customer', status: 'active',     joinedAt: '2026-03-07', totalBookings: 8,  totalSpent: 1440000 },
  { id: 'USR-007', fullName: 'Hoàng Anh Tuấn',   email: 'tuan.hoang@gmail.com',  phone: '0967890123', role: 'owner',    status: 'active',     joinedAt: '2026-02-14', totalBookings: 0,  totalSpent: 0 },
];

// ─── Config maps ──────────────────────────────────────────────────────────────

const statusLabel: Record<UserStatus, string> = {
  active:     'Hoạt động',
  banned:     'Đã khóa',
  unverified: 'Chưa xác thực',
};
const statusClass: Record<UserStatus, string> = {
  active:     'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
  banned:     'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/35',
  unverified: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/35',
};
const roleLabel: Record<UserRole, string> = {
  customer: 'Khách hàng',
  owner:    'Chủ sân',
  admin:    'Quản trị viên',
};
const roleClass: Record<UserRole, string> = {
  customer: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/35',
  owner:    'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/35',
  admin:    'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/35',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
  </svg>
);
const BanIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" /><path d="m4.9 4.9 14.2 14.2" />
  </svg>
);
const UnlockIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m5 12 5 5L20 7" />
  </svg>
);
const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="m1 1 22 22" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

type EditState = {
  user: UserItem;
  tab: EditTab;
  info: { fullName: string; email: string; phone: string };
  password: { newPwd: string; confirmPwd: string; showNew: boolean; showConfirm: boolean };
  role: { role: UserRole; status: UserStatus };
  pwdError: string;
  saved: EditTab | null;
};

const TABS: { key: EditTab; label: string }[] = [
  { key: 'info',     label: 'Thông tin' },
  { key: 'password', label: 'Mật khẩu' },
  { key: 'role',     label: 'Phân quyền' },
];

function initEdit(user: UserItem): EditState {
  return {
    user,
    tab: 'info',
    info:     { fullName: user.fullName, email: user.email, phone: user.phone },
    password: { newPwd: '', confirmPwd: '', showNew: false, showConfirm: false },
    role:     { role: user.role, status: user.status },
    pwdError: '',
    saved:    null,
  };
}

type EditModalProps = {
  state: EditState;
  onChange: (next: EditState) => void;
  onSave: (tab: EditTab) => void;
  onClose: () => void;
};

const EditModal: React.FC<EditModalProps> = ({ state, onChange, onSave, onClose }) => {
  const set = (patch: Partial<EditState>) => onChange({ ...state, ...patch });

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/60 focus:bg-white/[0.08] transition';

  const canSavePassword =
    state.password.newPwd.length >= 6 &&
    state.password.newPwd === state.password.confirmPwd;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-sm font-black text-cyan-200 ring-1 ring-cyan-500/25">
              {state.user.fullName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-white leading-none">{state.user.fullName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{state.user.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <XIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => set({ tab: t.key, pwdError: '', saved: null })}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                state.tab === t.key
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
              {state.saved === t.key && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* ── Tab: Thông tin ── */}
          {state.tab === 'info' && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Họ và tên</label>
                <input
                  className={inputCls}
                  value={state.info.fullName}
                  onChange={(e) => set({ info: { ...state.info, fullName: e.target.value } })}
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Email</label>
                <input
                  className={inputCls}
                  type="email"
                  value={state.info.email}
                  onChange={(e) => set({ info: { ...state.info, email: e.target.value } })}
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Số điện thoại</label>
                <input
                  className={inputCls}
                  type="tel"
                  value={state.info.phone}
                  onChange={(e) => set({ info: { ...state.info, phone: e.target.value } })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </>
          )}

          {/* ── Tab: Mật khẩu ── */}
          {state.tab === 'password' && (
            <>
              <p className="text-xs text-slate-500">Đặt mật khẩu mới cho tài khoản này. Mật khẩu phải có ít nhất 6 ký tự.</p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-10`}
                    type={state.password.showNew ? 'text' : 'password'}
                    value={state.password.newPwd}
                    onChange={(e) => set({ password: { ...state.password, newPwd: e.target.value }, pwdError: '' })}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => set({ password: { ...state.password, showNew: !state.password.showNew } })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    <EyeIcon off={state.password.showNew} />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-10 ${
                      state.pwdError ? 'border-rose-500/60' : ''
                    }`}
                    type={state.password.showConfirm ? 'text' : 'password'}
                    value={state.password.confirmPwd}
                    onChange={(e) => set({ password: { ...state.password, confirmPwd: e.target.value }, pwdError: '' })}
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => set({ password: { ...state.password, showConfirm: !state.password.showConfirm } })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    <EyeIcon off={state.password.showConfirm} />
                  </button>
                </div>
                {state.pwdError && (
                  <p className="mt-1.5 text-xs text-rose-400">{state.pwdError}</p>
                )}
              </div>

              {/* Strength indicator */}
              {state.password.newPwd.length > 0 && (
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => {
                      const len = state.password.newPwd.length;
                      const active = i <= (len >= 12 ? 4 : len >= 8 ? 3 : len >= 6 ? 2 : 1);
                      return (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            active
                              ? i <= 1 ? 'bg-rose-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-blue-500' : 'bg-emerald-500'
                              : 'bg-white/10'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {state.password.newPwd.length >= 12
                      ? 'Rất mạnh'
                      : state.password.newPwd.length >= 8
                      ? 'Mạnh'
                      : state.password.newPwd.length >= 6
                      ? 'Trung bình'
                      : 'Yếu'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Tab: Phân quyền ── */}
          {state.tab === 'role' && (
            <>
              <div>
                <label className="mb-3 block text-xs font-semibold text-slate-400">Vai trò</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['customer', 'owner', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => set({ role: { ...state.role, role: r } })}
                      className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-xs font-semibold transition ${
                        state.role.role === r
                          ? r === 'customer'
                            ? 'border-blue-500/50 bg-blue-500/15 text-blue-200'
                            : r === 'owner'
                            ? 'border-purple-500/50 bg-purple-500/15 text-purple-200'
                            : 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      {r === 'customer' && (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      )}
                      {r === 'owner' && (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      )}
                      {r === 'admin' && (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      )}
                      {roleLabel[r]}
                      {state.role.role === r && (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs font-semibold text-slate-400">Trạng thái tài khoản</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['active', 'unverified', 'banned'] as UserStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => set({ role: { ...state.role, status: s } })}
                      className={`flex flex-col items-center gap-2 rounded-xl border py-3.5 text-xs font-semibold transition ${
                        state.role.status === s
                          ? s === 'active'
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                            : s === 'unverified'
                            ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                            : 'border-rose-500/50 bg-rose-500/15 text-rose-200'
                          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        s === 'active' ? 'bg-emerald-400' : s === 'unverified' ? 'bg-amber-400' : 'bg-rose-400'
                      }`} />
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (state.tab === 'password') {
                if (state.password.newPwd !== state.password.confirmPwd) {
                  set({ pwdError: 'Mật khẩu không khớp.' });
                  return;
                }
                if (state.password.newPwd.length < 6) {
                  set({ pwdError: 'Mật khẩu phải có ít nhất 6 ký tự.' });
                  return;
                }
              }
              onSave(state.tab);
            }}
            disabled={state.tab === 'password' && !canSavePassword}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              state.tab === 'password' && !canSavePassword
                ? 'cursor-not-allowed bg-cyan-600/40 text-cyan-300/50'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

type ConfirmModal = { userId: string; action: 'ban' | 'unban'; userName: string };

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminManageUsersPage: React.FC = () => {
  const [keyword, setKeyword]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [users, setUsers]           = useState<UserItem[]>(mockUsers);
  const [confirm, setConfirm]       = useState<ConfirmModal | null>(null);
  const [editState, setEditState]   = useState<EditState | null>(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const stats = useMemo(() => ({
    total:      users.length,
    active:     users.filter((u) => u.status === 'active').length,
    banned:     users.filter((u) => u.status === 'banned').length,
    owners:     users.filter((u) => u.role === 'owner').length,
  }), [users]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return users.filter((u) => {
      const byStatus  = statusFilter === 'all' || u.status === statusFilter;
      const byRole    = roleFilter === 'all' || u.role === roleFilter;
      const byKeyword = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
      return byStatus && byRole && byKeyword;
    });
  }, [users, keyword, statusFilter, roleFilter]);

  /* ── Handlers ── */

  const handleConfirmBan = () => {
    if (!confirm) return;
    setUsers((prev) =>
      prev.map((u) => u.id === confirm.userId ? { ...u, status: confirm.action === 'ban' ? 'banned' : 'active' } : u)
    );
    showToast(confirm.action === 'ban' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    setConfirm(null);
  };

  const handleSave = (tab: EditTab) => {
    if (!editState) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== editState.user.id) return u;
        if (tab === 'info')     return { ...u, fullName: editState.info.fullName, email: editState.info.email, phone: editState.info.phone };
        if (tab === 'password') return u;
        if (tab === 'role')     return { ...u, role: editState.role.role, status: editState.role.status };
        return u;
      })
    );
    const msgs: Record<EditTab, string> = {
      info:     'Đã cập nhật thông tin.',
      password: 'Đã đổi mật khẩu thành công.',
      role:     'Đã cập nhật phân quyền.',
    };
    showToast(msgs[tab]);
    setEditState((prev) => prev ? { ...prev, saved: tab } : null);
    if (tab === 'password') {
      setEditState((prev) =>
        prev ? { ...prev, password: { newPwd: '', confirmPwd: '', showNew: false, showConfirm: false }, saved: tab } : null
      );
    }
  };

  return (
    <AdminLayout activeKey="users">
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <header className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin / Người dùng</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quản lý người dùng</h1>
                <p className="mt-2 text-sm text-slate-400">Xem, chỉnh sửa thông tin, đổi mật khẩu và phân quyền tài khoản.</p>
              </div>
              <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                Về Dashboard
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Tổng người dùng', value: stats.total,  border: 'border-slate-600/40',   bg: 'bg-slate-800/50',   text: 'text-slate-100',  sub: 'text-slate-400' },
                { label: 'Đang hoạt động',  value: stats.active, border: 'border-emerald-400/20', bg: 'bg-emerald-500/10', text: 'text-emerald-100', sub: 'text-emerald-300' },
                { label: 'Đã khóa',         value: stats.banned, border: 'border-rose-400/20',    bg: 'bg-rose-500/10',    text: 'text-rose-100',    sub: 'text-rose-300' },
                { label: 'Chủ sân',         value: stats.owners, border: 'border-purple-400/20',  bg: 'bg-purple-500/10',  text: 'text-purple-100',  sub: 'text-purple-300' },
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
                <h2 className="text-xl font-black tracking-tight">Danh sách người dùng</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">{filtered.length}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo tên, email, SĐT..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500/50 sm:w-72"
                  />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
                  <option value="all">Tất cả vai trò</option>
                  <option value="customer">Khách hàng</option>
                  <option value="owner">Chủ sân</option>
                  <option value="admin">Quản trị viên</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | UserStatus)}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="banned">Đã khóa</option>
                  <option value="unverified">Chưa xác thực</option>
                </select>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3">Người dùng</th>
                    <th className="px-3 py-3">Liên hệ</th>
                    <th className="px-3 py-3 text-center">Vai trò</th>
                    <th className="px-3 py-3 text-center">Ngày tham gia</th>
                    <th className="px-3 py-3 text-right">Booking</th>
                    <th className="px-3 py-3 text-right">Chi tiêu</th>
                    <th className="px-3 py-3 text-center">Trạng thái</th>
                    <th className="px-3 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-12 text-center text-slate-500">Không tìm thấy người dùng phù hợp.</td>
                    </tr>
                  ) : (
                    filtered.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/30 transition-colors hover:bg-slate-800/40">
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-sm font-black text-cyan-200 ring-1 ring-cyan-500/25">
                              {user.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{user.fullName}</p>
                              <p className="text-xs text-slate-500">{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-slate-300">{user.email}</p>
                          <p className="text-xs text-slate-500">{user.phone}</p>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleClass[user.role]}`}>
                            {roleLabel[user.role]}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center text-slate-400">{formatDate(user.joinedAt)}</td>
                        <td className="px-3 py-4 text-right font-semibold text-slate-200">{user.totalBookings > 0 ? user.totalBookings : '—'}</td>
                        <td className="px-3 py-4 text-right font-semibold text-emerald-300">{user.totalSpent > 0 ? `${formatCurrency(user.totalSpent)}₫` : '—'}</td>
                        <td className="px-3 py-4 text-center">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[user.status]}`}>
                            {statusLabel[user.status]}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit button */}
                            <button
                              onClick={() => setEditState(initEdit(user))}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30"
                            >
                              <EditIcon />
                              Sửa
                            </button>
                            {/* Ban / Unban */}
                            {user.status === 'banned' ? (
                              <button
                                onClick={() => setConfirm({ userId: user.id, action: 'unban', userName: user.fullName })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
                              >
                                <UnlockIcon />
                                Mở khóa
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirm({ userId: user.id, action: 'ban', userName: user.fullName })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30"
                              >
                                <BanIcon />
                                Khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <p className="text-xs text-slate-500">Hiển thị {filtered.length} / {users.length} người dùng</p>
              <div className="flex gap-1.5">
                <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors">← Trước</button>
                <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors">Sau →</button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Edit Modal ── */}
      {editState && (
        <EditModal
          state={editState}
          onChange={setEditState}
          onSave={handleSave}
          onClose={() => setEditState(null)}
        />
      )}

      {/* ── Confirm Ban/Unban Modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white">
              {confirm.action === 'ban' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {confirm.action === 'ban'
                ? `Tài khoản "${confirm.userName}" sẽ bị khóa và không thể đăng nhập.`
                : `Tài khoản "${confirm.userName}" sẽ được mở khóa và có thể đăng nhập trở lại.`}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirm(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
                Hủy
              </button>
              <button onClick={handleConfirmBan}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${confirm.action === 'ban' ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}>
                {confirm.action === 'ban' ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-xl backdrop-blur-sm">
          ✓ {toast}
        </div>
      )}
    </AdminLayout>
  );
};
