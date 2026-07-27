import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetAllUsers,
  adminCreateUserAccount,
  adminUpdateUserAccount,
  adminDeleteUserAccount,
  type AdminUser,
  type AdminUserRole,
  type AdminCreateUserPayload,
  type AdminUpdateUserPayload,
} from '../../Axios/Axios';

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<AdminUserRole, string> = {
  user: 'Khách hàng',
  owner: 'Chủ sân',
  admin: 'Quản trị viên',
};
const ROLE_ICON: Record<AdminUserRole, string> = { user: '👤', owner: '🏠', admin: '🛡️' };
const ROLE_CLS: Record<AdminUserRole, string> = {
  user: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30',
  owner: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30',
  admin: 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30',
};

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return iso; }
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
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
const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    {off ? (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="m1 1 22 22" /></>
    ) : (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
        <circle cx="12" cy="12" r="3" /></>
    )}
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const ChevronIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className ?? ''}`} />
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; url?: string }> = ({ name, url }) => {
  const palettes = [
    'from-cyan-500/40 to-blue-600/40',
    'from-violet-500/40 to-purple-600/40',
    'from-emerald-500/40 to-teal-600/40',
    'from-amber-500/40 to-orange-600/40',
    'from-rose-500/40 to-pink-600/40',
  ];
  const palette = palettes[(name.charCodeAt(0) || 0) % palettes.length];
  if (url) return <img src={url} alt={name} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />;
  return (
    <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br ${palette} text-xs font-black text-white ring-1 ring-white/15`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

// ─── Form types ───────────────────────────────────────────────────────────────

type FormMode = 'add' | 'edit';

type FormState = {
  name: string;
  userName: string;
  email: string;
  phone: string;
  role: AdminUserRole;
  isBanned: boolean;
  password: string;
  confirmPwd: string;
  showPwd: boolean;
  showConfirm: boolean;
  showPasswordSection: boolean; // edit mode only — collapsed by default
};

const blankForm = (): FormState => ({
  name: '', userName: '', email: '', phone: '',
  role: 'user', isBanned: false,
  password: '', confirmPwd: '', showPwd: false, showConfirm: false,
  showPasswordSection: true,
});

const fromUser = (u: AdminUser): FormState => ({
  name: u.name ?? '',
  userName: u.userName,
  email: u.email,
  phone: u.phone ?? '',
  role: u.role,
  isBanned: u.isBanned ?? false,
  password: '',
  confirmPwd: '',
  showPwd: false,
  showConfirm: false,
  showPasswordSection: false, // hidden by default in edit mode
});

// ─── User Form Modal ──────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/50 focus:bg-white/[0.07] transition';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-400';

type FormModalProps = {
  mode: FormMode;
  form: FormState;
  saving: boolean;
  errors: Partial<Record<keyof FormState, string>>;
  onChange: (patch: Partial<FormState>) => void;
  onSave: () => void;
  onClose: () => void;
};

const FormField: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
  </div>
);

