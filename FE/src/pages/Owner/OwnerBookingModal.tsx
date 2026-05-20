import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookingTone } from './ownerBookingScheduleMockData';
import { TimeSlotPicker } from '../../components/TimeSlotPicker';

/* ── Types ── */
export type ModalMode = 'add' | 'edit' | 'view';

export type BookingModalData = {
  id?: string;
  facilityName: string;
  courtName: string;
  customer: string;
  phone: string;
  startHour: number;
  endHour: number;
  tone: BookingTone;
  note: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  source: 'app' | 'phone' | 'walkin';
};

type OwnerBookingModalProps = {
  open: boolean;
  mode: ModalMode;
  initialData: Partial<BookingModalData>;
  facilities: string[];
  courts: string[];
  onClose: () => void;
  onSave: (data: BookingModalData) => void;
  onDelete?: (data: BookingModalData) => void;
};

/* ── Constants ── */

const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;

const TONE_OPTIONS: { value: BookingTone; label: string; tw: string }[] = [
  { value: 'blue',    label: 'Xanh',  tw: 'bg-blue-500' },
  { value: 'violet',  label: 'Tím',   tw: 'bg-violet-500' },
  { value: 'emerald', label: 'Lá',    tw: 'bg-emerald-500' },
  { value: 'slate',   label: 'Xám',   tw: 'bg-slate-500' },
];

const STATUS_CFG = {
  confirmed: { label: 'Đã xác nhận', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' },
  pending:   { label: 'Chờ xác nhận', dot: 'bg-amber-400',   badge: 'bg-amber-500/15   text-amber-300   ring-1 ring-amber-500/30'   },
  completed: { label: 'Đã hoàn tất', dot: 'bg-blue-400',    badge: 'bg-blue-500/15    text-blue-300    ring-1 ring-blue-500/30'    },
  cancelled: { label: 'Đã hủy',      dot: 'bg-red-400',     badge: 'bg-red-500/15     text-red-300     ring-1 ring-red-500/30'     },
};

const SOURCE_CFG = {
  app:    { label: 'Qua App',          active: 'border-indigo-500/50 bg-indigo-600/15 text-indigo-300' },
  phone:  { label: 'Điện thoại',       active: 'border-sky-500/50    bg-sky-600/15    text-sky-300'    },
  walkin: { label: 'Đến trực tiếp',   active: 'border-teal-500/50   bg-teal-600/15   text-teal-300'   },
};

const mkDefault = (p: Partial<BookingModalData>): BookingModalData => ({
  id: p.id ?? `bk-${Date.now()}`,
  facilityName: p.facilityName ?? '',
  courtName: p.courtName ?? '',
  customer: p.customer ?? '',
  phone: p.phone ?? '',
  startHour: p.startHour ?? 7,
  endHour: p.endHour ?? 8,
  tone: p.tone ?? 'blue',
  note: p.note ?? '',
  status: p.status ?? 'confirmed',
  source: p.source ?? 'phone',
});

/* ── Micro-components ── */
const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
    {children}
    {required && <span className="ml-0.5 text-rose-400">*</span>}
  </p>
);

const InputEl: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
  <input
    {...rest}
    style={{ fontFamily: 'inherit' }}
    className={`w-full rounded-xl border border-white/10 bg-[#0d1e3d] px-4 py-2.5 text-sm text-white placeholder-slate-600
      outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 ${className}`}
  />
);

const SelectEl: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...rest }) => (
  <select
    {...rest}
    style={{ fontFamily: 'inherit' }}
    className={`w-full appearance-none rounded-xl border border-white/10 bg-[#0d1e3d] px-4 py-2.5 text-sm text-white
      outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 ${className}`}
  />
);

const StaticVal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white min-h-[42px] flex items-center">
    {children || <span className="text-slate-600">—</span>}
  </div>
);

