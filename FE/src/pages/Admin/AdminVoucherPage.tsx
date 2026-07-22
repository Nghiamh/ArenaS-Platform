import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components';
import {
  adminGetVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminToggleVoucher,
  adminDeleteVoucher,
  type VoucherItem,
  type VoucherSource,
  type VoucherStatus,
  type DiscountType,
  type VoucherPayload,
} from '../../Axios/voucherApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type VoucherTab = 'system' | 'partner';

type VoucherForm = {
  code: string; name: string; source: VoucherSource; partnerName: string;
  discountType: DiscountType; discountValue: string; minOrderValue: string;
  maxUses: string; startDate: string; expiryDate: string; pointsCost: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<VoucherStatus, string> = { active: 'Đang hoạt động', expired: 'Hết hạn', disabled: 'Đã tắt' };
const STATUS_CLS: Record<VoucherStatus, string> = {
  active:   'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30',
  expired:  'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20',
  disabled: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30',
};

const fmtMoney   = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
const fmtDate    = (iso: string) => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fmtDiscount = (type: DiscountType, v: number) => type === 'percent' ? `${v}%` : `${fmtMoney(v)}₫`;
const usagePct   = (used: number, max: number) => max === 0 ? 0 : Math.min(100, Math.round((used / max) * 100));

function blankForm(source: VoucherSource = 'system'): VoucherForm {
  return { code: '', name: '', source, partnerName: '', discountType: 'percent', discountValue: '', minOrderValue: '', maxUses: '', startDate: '', expiryDate: '', pointsCost: '0' };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const ToggleIcon = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    {on
      ? <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="16" cy="12" r="4" fill="currentColor" /></>
      : <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="8"  cy="12" r="4" fill="currentColor" /></>}
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const XCloseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ─── Form Modal ───────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/50 focus:bg-white/[0.07] transition [color-scheme:dark]';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-400';

type FormModalProps = {
  mode: 'create' | 'edit';
  initial: VoucherForm;
  saving: boolean;
  onSave: (f: VoucherForm) => void;
  onClose: () => void;
};

type FieldProps = {
  name: keyof VoucherForm;
  label: string;
  error?: string;
  children: React.ReactNode;
};

const Field: React.FC<FieldProps> = ({ label, error, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
  </div>
);

const VoucherFormModal: React.FC<FormModalProps> = ({ mode, initial, saving, onSave, onClose }) => {
  const [form, setForm] = useState<VoucherForm>(initial);
  const set = (patch: Partial<VoucherForm>) => setForm(p => ({ ...p, ...patch }));
  const [errors, setErrors] = useState<Partial<Record<keyof VoucherForm, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.code.trim())        e.code          = 'Vui lòng nhập mã voucher.';
    if (!form.name.trim())        e.name          = 'Vui lòng nhập tên voucher.';
    if (form.source === 'partner' && !form.partnerName.trim()) e.partnerName = 'Vui lòng nhập tên đối tác.';
    if (!form.discountValue || isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0) e.discountValue = 'Giá trị không hợp lệ.';
    if (form.discountType === 'percent' && Number(form.discountValue) > 100) e.discountValue = 'Không được vượt quá 100%.';
    if (!form.maxUses || isNaN(Number(form.maxUses)) || Number(form.maxUses) <= 0) e.maxUses = 'Số lần dùng không hợp lệ.';
    if (!form.startDate)  e.startDate  = 'Chọn ngày bắt đầu.';
    if (!form.expiryDate) e.expiryDate = 'Chọn ngày hết hạn.';
    if (form.startDate && form.expiryDate && form.startDate >= form.expiryDate) e.expiryDate = 'Ngày hết hạn phải sau ngày bắt đầu.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="my-auto w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0D1220] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{mode === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}</p>
            <p className="mt-0.5 font-black text-white">{mode === 'create' ? 'Thêm Voucher mới' : `Sửa Voucher ${initial.code}`}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50">
            <XCloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          {/* Source selector */}
          <div className="col-span-2">
            <label className={labelCls}>Loại voucher</label>
            <div className="grid grid-cols-2 gap-3">
              {(['system', 'partner'] as VoucherSource[]).map(s => (
                <button key={s} onClick={() => set({ source: s })}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    form.source === s
                      ? s === 'system' ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200' : 'border-violet-500/50 bg-violet-500/15 text-violet-200'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${s === 'system' ? 'bg-cyan-400' : 'bg-violet-400'}`} />
                  {s === 'system' ? 'Hệ thống ArenaS' : 'Đối tác'}
                </button>
              ))}
            </div>
          </div>

          <Field name="code" label="Mã voucher" error={errors.code}>
            <input className={inputCls} value={form.code} onChange={e => set({ code: e.target.value.toUpperCase() })} placeholder="VD: ARENA20" />
          </Field>
          <Field name="name" label="Tên / mô tả" error={errors.name}>
            <input className={inputCls} value={form.name} onChange={e => set({ name: e.target.value })} placeholder="VD: Giảm 20% lần đầu" />
          </Field>

          {form.source === 'partner' && (
            <div className="col-span-2">
              <Field name="partnerName" label="Tên đối tác" error={errors.partnerName}>
                <input className={inputCls} value={form.partnerName} onChange={e => set({ partnerName: e.target.value })} placeholder="VD: Pepsi VN, Nike..." />
              </Field>
            </div>
          )}

          <div>
            <label className={labelCls}>Loại giảm giá</label>
            <div className="grid grid-cols-2 gap-2">
              {(['percent', 'fixed'] as DiscountType[]).map(t => (
                <button key={t} onClick={() => set({ discountType: t })}
                  className={`rounded-xl border py-2 text-xs font-semibold transition ${form.discountType === t ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200'}`}>
                  {t === 'percent' ? '% Phần trăm' : '₫ Cố định'}
                </button>
              ))}
            </div>
          </div>

          <Field name="discountValue" label={form.discountType === 'percent' ? 'Mức giảm (%)' : 'Số tiền giảm (₫)'} error={errors.discountValue}>
            <input className={inputCls} type="number" min={0} value={form.discountValue} onChange={e => set({ discountValue: e.target.value })} placeholder={form.discountType === 'percent' ? '20' : '50000'} />
          </Field>
          <Field name="minOrderValue" label="Đơn tối thiểu (₫)" error={errors.minOrderValue}>
            <input className={inputCls} type="number" min={0} value={form.minOrderValue} onChange={e => set({ minOrderValue: e.target.value })} placeholder="0 = không giới hạn" />
          </Field>
          <Field name="maxUses" label="Số lần dùng tối đa" error={errors.maxUses}>
            <input className={inputCls} type="number" min={1} value={form.maxUses} onChange={e => set({ maxUses: e.target.value })} placeholder="500" />
          </Field>
          <Field name="pointsCost" label="Chi phí đổi bằng điểm (0 = miễn phí)" error={errors.pointsCost}>
            <input className={inputCls} type="number" min={0} value={form.pointsCost} onChange={e => set({ pointsCost: e.target.value })} placeholder="0 = không cần điểm" />
          </Field>
          <Field name="startDate" label="Ngày bắt đầu" error={errors.startDate}>
            <input className={inputCls} type="date" value={form.startDate} onChange={e => set({ startDate: e.target.value })} />
          </Field>
          <Field name="expiryDate" label="Ngày hết hạn" error={errors.expiryDate}>
            <input className={inputCls} type="date" value={form.expiryDate} onChange={e => set({ expiryDate: e.target.value })} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/[0.07] px-6 py-4">
          <button onClick={onClose} disabled={saving} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50">Hủy</button>
          <button
            onClick={() => { if (validate()) onSave(form); }}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {saving && <SpinnerIcon />}
            {mode === 'create' ? 'Tạo Voucher' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────

const DeleteConfirm: React.FC<{ code: string; deleting: boolean; onConfirm: () => void; onClose: () => void }> = ({ code, deleting, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0D1220] p-6 shadow-2xl">
      <h3 className="text-lg font-black text-white">Xóa voucher?</h3>
      <p className="mt-2 text-sm text-slate-400">
        Voucher <span className="font-mono font-bold text-rose-300">{code}</span> sẽ bị xóa vĩnh viễn.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} disabled={deleting} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50">Hủy</button>
        <button onClick={onConfirm} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60">
          {deleting && <SpinnerIcon />}
          Xóa vĩnh viễn
        </button>
      </div>
    </div>
  </div>
);

// ─── Voucher Card ─────────────────────────────────────────────────────────────

const VoucherCard: React.FC<{ item: VoucherItem; onEdit: () => void; onToggle: () => void; onDelete: () => void }> = ({ item, onEdit, onToggle, onDelete }) => {
  const pct = usagePct(item.usedCount, item.maxUses);
  const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={`rounded-2xl border p-5 transition-all hover:border-white/20 ${item.status === 'active' ? 'border-white/[0.08] bg-white/[0.03]' : 'border-white/[0.04] bg-white/[0.015] opacity-70'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="rounded-lg border border-white/15 bg-white/[0.07] px-2.5 py-1 font-mono text-sm font-black tracking-widest text-white">
              {item.code}
            </span>
            {item.source === 'partner' && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold text-violet-300 ring-1 ring-violet-400/25">
                {item.partnerName}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLS[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-300 truncate">{item.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={onToggle} title={item.status === 'active' ? 'Tắt' : 'Bật'}
            className={`rounded-lg p-1.5 transition ${item.status === 'active' ? 'text-emerald-400 hover:bg-emerald-500/15' : 'text-slate-500 hover:bg-white/[0.06]'} ${item.status === 'expired' ? 'opacity-30 cursor-not-allowed' : ''}`}>
            <ToggleIcon on={item.status === 'active'} />
          </button>
          <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-cyan-500/15 hover:text-cyan-300">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300">
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white/[0.04] py-2.5 px-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Giảm giá</p>
          <p className="mt-1 text-base font-black text-cyan-300">{fmtDiscount(item.discountType, item.discountValue)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2.5 px-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tối thiểu</p>
          <p className="mt-1 text-xs font-bold text-slate-200">{item.minOrderValue > 0 ? `${fmtMoney(item.minOrderValue)}₫` : 'Tất cả'}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2.5 px-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hạn dùng</p>
          <p className="mt-1 text-xs font-bold text-slate-200">{fmtDate(item.expiryDate)}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-500">Đã dùng</span>
          <span className="text-[11px] font-bold text-slate-300">{item.usedCount.toLocaleString()} / {item.maxUses.toLocaleString()} ({pct}%)</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p className="mt-2.5 text-[11px] text-slate-600">{fmtDate(item.startDate)} → {fmtDate(item.expiryDate)}</p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminVoucherPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState<VoucherTab>('system');
  const [keyword,   setKeyword]   = useState('');
  const [statusF,   setStatusF]   = useState<'all' | VoucherStatus>('all');
  const [vouchers,  setVouchers]  = useState<VoucherItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; initial: VoucherForm; editId?: string } | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetVouchers({ limit: 200 });
      setVouchers(res.vouchers);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        window.dispatchEvent(new Event('currentUserUpdated'));
        navigate('/login', { replace: true });
        return;
      }
      const detail = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? '';
      showToast(`Không thể tải danh sách voucher. ${detail}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, navigate]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const stats = useMemo(() => {
    const sys = vouchers.filter(v => v.source === 'system');
    const ptn = vouchers.filter(v => v.source === 'partner');
    return {
      sysActive: sys.filter(v => v.status === 'active').length,
      ptnActive: ptn.filter(v => v.status === 'active').length,
      totalUsed: vouchers.reduce((s, v) => s + v.usedCount, 0),
      total:     vouchers.length,
    };
  }, [vouchers]);

  const displayed = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return vouchers.filter(v => {
      const byTab    = v.source === tab;
      const byStatus = statusF === 'all' || v.status === statusF;
      const byKw     = !q || v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || (v.partnerName ?? '').toLowerCase().includes(q);
      return byTab && byStatus && byKw;
    });
  }, [vouchers, tab, statusF, keyword]);

  const handleToggle = async (id: string) => {
    try {
      const updated = await adminToggleVoucher(id);
      setVouchers(p => p.map(v => v._id === id ? updated : v));
      showToast(updated.status === 'active' ? 'Đã bật voucher.' : 'Đã tắt voucher.');
    } catch {
      showToast('Không thể thay đổi trạng thái.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const v = vouchers.find(x => x._id === deleteId);
    setDeleting(true);
    try {
      await adminDeleteVoucher(deleteId);
      setVouchers(p => p.filter(x => x._id !== deleteId));
      setDeleteId(null);
      showToast(`Đã xóa voucher ${v?.code}.`);
    } catch {
      showToast('Không thể xóa voucher.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (form: VoucherForm) => {
    setSaving(true);
    const payload: VoucherPayload = {
      code: form.code,
      name: form.name,
      source: form.source,
      partnerName: form.source === 'partner' ? form.partnerName : undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderValue: Number(form.minOrderValue) || 0,
      maxUses: Number(form.maxUses),
      startDate: form.startDate,
      expiryDate: form.expiryDate,
      pointsCost: Number(form.pointsCost) || 0,
    };

    try {
      if (formModal?.mode === 'create') {
        const newV = await adminCreateVoucher(payload);
        setVouchers(p => [newV, ...p]);
        setTab(form.source);
        showToast(`Đã tạo voucher ${newV.code}.`);
      } else if (formModal?.editId) {
        const updated = await adminUpdateVoucher(formModal.editId, payload);
        setVouchers(p => p.map(v => v._id === formModal.editId ? updated : v));
        showToast(`Đã cập nhật voucher ${updated.code}.`);
      }
      setFormModal(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Lỗi khi lưu voucher.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (v: VoucherItem) => setFormModal({
    mode: 'edit', editId: v._id,
    initial: {
      code: v.code, name: v.name, source: v.source, partnerName: v.partnerName ?? '',
      discountType: v.discountType, discountValue: String(v.discountValue),
      minOrderValue: String(v.minOrderValue), maxUses: String(v.maxUses),
      startDate: v.startDate, expiryDate: v.expiryDate, pointsCost: String(v.pointsCost ?? 0),
    },
  });

  const deleteTarget = deleteId ? vouchers.find(v => v._id === deleteId) : null;

  return (
    <AdminLayout activeKey="vouchers">
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1E] to-[#080C17] px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">Admin / Voucher</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Kho Voucher</h1>
              <p className="mt-1 text-sm text-slate-400">Quản lý voucher hệ thống ArenaS và các đối tác liên kết</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                ← Dashboard
              </Link>
              <button
                onClick={() => setFormModal({ mode: 'create', initial: blankForm(tab) })}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
              >
                <PlusIcon /> Thêm Voucher
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Tổng voucher',          value: stats.total,     grad: 'from-slate-700/40 to-slate-800/20',    border: 'border-white/[0.07]',    text: 'text-white' },
              { label: 'Hệ thống đang chạy',   value: stats.sysActive, grad: 'from-cyan-500/15 to-blue-600/10',     border: 'border-cyan-500/20',     text: 'text-cyan-100' },
              { label: 'Đối tác đang chạy',    value: stats.ptnActive, grad: 'from-violet-500/15 to-purple-600/10', border: 'border-violet-500/20',   text: 'text-violet-100' },
              { label: 'Tổng lượt đã dùng',    value: stats.totalUsed.toLocaleString('vi-VN'), grad: 'from-emerald-500/15 to-teal-600/10', border: 'border-emerald-500/20', text: 'text-emerald-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.grad} p-5`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-black ${s.text}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Main Section ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            {/* Tab + Filter */}
            <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 pt-4 pb-0 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex">
                {([
                  { key: 'system'  as VoucherTab, label: 'Hệ thống', count: vouchers.filter(v => v.source === 'system').length },
                  { key: 'partner' as VoucherTab, label: 'Đối tác',  count: vouchers.filter(v => v.source === 'partner').length },
                ]).map(t => (
                  <button key={t.key} onClick={() => { setTab(t.key); setKeyword(''); setStatusF('all'); }}
                    className={`relative flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${tab === t.key ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-cyan-500/20 text-cyan-200' : 'bg-white/[0.08] text-slate-400'}`}>{t.count}</span>
                    {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pb-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Tìm mã, tên, đối tác..."
                    className="w-48 rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500/50" />
                </div>
                <select value={statusF} onChange={e => setStatusF(e.target.value as 'all' | VoucherStatus)}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none">
                  <option value="all">Tất cả</option>
                  <option value="active">Đang chạy</option>
                  <option value="disabled">Đã tắt</option>
                  <option value="expired">Hết hạn</option>
                </select>
              </div>
            </div>

            {/* Card Grid */}
            <div className="p-5">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <SpinnerIcon />
                  <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                </div>
              ) : displayed.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-5xl mb-3">🎟</p>
                  <p className="font-semibold text-slate-400 mb-4">Không có voucher nào phù hợp.</p>
                  <button onClick={() => setFormModal({ mode: 'create', initial: blankForm(tab) })}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/25">
                    <PlusIcon /> Thêm voucher mới
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {displayed.map(v => (
                    <VoucherCard key={v._id} item={v} onEdit={() => openEdit(v)} onToggle={() => handleToggle(v._id)} onDelete={() => setDeleteId(v._id)} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {formModal && (
        <VoucherFormModal
          mode={formModal.mode}
          initial={formModal.initial}
          saving={saving}
          onSave={handleSave}
          onClose={() => !saving && setFormModal(null)}
        />
      )}
      {deleteId && deleteTarget && (
        <DeleteConfirm
          code={deleteTarget.code}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => !deleting && setDeleteId(null)}
        />
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-sm transition-all ${
          toast.type === 'error'
            ? 'border-rose-400/30 bg-rose-500/20 text-rose-200'
            : 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
        }`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
};