const UserFormModal: React.FC<FormModalProps> = ({ mode, form, saving, errors, onChange, onSave, onClose }) => {
  const set = (patch: Partial<FormState>) => onChange(patch);
  const strengthLevel = form.password.length >= 12 ? 4 : form.password.length >= 8 ? 3 : form.password.length >= 6 ? 2 : form.password.length > 0 ? 1 : 0;
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][strengthLevel];
  const strengthColors = ['', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="my-auto w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0D1220] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {mode === 'add' ? 'Tạo mới' : 'Chỉnh sửa'}
            </p>
            <p className="mt-0.5 font-black text-white">
              {mode === 'add' ? 'Thêm tài khoản mới' : `Sửa: ${form.name || form.userName}`}
            </p>
          </div>
          <button onClick={onClose} disabled={saving}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Name + Username */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Họ và tên" error={errors.name}>
              <input className={inputCls} value={form.name} placeholder="Nguyễn Văn A"
                onChange={e => set({ name: e.target.value })} />
            </FormField>
            <FormField label="Tên đăng nhập" error={errors.userName}>
              <input className={`${inputCls} ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                autoComplete="off"
                value={form.userName} placeholder="nguyen.vana"
                readOnly={mode === 'edit'}
                onChange={e => set({ userName: e.target.value })} />
            </FormField>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" error={errors.email}>
              <input className={`${inputCls} ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="email" value={form.email} placeholder="email@gmail.com"
                readOnly={mode === 'edit'}
                onChange={e => set({ email: e.target.value })} />
            </FormField>
            <FormField label="Số điện thoại" error={errors.phone}>
              <input className={inputCls} type="tel" value={form.phone} placeholder="09xxxxxxxx"
                onChange={e => set({ phone: e.target.value })} />
            </FormField>
          </div>

          {/* Role */}
          <div>
            <label className={labelCls}>Vai trò</label>
            <div className="grid grid-cols-3 gap-3">
              {(['user', 'owner', 'admin'] as AdminUserRole[]).map(r => (
                <button key={r} type="button" onClick={() => set({ role: r })}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-xs font-semibold transition ${form.role === r
                      ? r === 'user' ? 'border-blue-500/50 bg-blue-500/15 text-blue-200 shadow-lg shadow-blue-500/10'
                        : r === 'owner' ? 'border-violet-500/50 bg-violet-500/15 text-violet-200 shadow-lg shadow-violet-500/10'
                          : 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}>
                  <span className="text-xl">{ROLE_ICON[r]}</span>
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Trạng thái tài khoản</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: false, label: 'Hoạt động', cls: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200', dot: 'bg-emerald-400' },
                { val: true, label: 'Đã khóa', cls: 'border-rose-500/50 bg-rose-500/15 text-rose-200', dot: 'bg-rose-400' },
              ].map(s => (
                <button key={String(s.val)} type="button" onClick={() => set({ isBanned: s.val })}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition ${form.isBanned === s.val ? s.cls : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Password — toggle in edit mode */}
          {mode === 'edit' && !form.showPasswordSection ? (
            <button type="button" onClick={() => set({ showPasswordSection: true })}
              className="w-full rounded-xl border border-dashed border-white/20 py-2.5 text-sm font-semibold text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-400">
              + Đổi mật khẩu (tùy chọn)
            </button>
          ) : (
            <div className="space-y-3">
              {mode === 'edit' && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">Đổi mật khẩu mới</p>
                  <button type="button" onClick={() => set({ showPasswordSection: false, password: '', confirmPwd: '' })}
                    className="text-xs text-slate-500 hover:text-slate-300 transition">
                    Ẩn
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField label={mode === 'add' ? 'Mật khẩu *' : 'Mật khẩu mới'} error={errors.password}>
                  <div className="relative">
                    <input className={`${inputCls} pr-10`} type={form.showPwd ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      placeholder="Tối thiểu 6 ký tự"
                      onChange={e => set({ password: e.target.value })} />
                    <button type="button" onClick={() => set({ showPwd: !form.showPwd })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                      <EyeIcon off={form.showPwd} />
                    </button>
                  </div>
                </FormField>
                <FormField label="Xác nhận mật khẩu" error={errors.confirmPwd}>
                  <div className="relative">
                    <input className={`${inputCls} pr-10 ${errors.confirmPwd ? 'border-rose-500/60' : ''}`}
                      type={form.showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.confirmPwd} placeholder="Nhập lại mật khẩu"
                      onChange={e => set({ confirmPwd: e.target.value })} />
                    <button type="button" onClick={() => set({ showConfirm: !form.showConfirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                      <EyeIcon off={form.showConfirm} />
                    </button>
                  </div>
                </FormField>
              </div>
              {form.password.length > 0 && (
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strengthLevel ? strengthColors[strengthLevel] : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{strengthLabel}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] px-6 py-4">
          <button onClick={onClose} disabled={saving}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50">
            Hủy
          </button>
          <button onClick={onSave} disabled={saving}
            className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60">
            {saving ? 'Đang lưu...' : mode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────

const DeleteConfirm: React.FC<{
  user: AdminUser;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ user, saving, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0D1220] p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 shrink-0">
          <TrashIcon />
        </div>
        <div>
          <h3 className="font-black text-white">Xóa tài khoản?</h3>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      <p className="text-sm text-slate-400">
        Tài khoản <span className="font-semibold text-white">"{user.name || user.userName}"</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} disabled={saving}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50">
          Hủy
        </button>
        <button onClick={onConfirm} disabled={saving}
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60">
          {saving ? 'Đang xóa...' : 'Xóa tài khoản'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminManageUsersPage: React.FC = () => {
  // ── Data state ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── System-wide counts (independent of current page/filters) ───────────
  const [systemStats, setSystemStats] = useState({ owners: 0, banned: 0, active: 0 });

  // ── Filter state ─────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(blankForm());
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (p: number, kw: string, role: string, status: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetAllUsers({
        page: p,
        limit: 15,
        keyword: kw.trim() || undefined,
        role: role === 'all' ? undefined : role as AdminUserRole,
        status: status === 'all' ? undefined : status as 'active' | 'banned',
      });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, keyword, roleFilter, statusFilter);
  }, [roleFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // System-wide totals for the stat cards — independent of the table's current filters
  useEffect(() => {
    Promise.all([
      adminGetAllUsers({ page: 1, limit: 1, role: 'owner' }),
      adminGetAllUsers({ page: 1, limit: 1, status: 'banned' }),
      adminGetAllUsers({ page: 1, limit: 1, status: 'active' }),
    ]).then(([ownersRes, bannedRes, activeRes]) => {
      setSystemStats({ owners: ownersRes.total, banned: bannedRes.total, active: activeRes.total });
    }).catch(() => { });
  }, []);

  // Debounce search
  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchUsers(1, value, roleFilter, statusFilter);
    }, 400);
  };

  const refetch = (p = 1) => fetchUsers(p, keyword, roleFilter, statusFilter);

  // ── Open Form ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormMode('add');
    setEditTarget(null);
    setFormState(blankForm());
    setFormErrors({});
    setFormOpen(true);
  };
  const openEdit = (user: AdminUser) => {
    setFormMode('edit');
    setEditTarget(user);
    setFormState(fromUser(user));
    setFormErrors({});
    setFormOpen(true);
  };

  // ── Validate ───────────────────────────────────────────────────────────
  const validate = (f: FormState, mode: FormMode): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (mode === 'add') {
      // Thêm mới: bắt buộc các trường cơ bản
      if (!f.name.trim()) e.name = 'Vui lòng nhập họ tên.';
      if (!f.userName.trim()) e.userName = 'Vui lòng nhập tên đăng nhập.';
      if (!f.email.trim()) e.email = 'Vui lòng nhập email.';
      if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Email không hợp lệ.';
      if (!f.password) e.password = 'Vui lòng nhập mật khẩu.';
    }

    // Kiểm tra mật khẩu chỉ khi người dùng đang nhập (hoặc bắt buộc ở add mode)
    if (f.password && f.password.length < 6) {
      e.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (f.password && f.password !== f.confirmPwd) {
      e.confirmPwd = 'Mật khẩu không khớp.';
    }

    return e;
  };

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate(formState, formMode);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      if (formMode === 'add') {
        const payload: AdminCreateUserPayload = {
          name: formState.name.trim(),
          email: formState.email.trim(),
          userName: formState.userName.trim(),
          password: formState.password,
          phone: formState.phone.trim() || undefined,
          role: formState.role,
        };
        const created = await adminCreateUserAccount(payload);
        setUsers(prev => [created, ...prev]);
        setTotal(t => t + 1);
        showToast(`Đã tạo tài khoản "${created.name || created.userName}".`);
      } else if (editTarget) {
        const payload: AdminUpdateUserPayload = {
          name: formState.name.trim() || undefined,
          phone: formState.phone.trim() || undefined,
          role: formState.role,
          isBanned: formState.isBanned,
          password: formState.password || undefined,
        };
        const updated = await adminUpdateUserAccount(editTarget._id, payload);
        setUsers(prev => prev.map(u => u._id === editTarget._id ? updated : u));
        showToast(`Đã cập nhật tài khoản "${updated.name || updated.userName}".`);
      }
      setFormOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminDeleteUserAccount(deleteTarget._id);
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      setTotal(t => Math.max(0, t - 1));
      showToast(`Đã xóa tài khoản "${deleteTarget.name || deleteTarget.userName}".`, false);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi xóa tài khoản.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Quick toggle ban ────────────────────────────────────────────────────
  const handleToggleBan = async (user: AdminUser) => {
    const newBanned = !user.isBanned;
    try {
      const updated = await adminUpdateUserAccount(user._id, { isBanned: newBanned });
      setUsers(prev => prev.map(u => u._id === user._id ? updated : u));
      showToast(newBanned ? `Đã khóa "${user.name || user.userName}".` : `Đã mở khóa "${user.name || user.userName}".`, !newBanned);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái.', false);
    }
  };

  // ── Quick change role ───────────────────────────────────────────────────
  const handleCycleRole = async (user: AdminUser) => {
    const order: AdminUserRole[] = ['user', 'owner', 'admin'];
    const next = order[(order.indexOf(user.role) + 1) % order.length];
    try {
      const updated = await adminUpdateUserAccount(user._id, { role: next });
      setUsers(prev => prev.map(u => u._id === user._id ? updated : u));
      showToast(`Đổi vai trò "${user.name || user.userName}" → ${ROLE_LABEL[next]}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đổi vai trò.', false);
    }
  };

  return (
    <AdminLayout activeKey="users">
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1E] to-[#080C17] px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">Admin / Người dùng</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Quản lý người dùng</h1>
              <p className="mt-1 text-sm text-slate-400">
                Thêm, sửa, xóa tài khoản và phân quyền vai trò
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                ← Dashboard
              </Link>
              <button type="button" onClick={() => refetch(page)} disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50">
                <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
              </button>
              <button type="button" onClick={openAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/20">
                <PlusIcon /> Thêm tài khoản
              </button>
            </div>
          </div>

          {/* ── Stat Cards (system-wide totals) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Tổng người dùng', value: loading ? '…' : total, grad: 'from-blue-500/15 to-indigo-600/10', border: 'border-blue-500/20', text: 'text-blue-100' },
              { label: 'Chủ sân', value: loading ? '…' : systemStats.owners, grad: 'from-violet-500/15 to-purple-600/10', border: 'border-violet-500/20', text: 'text-violet-100' },
              { label: 'Đã khóa', value: loading ? '…' : systemStats.banned, grad: 'from-rose-500/15 to-red-600/10', border: 'border-rose-500/20', text: 'text-rose-100' },
              { label: 'Đang hoạt động', value: loading ? '…' : systemStats.active, grad: 'from-emerald-500/15 to-teal-600/10', border: 'border-emerald-500/20', text: 'text-emerald-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.grad} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-black ${s.text}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertIcon />
              <span className="flex-1">{error}</span>
              <button onClick={() => refetch(1)} className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold hover:bg-rose-500/30 transition">Thử lại</button>
            </div>
          )}

          {/* ── Table ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">

            {/* Controls */}
            <div className="flex flex-col gap-3 px-6 py-4 border-b border-white/[0.06] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base">Danh sách tài khoản</h2>
                {!loading && (
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-slate-300">{total}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input
                    type="text"
                    autoComplete="off"
                    value={keyword}
                    onChange={e => handleKeywordChange(e.target.value)}
                    placeholder="Tên, email, username, SĐT..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500/50 sm:w-64"
                  />
                </div>
                <select value={roleFilter}
                  onChange={e => { setRoleFilter(e.target.value as 'all' | AdminUserRole); setPage(1); }}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none">
                  <option value="all">Tất cả vai trò</option>
                  <option value="user">Khách hàng</option>
                  <option value="owner">Chủ sân</option>
                  <option value="admin">Quản trị viên</option>
                </select>
                <select value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as 'all' | 'active' | 'banned'); setPage(1); }}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="banned">Đã khóa</option>
                </select>
              </div>
            </div>

            {/* Table body */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Tài khoản</th>
                    <th className="px-5 py-3">Liên hệ</th>
                    <th className="px-5 py-3 text-center">Vai trò</th>
                    <th className="px-5 py-3 text-center">Trạng thái</th>
                    <th className="px-5 py-3 text-center">Tham gia</th>
                    <th className="px-5 py-3 text-center">Hành động</th>
                  </tr>
                </thead>

                {loading ? (
                  <tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        <td className="px-5 py-4"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                        <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-5 py-4 text-center"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                        <td className="px-5 py-4 text-center"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                        <td className="px-5 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                        <td className="px-5 py-4 text-center"><Skeleton className="h-7 w-28 mx-auto rounded-lg" /></td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-white/[0.04]">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <p className="text-4xl mb-3">👥</p>
                          <p className="text-slate-500 font-semibold">Không tìm thấy tài khoản phù hợp.</p>
                        </td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">

                          {/* Account */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={user.name || user.userName} url={user.avatarUrl} />
                              <div>
                                <p className="font-semibold text-white">{user.name || '—'}</p>
                                <p className="text-[11px] text-slate-500">@{user.userName}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-5 py-4">
                            <p className="text-slate-300 text-sm">{user.email}</p>
                            <p className="text-[11px] text-slate-500">{user.phone || '—'}</p>
                          </td>

                          {/* Role — click to cycle */}
                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleCycleRole(user)}
                              title="Click để đổi vai trò"
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:scale-105 ${ROLE_CLS[user.role]}`}
                            >
                              {ROLE_ICON[user.role]} {ROLE_LABEL[user.role]}
                            </button>
                          </td>

                          {/* Status — click to toggle */}
                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleBan(user)}
                              title="Click để khóa/mở khóa"
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:scale-105 ${user.isBanned
                                  ? 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30'
                                  : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
                                }`}
                            >
                              {user.isBanned ? 'Đã khóa' : 'Hoạt động'}
                            </button>
                          </td>

                          {/* Joined */}
                          <td className="px-5 py-4 text-center text-xs text-slate-400 whitespace-nowrap">
                            {fmtDate(user.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button type="button" onClick={() => openEdit(user)} title="Chỉnh sửa"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30">
                                <EditIcon /> Sửa
                              </button>
                              <button type="button" onClick={() => setDeleteTarget(user)} title="Xóa tài khoản"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30">
                                <TrashIcon /> Xóa
                              </button>
                            </div>
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
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.05]">
                <p className="text-xs text-slate-500">Trang {page} / {totalPages} · {total} tài khoản</p>
                <div className="flex items-center gap-1.5">
                  <button disabled={page <= 1} onClick={() => refetch(page - 1)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-40">
                    <ChevronIcon dir="left" /> Trước
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button key={p} onClick={() => refetch(p)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button disabled={page >= totalPages} onClick={() => refetch(page + 1)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-40">
                    Sau <ChevronIcon dir="right" />
                  </button>
                </div>
              </div>
            )}

            {!loading && totalPages <= 1 && (
              <div className="px-6 py-3 border-t border-white/[0.05] flex items-center justify-between">
                <p className="text-xs text-slate-600">{total} tài khoản · Click badge Vai trò hoặc Trạng thái để thay đổi nhanh</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Modals ── */}
      {formOpen && (
        <UserFormModal
          mode={formMode}
          form={formState}
          saving={saving}
          errors={formErrors}
          onChange={patch => setFormState(prev => ({ ...prev, ...patch }))}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          user={deleteTarget}
          saving={saving}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-sm ${toast.ok ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200' : 'border-rose-400/30 bg-rose-500/20 text-rose-200'
          }`}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
};