/* ════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════ */
export const OwnerBookingModal: React.FC<OwnerBookingModalProps> = ({
  open, mode, initialData, facilities, courts, onClose, onSave, onDelete,
}) => {
  const [form, setForm]           = useState<BookingModalData>(() => mkDefault(initialData));
  const [editing, setEditing]     = useState(mode !== 'view');
  const [delConfirm, setDelConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(mkDefault(initialData));
      setEditing(mode !== 'view');
      setDelConfirm(false);
    }
  }, [open, initialData, mode]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const set = <K extends keyof BookingModalData>(k: K, v: BookingModalData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const canSave = form.customer.trim().length > 0 && form.endHour > form.startHour;
  const isView  = mode === 'view' && !editing;
  const isAdd   = mode === 'add';
  const dur     = form.endHour - form.startHour;

  const title = isAdd ? 'Thêm lịch đặt' : editing ? 'Chỉnh sửa' : 'Chi tiết đặt sân';

  return (
    <AnimatePresence>
      {open && (
        /* ── Portal root ── */
        <div className="fixed inset-0 z-[200]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ background: 'rgba(2,11,31,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Drawer – slides in from right */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(160deg, #0b1e42 0%, #07152e 60%, #050e22 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '-40px 0 120px -40px rgba(0,0,0,0.8)',
            }}
          >
            {/* Decorative top glow */}
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '200px', pointerEvents: 'none',
                background: isAdd
                  ? 'radial-gradient(ellipse at 50% -20%, rgba(59,130,246,0.18) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.14) 0%, transparent 70%)',
              }}
            />

            {/* ── Header ── */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2, fontFamily: 'inherit' }}>{title}</h2>
                  {!isAdd && (form.facilityName || form.courtName) && (
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                      {[form.facilityName, form.courtName].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                {/* Status badge (view mode) */}
                {isView && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${STATUS_CFG[form.status].badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CFG[form.status].dot}`} />
                    {STATUS_CFG[form.status].label}
                  </span>
                )}

                {/* Close */}
                <button
                  onClick={onClose}
                  style={{
                    width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                    flexShrink: 0, fontFamily: 'inherit'
                  }}
                  className="transition hover:border-white/20 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Source picker (always shown in edit/add) */}
              {!isView && (
                <div>
                  <Label>Nguồn đặt sân</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {(Object.entries(SOURCE_CFG) as [BookingModalData['source'], typeof SOURCE_CFG[keyof typeof SOURCE_CFG]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set('source', key)}
                        style={{ fontFamily: 'inherit' }}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3.5 text-xs font-bold transition
                          ${form.source === key
                            ? cfg.active
                            : 'border-white/[0.07] bg-white/[0.02] text-slate-500 hover:border-white/15 hover:text-slate-300'
                          }`}
                      >
                        <span>{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Source badge (view mode) */}
              {isView && (
                <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Nguồn đặt</p>
                    <p className="text-sm font-semibold text-white">{SOURCE_CFG[form.source].label}</p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Facility + Court (add mode only) */}
              {isAdd && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Label required>Cơ sở</Label>
                    <SelectEl value={form.facilityName} onChange={e => set('facilityName', e.target.value)}>
                      <option value="">-- Chọn --</option>
                      {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                    </SelectEl>
                  </div>
                  <div>
                    <Label required>Sân</Label>
                    <SelectEl value={form.courtName} onChange={e => set('courtName', e.target.value)}>
                      <option value="">-- Chọn --</option>
                      {courts.map(c => <option key={c} value={c}>{c}</option>)}
                    </SelectEl>
                  </div>
                </div>
              )}

              {/* Customer name */}
              <div>
                <Label required>Tên khách hàng</Label>
                {isView ? <StaticVal>{form.customer}</StaticVal>
                  : <InputEl type="text" placeholder="Nhập tên khách hàng..." value={form.customer} onChange={e => set('customer', e.target.value)} />}
              </div>

              {/* Phone */}
              <div>
                <Label>Số điện thoại</Label>
                {isView ? <StaticVal>{form.phone}</StaticVal>
                  : <InputEl type="tel" placeholder="0xxx xxx xxx" value={form.phone} onChange={e => set('phone', e.target.value)} />}
              </div>

              {/* Time Range */}
              <div>
                <Label required>Khung giờ</Label>
                {isView ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '10px 16px' }}>
                    <span style={{ color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}>
                      {fmt(Math.floor(form.startHour)).replace(':00', form.startHour % 1 === 0.5 ? ':30' : ':00')} – {fmt(Math.floor(form.endHour)).replace(':00', form.endHour % 1 === 0.5 ? ':30' : ':00')}
                    </span>
                    <span style={{ marginLeft: 'auto', borderRadius: 20, background: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                      {dur} giờ
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl bg-white/[0.02] p-1">
                    <TimeSlotPicker 
                      slots={(() => {
                        const slots = [];
                        for (let i = 7 * 60; i < 23 * 60; i += 30) {
                          const h1 = Math.floor(i / 60).toString().padStart(2, '0');
                          const m1 = (i % 60).toString().padStart(2, '0');
                          const h2 = Math.floor((i + 30) / 60).toString().padStart(2, '0');
                          const m2 = ((i + 30) % 60).toString().padStart(2, '0');
                          
                          // Mock slots already booked (for demo)
                          const isBooked = (i === 10 * 60) || (i === 10 * 60 + 30) || (i === 17 * 60);

                          slots.push({
                            start: `${h1}:${m1}`,
                            end: `${h2}:${m2}`,
                            status: isBooked ? 'booked' as const : 'available' as const
                          });
                        }
                        return slots;
                      })()}
                      onChange={(range) => {
                        if (range) {
                          const sH = Number(range.start_time.split(':')[0]) + Number(range.start_time.split(':')[1]) / 60;
                          const eH = Number(range.end_time.split(':')[0]) + Number(range.end_time.split(':')[1]) / 60;
                          setForm(prev => ({ ...prev, startHour: sH, endHour: eH }));
                        } else {
                          // Reset to invalid/default if cleared
                          setForm(prev => ({ ...prev, startHour: 0, endHour: 0 }));
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <Label>Trạng thái</Label>
                {isView ? (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_CFG[form.status].badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CFG[form.status].dot}`} />
                    {STATUS_CFG[form.status].label}
                  </span>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                    {(Object.entries(STATUS_CFG) as [BookingModalData['status'], typeof STATUS_CFG[keyof typeof STATUS_CFG]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set('status', key)}
                        style={{ fontFamily: 'inherit' }}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition
                          ${form.status === key ? cfg.badge : 'border-white/[0.07] bg-white/[0.02] text-slate-500 hover:border-white/15 hover:text-slate-300'}`}
                      >
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tone */}
              {!isView && (
                <div>
                  <Label>Màu hiển thị trên lịch</Label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {TONE_OPTIONS.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        title={t.label}
                        onClick={() => set('tone', t.value)}
                        style={{ fontFamily: 'inherit' }}
                        className={`relative h-8 w-8 rounded-full transition hover:scale-110 ${t.tw}
                          ${form.tone === t.value ? 'ring-2 ring-white ring-offset-2 ring-offset-[#07152e] scale-110' : ''}`}
                      >
                        {form.tone === t.value && (
                          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>✓</span>
                        )}
                      </button>
                    ))}
                    <span style={{ marginLeft: 4, fontSize: 12, color: '#475569', fontWeight: 500 }}>{TONE_OPTIONS.find(t => t.value === form.tone)?.label}</span>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <Label>Ghi chú</Label>
                {isView ? (
                  <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '10px 16px', minHeight: 60, color: form.note ? '#cbd5e1' : '#334155', fontSize: 13 }}>
                    {form.note || 'Không có ghi chú.'}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    placeholder="Ghi chú thêm (tùy chọn)..."
                    value={form.note}
                    onChange={e => set('note', e.target.value)}
                    style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1e3d', padding: '10px 16px', fontSize: 13, color: '#fff', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    className="placeholder-slate-600 transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(5,14,34,0.6)' }}>
              {/* Delete confirm */}
              <AnimatePresence>
                {delConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{ marginBottom: 12, borderRadius: 14, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', padding: 14 }}
                  >
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#fca5a5', fontWeight: 600, textAlign: 'center' }}>
                      Xác nhận xóa lịch đặt này?
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        onClick={() => setDelConfirm(false)}
                        style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '6px 16px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={() => onDelete?.(form)}
                        style={{ borderRadius: 20, background: '#dc2626', padding: '6px 16px', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 700, boxShadow: '0 6px 16px -8px rgba(220,38,38,0.8)', border: 'none', fontFamily: 'inherit' }}
                      >
                        Xóa lịch đặt
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isView ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {onDelete && (
                    <button
                      onClick={() => setDelConfirm(true)}
                      style={{ borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', padding: '10px 16px', fontSize: 13, color: '#f87171', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
                      className="transition hover:border-red-500/40 hover:bg-red-500/15"
                    >
                      Xóa
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', padding: '10px 16px', fontSize: 13, color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
                    className="transition hover:text-white"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    style={{ flex: 2, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', padding: '10px 16px', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700, boxShadow: '0 12px 28px -14px rgba(99,102,241,0.8)', border: 'none', fontFamily: 'inherit' }}
                  >
                    Chỉnh sửa
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={onClose}
                    style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', padding: '10px 16px', fontSize: 13, color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
                    className="transition hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => canSave && onSave(form)}
                    disabled={!canSave}
                    style={{
                      flex: 2, borderRadius: 12, border: 'none', padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed',
                      background: canSave ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                      color: canSave ? '#fff' : '#334155',
                      boxShadow: canSave ? '0 12px 28px -14px rgba(99,102,241,0.8)' : 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                  >
                    {isAdd ? 'Thêm lịch đặt' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
