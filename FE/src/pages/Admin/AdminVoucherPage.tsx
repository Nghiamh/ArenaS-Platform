import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';

// ─── Types ────────────────────────────────────────────────────────────────────

type VoucherSource = 'system' | 'partner';
type VoucherStatus = 'active' | 'expired' | 'disabled';
type DiscountType   = 'percent' | 'fixed';
type VoucherTab     = 'system' | 'partner';

type VoucherItem = {
  id: string;
  code: string;
  name: string;
  source: VoucherSource;
  partnerName?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  status: VoucherStatus;
};

type VoucherForm = {
  code: string;
  name: string;
  source: VoucherSource;
  partnerName: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderValue: string;
  maxUses: string;
  startDate: string;
  expiryDate: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const initialVouchers: VoucherItem[] = [
  { id: 'VC-001', code: 'ARENA20',    name: 'Giảm 20% cho lần đầu',        source: 'system',  discountType: 'percent', discountValue: 20,     minOrderValue: 100000, maxUses: 500,  usedCount: 312, startDate: '2026-05-01', expiryDate: '2026-06-30', status: 'active'   },
  { id: 'VC-002', code: 'WELCOME50K', name: 'Tặng 50K đăng ký mới',        source: 'system',  discountType: 'fixed',   discountValue: 50000,  minOrderValue: 200000, maxUses: 1000, usedCount: 874, startDate: '2026-04-01', expiryDate: '2026-05-31', status: 'expired'  },
  { id: 'VC-003', code: 'SUMMER30',   name: 'Khuyến mãi Hè 30%',           source: 'system',  discountType: 'percent', discountValue: 30,     minOrderValue: 150000, maxUses: 300,  usedCount: 0,   startDate: '2026-06-01', expiryDate: '2026-08-31', status: 'disabled' },
  { id: 'VC-004', code: 'HOLIDAY15',  name: 'Lễ 30/4 giảm 15%',           source: 'system',  discountType: 'percent', discountValue: 15,     minOrderValue: 80000,  maxUses: 2000, usedCount: 2000,startDate: '2026-04-28', expiryDate: '2026-05-02', status: 'expired'  },
  { id: 'VC-005', code: 'PEPSI100K',  name: 'Pepsi tặng 100K',             source: 'partner', partnerName: 'Pepsi VN', discountType: 'fixed', discountValue: 100000, minOrderValue: 300000, maxUses: 200, usedCount: 87, startDate: '2026-05-10', expiryDate: '2026-07-10', status: 'active' },
  { id: 'VC-006', code: 'NIKE25',     name: 'Nike giảm 25%',               source: 'partner', partnerName: 'Nike VN',  discountType: 'percent', discountValue: 25,   minOrderValue: 200000, maxUses: 150, usedCount: 150, startDate: '2026-03-01', expiryDate: '2026-04-30', status: 'expired' },
  { id: 'VC-007', code: 'GRAB50K',    name: 'Grab giảm 50K vận chuyển',    source: 'partner', partnerName: 'Grab',     discountType: 'fixed', discountValue: 50000,  minOrderValue: 0,      maxUses: 500, usedCount: 201, startDate: '2026-05-15', expiryDate: '2026-06-15', status: 'active' },
  { id: 'VC-008', code: 'MOMO30K',    name: 'MoMo hoàn 30K',               source: 'partner', partnerName: 'MoMo',     discountType: 'fixed', discountValue: 30000,  minOrderValue: 100000, maxUses: 1000,usedCount: 456, startDate: '2026-05-01', expiryDate: '2026-05-31', status: 'disabled'},
];

// ─── Config maps ──────────────────────────────────────────────────────────────

const statusLabel: Record<VoucherStatus, string> = {
  active:   'Đang hoạt động',
  expired:  'Hết hạn',
  disabled: 'Đã tắt',
};
const statusClass: Record<VoucherStatus, string> = {
  active:   'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
  expired:  'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/25',
  disabled: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/35',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
const fmtDate  = (iso: string) => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fmtDiscount = (type: DiscountType, value: number) =>
  type === 'percent' ? `${value}%` : `${fmtMoney(value)}₫`;
const usagePercent = (used: number, max: number) =>
  max === 0 ? 0 : Math.min(100, Math.round((used / max) * 100));

function blankForm(source: VoucherSource = 'system'): VoucherForm {
  return { code: '', name: '', source, partnerName: '', discountType: 'percent', discountValue: '', minOrderValue: '', maxUses: '', startDate: '', expiryDate: '' };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);

// ─── Voucher Form Modal ───────────────────────────────────────────────────────

type FormModalProps = {
  mode: 'create' | 'edit';
  initial: VoucherForm;
  onSave: (form: VoucherForm) => void;
  onClose: () => void;
};

const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/60 focus:bg-white/[0.08] transition';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-400';

const VoucherFormModal: React.FC<FormModalProps> = ({ mode, initial, onSave, onClose }) => {
  const [form, setForm] = useState<VoucherForm>(initial);
  const set = (patch: Partial<VoucherForm>) => setForm((p) => ({ ...p, ...patch }));
  const [errors, setErrors] = useState<Partial<Record<keyof VoucherForm, string>>>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.code.trim())          e.code          = 'Vui lòng nhập mã voucher.';
    if (!form.name.trim())          e.name          = 'Vui lòng nhập tên voucher.';
    if (form.source === 'partner' && !form.partnerName.trim()) e.partnerName = 'Vui lòng nhập tên đối tác.';
    if (!form.discountValue || isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0)
      e.discountValue = 'Giá trị không hợp lệ.';
    if (form.discountType === 'percent' && Number(form.discountValue) > 100)
      e.discountValue = 'Phần trăm không được vượt quá 100.';
    if (!form.maxUses || isNaN(Number(form.maxUses)) || Number(form.maxUses) <= 0)
      e.maxUses = 'Số lần dùng không hợp lệ.';
    if (!form.startDate)  e.startDate  = 'Chọn ngày bắt đầu.';
    if (!form.expiryDate) e.expiryDate = 'Chọn ngày hết hạn.';
    if (form.startDate && form.expiryDate && form.startDate >= form.expiryDate)
      e.expiryDate = 'Ngày hết hạn phải sau ngày bắt đầu.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  const Field: React.FC<{ name: keyof VoucherForm; label: string; children: React.ReactNode }> = ({ name, label, children }) => (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {errors[name] && <p className="mt-1 text-xs text-rose-400">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {mode === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}
            </p>
            <p className="mt-0.5 font-black text-white">
              {mode === 'create' ? 'Thêm Voucher mới' : `Sửa Voucher ${initial.code}`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-4 px-6 py-5">

          {/* Source */}
          <div className="col-span-2">
            <label className={labelCls}>Loại voucher</label>
            <div className="grid grid-cols-2 gap-3">
              {(['system', 'partner'] as VoucherSource[]).map((s) => (
                <button key={s} onClick={() => set({ source: s })}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    form.source === s
                      ? s === 'system' ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200' : 'border-purple-500/50 bg-purple-500/15 text-purple-200'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${s === 'system' ? 'bg-cyan-400' : 'bg-purple-400'}`} />
                  {s === 'system' ? 'Hệ thống ArenaS' : 'Đối tác'}
                </button>
              ))}
            </div>
          </div>

          {/* Code */}
          <Field name="code" label="Mã voucher">
            <input className={inputCls} value={form.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              placeholder="VD: ARENA20" />
          </Field>

          {/* Name */}
          <Field name="name" label="Tên / mô tả">
            <input className={inputCls} value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="VD: Giảm 20% lần đầu" />
          </Field>

          {/* Partner name (conditional) */}
          {form.source === 'partner' && (
            <div className="col-span-2">
              <Field name="partnerName" label="Tên đối tác">
                <input className={inputCls} value={form.partnerName}
                  onChange={(e) => set({ partnerName: e.target.value })}
                  placeholder="VD: Pepsi VN, Nike, Grab..." />
              </Field>
            </div>
          )}

          {/* Discount type */}
          <div>
            <label className={labelCls}>Loại giảm giá</label>
            <div className="grid grid-cols-2 gap-2">
              {(['percent', 'fixed'] as DiscountType[]).map((t) => (
                <button key={t} onClick={() => set({ discountType: t })}
                  className={`rounded-xl border py-2 text-xs font-semibold transition ${
                    form.discountType === t
                      ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'percent' ? '% Phần trăm' : '₫ Cố định'}
                </button>
              ))}
            </div>
          </div>

          {/* Discount value */}
          <Field name="discountValue" label={form.discountType === 'percent' ? 'Mức giảm (%)' : 'Số tiền giảm (₫)'}>
            <input className={inputCls} type="number" min={0} value={form.discountValue}
              onChange={(e) => set({ discountValue: e.target.value })}
              placeholder={form.discountType === 'percent' ? 'VD: 20' : 'VD: 50000'} />
          </Field>

          {/* Min order */}
          <Field name="minOrderValue" label="Đơn tối thiểu (₫)">
            <input className={inputCls} type="number" min={0} value={form.minOrderValue}
              onChange={(e) => set({ minOrderValue: e.target.value })}
              placeholder="0 = không giới hạn" />
          </Field>

          {/* Max uses */}
          <Field name="maxUses" label="Số lần sử dụng tối đa">
            <input className={inputCls} type="number" min={1} value={form.maxUses}
              onChange={(e) => set({ maxUses: e.target.value })}
              placeholder="VD: 500" />
          </Field>

          {/* Start date */}
          <Field name="startDate" label="Ngày bắt đầu">
            <input className={inputCls} type="date" value={form.startDate}
              onChange={(e) => set({ startDate: e.target.value })} />
          </Field>

          {/* Expiry date */}
          <Field name="expiryDate" label="Ngày hết hạn">
            <input className={inputCls} type="date" value={form.expiryDate}
              onChange={(e) => set({ expiryDate: e.target.value })} />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
            Hủy
          </button>
          <button onClick={handleSave}
            className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            {mode === 'create' ? 'Tạo Voucher' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────

const DeleteConfirm: React.FC<{ code: string; onConfirm: () => void; onClose: () => void }> = ({ code, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
      <h3 className="text-lg font-black text-white">Xóa voucher?</h3>
      <p className="mt-2 text-sm text-slate-400">
        Voucher <span className="font-mono font-bold text-rose-300">{code}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
          Hủy
        </button>
        <button onClick={onConfirm}
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
          Xóa vĩnh viễn
        </button>
      </div>
    </div>
  </div>
);

// ─── Voucher Card ─────────────────────────────────────────────────────────────

type CardProps = {
  item: VoucherItem;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
};

const VoucherCard: React.FC<CardProps> = ({ item, onEdit, onToggle, onDelete }) => {
  const pct = usagePercent(item.usedCount, item.maxUses);
  const barColor =
    pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={`rounded-2xl border p-5 transition hover:border-white/20 ${
      item.status === 'active'
        ? 'border-white/10 bg-white/[0.03]'
        : 'border-white/[0.06] bg-white/[0.015] opacity-70'
    }`}>
      <div className="flex items-start justify-between gap-3">
        {/* Code badge + name */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="rounded-lg border border-white/15 bg-white/8 px-2.5 py-1 font-mono text-sm font-black tracking-widest text-white">
              {item.code}
            </span>
            {item.source === 'partner' && (
              <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-300 ring-1 ring-purple-400/30">
                {item.partnerName}
              </span>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[item.status]}`}>
              {statusLabel[item.status]}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-200 truncate">{item.name}</p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={onToggle} title={item.status === 'active' ? 'Tắt voucher' : 'Bật voucher'}
            className={`rounded-lg p-1.5 transition ${item.status === 'active' ? 'text-emerald-400 hover:bg-emerald-500/15' : 'text-slate-500 hover:bg-white/8'}`}>
            <ToggleIcon on={item.status === 'active'} />
          </button>
          <button onClick={onEdit}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-cyan-500/15 hover:text-cyan-300">
            <EditIcon />
          </button>
          <button onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300">
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Discount info */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-white/[0.04] py-2.5 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Giảm giá</p>
          <p className="mt-1 text-lg font-black text-cyan-300">{fmtDiscount(item.discountType, item.discountValue)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2.5 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Đơn tối thiểu</p>
          <p className="mt-1 text-sm font-bold text-slate-200">
            {item.minOrderValue > 0 ? `${fmtMoney(item.minOrderValue)}₫` : 'Không giới hạn'}
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2.5 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hạn dùng</p>
          <p className="mt-1 text-sm font-bold text-slate-200">{fmtDate(item.expiryDate)}</p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">Đã dùng</span>
          <span className="text-xs font-bold text-slate-300">
            {item.usedCount.toLocaleString()} / {item.maxUses.toLocaleString()} lượt ({pct}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Dates */}
      <p className="mt-3 text-[11px] text-slate-600">
        {fmtDate(item.startDate)} → {fmtDate(item.expiryDate)}
      </p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

let nextId = 9;

export const AdminVoucherPage: React.FC = () => {
  const [tab,      setTab]      = useState<VoucherTab>('system');
  const [keyword,  setKeyword]  = useState('');
  const [statusF,  setStatusF]  = useState<'all' | VoucherStatus>('all');
  const [vouchers, setVouchers] = useState<VoucherItem[]>(initialVouchers);
  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; initial: VoucherForm; editId?: string } | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const sys = vouchers.filter((v) => v.source === 'system');
    const ptn = vouchers.filter((v) => v.source === 'partner');
    return {
      sysActive:  sys.filter((v) => v.status === 'active').length,
      ptnActive:  ptn.filter((v) => v.status === 'active').length,
      totalUsed:  vouchers.reduce((s, v) => s + v.usedCount, 0),
      totalVouchers: vouchers.length,
    };
  }, [vouchers]);

  /* ── Filtered list ── */
  const displayed = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return vouchers.filter((v) => {
      const byTab    = v.source === tab;
      const byStatus = statusF === 'all' || v.status === statusF;
      const byKw     = !q || v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || (v.partnerName ?? '').toLowerCase().includes(q);
      return byTab && byStatus && byKw;
    });
  }, [vouchers, tab, statusF, keyword]);

  /* ── Handlers ── */
  const handleToggle = (id: string) => {
    setVouchers((p) => p.map((v) => {
      if (v.id !== id) return v;
      if (v.status === 'expired') return v;
      const next: VoucherStatus = v.status === 'active' ? 'disabled' : 'active';
      showToast(next === 'active' ? 'Đã bật voucher.' : 'Đã tắt voucher.');
      return { ...v, status: next };
    }));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const v = vouchers.find((x) => x.id === deleteId);
    setVouchers((p) => p.filter((x) => x.id !== deleteId));
    setDeleteId(null);
    showToast(`Đã xóa voucher ${v?.code}.`);
  };

  const handleSave = (form: VoucherForm) => {
    if (formModal?.mode === 'create') {
      const newV: VoucherItem = {
        id: `VC-${String(nextId++).padStart(3, '0')}`,
        code: form.code,
        name: form.name,
        source: form.source,
        partnerName: form.source === 'partner' ? form.partnerName : undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        maxUses: Number(form.maxUses),
        usedCount: 0,
        startDate: form.startDate,
        expiryDate: form.expiryDate,
        status: 'active',
      };
      setVouchers((p) => [newV, ...p]);
      setTab(form.source);
      showToast(`Đã tạo voucher ${newV.code}.`);
    } else if (formModal?.editId) {
      setVouchers((p) =>
        p.map((v) => v.id !== formModal.editId ? v : {
          ...v,
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
        })
      );
      showToast(`Đã cập nhật voucher ${form.code}.`);
    }
    setFormModal(null);
  };

  const openEdit = (v: VoucherItem) => {
    setFormModal({
      mode: 'edit', editId: v.id,
      initial: {
        code: v.code, name: v.name, source: v.source, partnerName: v.partnerName ?? '',
        discountType: v.discountType, discountValue: String(v.discountValue),
        minOrderValue: String(v.minOrderValue), maxUses: String(v.maxUses),
        startDate: v.startDate, expiryDate: v.expiryDate,
      },
    });
  };

  const deleteTarget = deleteId ? vouchers.find((v) => v.id === deleteId) : null;

  return (
    <AdminLayout activeKey="vouchers">
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <header className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin / Voucher</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Kho Voucher</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Quản lý toàn bộ voucher hệ thống ArenaS và các đối tác liên kết.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/admin/dashboard"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                  Về Dashboard
                </Link>
                <button
                  onClick={() => setFormModal({ mode: 'create', initial: blankForm(tab) })}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                >
                  <PlusIcon /> Thêm Voucher
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Tổng voucher',         value: stats.totalVouchers,  border: 'border-slate-600/40',   bg: 'bg-slate-800/50',   text: 'text-slate-100',  sub: 'text-slate-400'  },
                { label: 'Hệ thống đang hoạt động', value: stats.sysActive,  border: 'border-cyan-400/20',    bg: 'bg-cyan-500/10',    text: 'text-cyan-100',   sub: 'text-cyan-300'   },
                { label: 'Đối tác đang hoạt động',  value: stats.ptnActive,  border: 'border-purple-400/20',  bg: 'bg-purple-500/10',  text: 'text-purple-100', sub: 'text-purple-300' },
                { label: 'Tổng lượt đã dùng',   value: stats.totalUsed.toLocaleString(), border: 'border-emerald-400/20', bg: 'bg-emerald-500/10', text: 'text-emerald-100', sub: 'text-emerald-300' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${s.sub}`}>{s.label}</p>
                  <p className={`mt-2 text-3xl font-black ${s.text}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </header>

          {/* ── Main Section ── */}
          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm overflow-hidden">

            {/* Tab bar + filters */}
            <div className="flex flex-col gap-3 border-b border-white/[0.08] px-6 pt-5 pb-0 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex">
                {([
                  { key: 'system'  as VoucherTab, label: 'Hệ thống', count: vouchers.filter((v) => v.source === 'system').length },
                  { key: 'partner' as VoucherTab, label: 'Đối tác',  count: vouchers.filter((v) => v.source === 'partner').length },
                ]).map((t) => (
                  <button key={t.key} onClick={() => { setTab(t.key); setKeyword(''); setStatusF('all'); }}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
                      tab === t.key ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-cyan-500/20 text-cyan-200' : 'bg-white/10 text-slate-400'}`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pb-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
                  <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm mã, tên, đối tác..."
                    className="w-52 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500/50" />
                </div>
                <select value={statusF} onChange={(e) => setStatusF(e.target.value as 'all' | VoucherStatus)}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="disabled">Đã tắt</option>
                  <option value="expired">Hết hạn</option>
                </select>
              </div>
            </div>

            {/* Card grid */}
            <div className="p-6">
              {displayed.length === 0 ? (
                <div className="py-20 text-center text-slate-500">
                  <p className="text-4xl mb-3">🎟</p>
                  <p className="font-semibold">Không có voucher nào phù hợp.</p>
                  <button onClick={() => setFormModal({ mode: 'create', initial: blankForm(tab) })}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/25">
                    <PlusIcon /> Thêm voucher mới
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {displayed.map((v) => (
                    <VoucherCard
                      key={v.id}
                      item={v}
                      onEdit={() => openEdit(v)}
                      onToggle={() => handleToggle(v.id)}
                      onDelete={() => setDeleteId(v.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ── Modals ── */}
      {formModal && (
        <VoucherFormModal
          mode={formModal.mode}
          initial={formModal.initial}
          onSave={handleSave}
          onClose={() => setFormModal(null)}
        />
      )}

      {deleteId && deleteTarget && (
        <DeleteConfirm
          code={deleteTarget.code}
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
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
