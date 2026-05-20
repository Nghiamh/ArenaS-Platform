import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createOwnerBooking, type OwnerCourt, type OwnerBooking } from '../../Axios/Axios';
import {
  bookingHours,
  type BookingTone,
  type BookingBlock,
} from './ownerBookingScheduleMockData';
import { OwnerBookingModal, type BookingModalData, type ModalMode } from './OwnerBookingModal';

/* ── Types ── */
type ScheduleState = any[];

type ModalState = {
  open: boolean;
  mode: ModalMode;
  initial: Partial<BookingModalData>;
  fIdx: number;
  cIdx: number;
  bIdx: number | null;
  bookingId?: string;
};

const CLOSED: ModalState = { open: false, mode: 'view', initial: {}, fIdx: -1, cIdx: -1, bIdx: null };

/* ── Style maps ── */
const ACCENT: Record<BookingTone, string> = {
  blue:    'bg-blue-500/20    text-blue-200    ring-1 ring-blue-400/35',
  violet:  'bg-violet-500/20  text-violet-200  ring-1 ring-violet-400/35',
  emerald: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/35',
  slate:   'bg-slate-500/20   text-slate-200   ring-1 ring-slate-400/30',
};

const TONE_CHIP: Record<BookingTone, { bg: string; border: string; shadow: string }> = {
  blue:    { bg: 'from-blue-600    to-blue-500/70',    border: 'border-blue-400/40',    shadow: 'rgba(37,99,235,0.5)'   },
  violet:  { bg: 'from-violet-600  to-violet-500/70',  border: 'border-violet-400/40',  shadow: 'rgba(139,92,246,0.5)'  },
  emerald: { bg: 'from-emerald-600 to-emerald-500/70', border: 'border-emerald-400/40', shadow: 'rgba(16,185,129,0.5)'  },
  slate:   { bg: 'from-slate-600   to-slate-500/70',   border: 'border-slate-400/40',   shadow: 'rgba(100,116,139,0.4)' },
};

const COL   = '220px repeat(16, 110px)';
const WIDTH = '1990px';
const HC    = bookingHours.length;
const fmt   = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${(h % 1) * 60 === 30 ? '30' : '00'}`;
const WEEK_COL = 'minmax(210px,250px) repeat(7,minmax(150px,1fr))';

/* ═══════════════════════════════════════
   Booking chip (day view)
   ═══════════════════════════════════════ */
const Chip: React.FC<{ b: BookingBlock; onClick: () => void }> = ({ b, onClick }) => {
  const s    = b.startHour - 7;
  const span = Math.max(1, b.endHour - b.startHour);
  const t    = TONE_CHIP[b.tone] || TONE_CHIP.blue;

  return (
    <motion.button
      type="button"
      onClick={e => { e.stopPropagation(); onClick(); }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`group absolute top-[6px] bottom-[6px] z-20 overflow-hidden rounded-xl border bg-gradient-to-br
        text-left transition-all hover:brightness-110 hover:scale-[1.02] hover:z-30 ${t.bg} ${t.border}`}
      style={{
        left: `calc(${(s / HC) * 100}% + 4px)`,
        width: `calc(${(span / HC) * 100}% - 8px)`,
        minWidth: 80,
        boxShadow: `0 8px 20px -10px ${t.shadow}`,
      }}
    >
      {/* Shine */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      <div className="relative px-3 py-2">
        <p className="text-[13px] font-bold leading-tight text-white truncate">{b.customer}</p>
        <p className="mt-0.5 text-[11px] text-white/70">{fmt(b.startHour)}–{fmt(b.endHour)}</p>
      </div>
      {/* Hover edit hint */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30 rounded-xl">
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">🔍 Chi tiết</span>
      </div>
    </motion.button>
  );
};

/* ═══════════════════════════════════════
   Add-slot button (empty row area)
   ═══════════════════════════════════════ */
const AddSlot: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute inset-[4px] z-10 flex items-center justify-center rounded-xl border border-dashed border-transparent
      transition-all hover:border-white/20 hover:bg-white/[0.04] group"
    title="Thêm lịch đặt vào sân này"
  >
    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition">
      <span className="text-base leading-none">＋</span> Thêm lịch đặt
    </span>
  </button>
);

/* ═══════════════════════════════════════
   Court row
   ═══════════════════════════════════════ */
const CourtRow: React.FC<{
  court: any;
  onChipClick: (b: BookingBlock, bIdx: number) => void;
  onAddClick: () => void;
}> = ({ court, onChipClick, onAddClick }) => (
  <div
    className="grid border-t border-white/[0.06] hover:bg-white/[0.015] transition-colors"
    style={{ gridTemplateColumns: COL, width: WIDTH }}
  >
    {/* Court label */}
    <div className="flex min-h-[64px] items-center gap-3 px-4 py-3">
      <div className={`h-2 w-2 flex-shrink-0 rounded-full ${court.open ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      <div>
        <p className="text-sm font-bold text-white">{court.name}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{court.capacity}</p>
      </div>
    </div>

    {/* Timeline */}
    <div className="relative min-h-[64px]" style={{ gridColumn: '2 / -1', position: 'relative' }}>
      {/* Hour divider lines */}
      {bookingHours.map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-r border-white/[0.04]"
          style={{ left: `${(i / HC) * 100}%`, pointerEvents: 'none' }}
        />
      ))}
      <AddSlot onClick={onAddClick} />
      {court.bookings.map((b: any, bIdx: number) => (
        <Chip key={`${court.name}-${b.customer}-${b.startHour}-${bIdx}`} b={b} onClick={() => onChipClick(b, bIdx)} />
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════
   Facility section
   ═══════════════════════════════════════ */
const FacilitySection: React.FC<{
  facility: any;
  fIdx: number;
  onChipClick: (fIdx: number, cIdx: number, b: BookingBlock, bIdx: number) => void;
  onAddClick: (fIdx: number, cIdx: number) => void;
}> = ({ facility, fIdx, onChipClick, onAddClick }) => (
  <section className="border-t border-white/[0.06] first:border-t-0">
    {/* Facility header row */}
    <div
      className="grid items-center bg-white/[0.025]"
      style={{ gridTemplateColumns: COL, width: WIDTH }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg ${ACCENT[facility.accent as BookingTone] || ACCENT.blue}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        <div>
          <p className="text-sm font-extrabold leading-tight text-white">{facility.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{facility.location}</p>
        </div>
      </div>
      <div className="col-span-16 flex items-center gap-2 px-4">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ACCENT[facility.accent as BookingTone] || ACCENT.blue}`}>
          {facility.bookingCount} lượt đặt
        </span>
      </div>
    </div>

    {facility.courts.map((court: any, cIdx: number) => (
      <CourtRow
        key={`${facility.name}-${court.name}`}
        court={court}
        onChipClick={(b, bIdx) => onChipClick(fIdx, cIdx, b, bIdx)}
        onAddClick={() => onAddClick(fIdx, cIdx)}
      />
    ))}
  </section>
);

/* ═══════════════════════════════════════
   Week view
   ═══════════════════════════════════════ */
const WeekView: React.FC<{
  currentDate: string;
  schedule: any[];
}> = ({ currentDate, schedule }) => {
  // Monday of the week
  const current = new Date(currentDate);
  const day = current.getDay();
  const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diffToMonday));

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
    // Count total bookings on this date across all facilities/courts
    let count = 0;
    schedule.forEach(f => {
      f.courts.forEach((c: any) => {
        if (c.bookingsByDay && c.bookingsByDay[i]) {
          count += c.bookingsByDay[i].length;
        }
      });
    });
    
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    return {
      key: keys[d.getDay()],
      label: labels[d.getDay()],
      date: d.getDate(),
      total: count
    };
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07162f]/80">
      {/* Header */}
      <div className="grid border-b border-white/[0.08] bg-[#0a1a38]/80" style={{ gridTemplateColumns: WEEK_COL }}>
        <div className="border-r border-white/[0.06] px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-600">Cơ sở / Sân</div>
        {weekDays.map(d => (
          <div key={d.key} className="border-r border-white/[0.06] px-3 py-3 text-center last:border-r-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{d.label}</p>
            <p className="mt-1 text-lg font-black text-white">{d.date}</p>
            {d.total > 0 && (
              <span className="mt-1.5 inline-flex rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-400/30">
                {d.total}
              </span>
            )}
          </div>
        ))}
      </div>

      {schedule.map(f => (
        <div key={f.name} className="border-b border-white/[0.06] last:border-b-0">
          {/* Facility header */}
          <div className="grid bg-white/[0.02]" style={{ gridTemplateColumns: WEEK_COL }}>
            <div className="flex items-center gap-2.5 border-r border-white/[0.06] px-5 py-4">
              <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg ${ACCENT[f.accent as BookingTone] || ACCENT.blue}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-white">{f.name}</p>
                <p className="text-[11px] text-slate-500">{f.location}</p>
              </div>
            </div>
            {weekDays.map((d, i) => {
              // Count facility total for day i
              let fTotal = 0;
              f.courts.forEach((c: any) => {
                if (c.bookingsByDay && c.bookingsByDay[i]) {
                  fTotal += c.bookingsByDay[i].length;
                }
              });

              return (
                <div key={d.key} className="border-r border-white/[0.06] px-3 py-4 last:border-r-0 flex items-center justify-center">
                  {fTotal > 0
                    ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ACCENT[f.accent as BookingTone] || ACCENT.blue}`}>{fTotal} đặt</span>
                    : <span className="text-[11px] text-slate-700">—</span>}
                </div>
              );
            })}
          </div>

          {f.courts.map((court: any) => (
            <div key={`${f.name}-${court.name}`} className="grid border-t border-white/[0.05]" style={{ gridTemplateColumns: WEEK_COL }}>
              <div className="flex items-center gap-2.5 border-r border-white/[0.06] px-5 py-3">
                <div className={`h-2 w-2 flex-shrink-0 rounded-full ${court.open ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <div>
                  <p className="text-sm font-bold text-white">{court.name}</p>
                  <p className="text-[11px] text-slate-500">{court.capacity}</p>
                </div>
              </div>
              {weekDays.map((d, i) => {
                const bks = court.bookingsByDay ? court.bookingsByDay[i] ?? [] : [];
                return (
                  <div key={`${court.name}-${d.key}`} className="border-r border-white/[0.06] p-2 last:border-r-0">
                    <div className={`min-h-[72px] rounded-xl border p-2 ${i % 2 === 0 ? 'border-white/[0.05] bg-white/[0.02]' : 'border-transparent'}`}>
                      {bks.length > 0 ? (
                        <div className="space-y-1.5">
                          {bks.map((b: any, bIdx: number) => {
                            const toneStyle = TONE_CHIP[b.tone as BookingTone] || TONE_CHIP.blue;
                            return (
                              <div key={`${court.name}-${d.key}-${b.customer}-${bIdx}`}
                                className={`rounded-lg border bg-gradient-to-r px-2.5 py-1.5 ${toneStyle.bg} ${toneStyle.border}`}>
                                <p className="text-[12px] font-bold text-white truncate">{b.customer}</p>
                                <p className="text-[10px] text-white/70">{fmt(b.startHour)}–{fmt(b.endHour)}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[56px] items-center justify-center rounded-lg border border-dashed border-white/[0.05] text-[11px] text-slate-700">
                          Trống
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════
   List view
   ═══════════════════════════════════════ */
const ListView: React.FC<{
  bookingsData: OwnerBooking[];
  courtsData: OwnerCourt[];
  onDetailClick: (booking: OwnerBooking) => void;
}> = ({ bookingsData, courtsData, onDetailClick }) => {
  const getSubCourtName = (courtId: string, subCourtId: string) => {
    const court = courtsData.find(c => c.id === courtId);
    const sub = court?.sub_courts.find(sc => sc._id === subCourtId);
    return court && sub ? `${court.name} - ${sub.name}` : 'Sân đã bị xóa';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07162f]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-300">
          <thead className="bg-[#0a1a38]/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Số điện thoại</th>
              <th className="px-6 py-4">Sân đặt</th>
              <th className="px-6 py-4">Ngày đặt</th>
              <th className="px-6 py-4">Khung giờ</th>
              <th className="px-6 py-4">Tổng tiền</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Nguồn</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {bookingsData.length > 0 ? (
              bookingsData.map((b) => (
                <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{b.customer_name}</td>
                  <td className="px-6 py-4 text-slate-400">{b.customer_phone || '—'}</td>
                  <td className="px-6 py-4 font-medium text-slate-300">{getSubCourtName(b.court_id, b.sub_court_id)}</td>
                  <td className="px-6 py-4 text-slate-400">{b.date}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono">{b.start_time} - {b.end_time}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{(b.total_price || 0).toLocaleString('vi-VN')}₫</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                      b.status === 'confirmed' || b.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                        : b.status === 'cancelled'
                        ? 'bg-rose-500/10 text-rose-400 ring-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
                    }`}>
                      {b.status === 'confirmed' ? 'Đã xác nhận' : b.status === 'cancelled' ? 'Đã hủy' : b.status || 'Chờ thanh toán'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {b.source === 'app' ? '📱 App' : b.source === 'phone' ? '📞 Điện thoại' : '🚶 Trực tiếp'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDetailClick(b)}
                      className="rounded-lg bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-xs font-bold text-white transition"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                  Không có lịch đặt nào trong khoảng thời gian này
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN BOARD
   ═══════════════════════════════════════ */
type BookingViewMode = 'day' | 'week' | 'list';

export const OwnerBookingScheduleBoard: React.FC<{
  viewMode: BookingViewMode;
  currentDate: string;
  setCurrentDate: React.Dispatch<React.SetStateAction<string>>;
  courtsData: OwnerCourt[];
  bookingsData: OwnerBooking[];
  fetchScheduleData: () => Promise<void>;
}> = ({ viewMode, currentDate, setCurrentDate, courtsData, bookingsData, fetchScheduleData }) => {
  const [schedule, setSchedule] = useState<ScheduleState>([]);
  const [modal, setModal] = useState<ModalState>(CLOSED);

  // Synchronize courts and bookings into the schedule timeline layout
  useEffect(() => {
    const nextSchedule: ScheduleState = courtsData.map((court, i) => {
      const courtBookings = bookingsData.filter(b => b.court_id === court.id);
      const accent: BookingTone = ['blue', 'violet', 'emerald', 'slate'][i % 4] as BookingTone;
      
      return {
        name: court.name,
        location: court.location,
        accent,
        bookingCount: courtBookings.length,
        courts: court.sub_courts.map(sub => {
          const subBookings = courtBookings.filter(b => b.sub_court_id === sub._id);
          
          // Build bookingsByDay (for week view)
          const bookingsByDay: Record<number, (BookingBlock & { dayIndex: number })[]> = {};
          
          const current = new Date(currentDate);
          const day = current.getDay();
          const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(current.setDate(diffToMonday));

          for (let dIdx = 0; dIdx < 7; dIdx++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + dIdx);
            const dateStr = d.toISOString().split('T')[0];
            
            const dayBookings = subBookings.filter(b => b.date === dateStr);
            bookingsByDay[dIdx] = dayBookings.map(b => {
              const [sh, sm] = b.start_time.split(':').map(Number);
              const [eh, em] = b.end_time.split(':').map(Number);
              return {
                bookingId: b._id,
                customer: b.customer_name,
                startHour: sh + sm / 60,
                endHour: eh + em / 60,
                tone: (b.tone as BookingTone) || accent,
                note: b.note,
                dayIndex: dIdx,
              };
            });
          }

          return {
            id: sub._id,
            name: sub.name,
            capacity: `${sub.type} · ${sub.price_per_hour / 1000}K/giờ`,
            price: `${sub.price_per_hour / 1000}K`,
            open: sub.status === 'open',
            bookings: subBookings.filter(b => b.date === currentDate).map(b => {
              const [sh, sm] = b.start_time.split(':').map(Number);
              const [eh, em] = b.end_time.split(':').map(Number);
              return {
                bookingId: b._id,
                customer: b.customer_name,
                startHour: sh + sm / 60,
                endHour: eh + em / 60,
                tone: (b.tone as BookingTone) || accent,
                note: b.note,
              };
            }),
            bookingsByDay
          };
        })
      };
    });

    setSchedule(nextSchedule);
  }, [courtsData, bookingsData, currentDate]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day' || viewMode === 'list') {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day' || viewMode === 'list') {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const openEdit = useCallback((fIdx: number, cIdx: number, b: BookingBlock, bIdx: number) => {
    setModal({
      open: true, mode: 'view', bIdx,
      fIdx, cIdx,
      bookingId: (b as any).bookingId,
      initial: {
        facilityName: schedule[fIdx].name,
        courtName: schedule[fIdx].courts[cIdx].name,
        customer: b.customer, phone: '',
        startHour: b.startHour, endHour: b.endHour,
        tone: b.tone, note: b.note ?? '',
        status: 'confirmed', source: 'app',
      },
    });
  }, [schedule]);

  const openListDetail = useCallback((b: OwnerBooking) => {
    const court = courtsData.find(c => c.id === b.court_id);
    const facilityName = court?.name || '';
    const courtName = court?.sub_courts.find(sc => sc._id === b.sub_court_id)?.name || '';
    
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);

    setModal({
      open: true, mode: 'view', bIdx: 0, fIdx: 0, cIdx: 0,
      bookingId: b._id,
      initial: {
        facilityName,
        courtName,
        customer: b.customer_name,
        phone: b.customer_phone || '',
        startHour: sh + sm / 60,
        endHour: eh + em / 60,
        tone: (b.tone as BookingTone) || 'blue',
        note: b.note || '',
        status: b.status as any,
        source: b.source as any,
      }
    });
  }, [courtsData]);

  const openAdd = useCallback((fIdx: number, cIdx: number) => {
    setModal({
      open: true, mode: 'add', bIdx: null, fIdx, cIdx,
      initial: {
        facilityName: schedule[fIdx].name,
        courtName: schedule[fIdx].courts[cIdx].name,
        tone: schedule[fIdx].accent,
        status: 'confirmed', source: 'phone',
      },
    });
  }, [schedule]);

  const openGlobalAdd = () => setModal({
    open: true, mode: 'add', bIdx: null, fIdx: -1, cIdx: -1,
    initial: { source: 'phone', status: 'confirmed', tone: 'blue' },
  });

  const handleSave = useCallback(async (data: BookingModalData) => {
    try {
      const fIdx = modal.fIdx >= 0 ? modal.fIdx : schedule.findIndex(f => f.name === data.facilityName);
      if (fIdx < 0) return;
      const cIdx = modal.cIdx >= 0 ? modal.cIdx : schedule[fIdx].courts.findIndex((c: any) => c.name === data.courtName);
      if (cIdx < 0) return;

      const court = courtsData.find(c => c.name === data.facilityName);
      const subCourt = court?.sub_courts.find(sc => sc.name === data.courtName);

      if (!court || !subCourt) throw new Error('Không tìm thấy sân hợp lệ');

      // format start/end
      const sh = Math.floor(data.startHour).toString().padStart(2, '0');
      const sm = (data.startHour % 1) * 60 === 30 ? '30' : '00';
      const eh = Math.floor(data.endHour).toString().padStart(2, '0');
      const em = (data.endHour % 1) * 60 === 30 ? '30' : '00';

      if (modal.bIdx === null) {
        // Create new
        await createOwnerBooking({
          court_id: court.id,
          sub_court_id: subCourt._id!,
          date: currentDate,
          start_time: `${sh}:${sm}`,
          end_time: `${eh}:${em}`,
          customer_name: data.customer,
          customer_phone: data.phone,
          note: data.note,
          status: data.status,
          source: data.source,
          tone: data.tone
        });
      } else {
        // (Editing existing booking would go here if API exists)
      }

      await fetchScheduleData();
      setModal(CLOSED);
    } catch (error) {
      console.error('Lỗi khi lưu đặt sân:', error);
      alert('Lỗi: ' + (error instanceof Error ? error.message : ''));
    }
  }, [modal, schedule, courtsData, currentDate, fetchScheduleData]);

  // Format header title range
  const getHeaderTitle = () => {
    const current = new Date(currentDate);
    if (viewMode === 'day' || viewMode === 'list') {
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[current.getDay()];
      const dd = String(current.getDate()).padStart(2, '0');
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      return `${dayName}, ${dd}/${mm}/${current.getFullYear()}`;
    } else {
      const day = current.getDay();
      const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(current.setDate(diffToMonday));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const formatShort = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd} thg ${mm}`;
      };

      return `${formatShort(startOfWeek)} – ${formatShort(endOfWeek)}, ${startOfWeek.getFullYear()}`;
    }
  };

  const headerTitle = getHeaderTitle();
  const totalBookings = schedule.reduce((a, f) => a + f.bookingCount, 0);

  const facilities = schedule.map(f => f.name);
  const courts     = schedule.flatMap(f => f.courts.map((c: any) => c.name));

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07162f]/80 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]"
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] bg-[#0a1a38]/60 px-5 py-4">
          {/* Nav arrows + date */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 text-lg transition hover:border-white/20 hover:text-white"
            >‹</button>
            <div>
              <p className="text-base font-extrabold text-white">{headerTitle}</p>
              <p className="text-[11px] text-slate-500">
                {viewMode === 'day' 
                  ? `${schedule.reduce((acc, f) => acc + f.courts.reduce((ac: number, c: any) => ac + c.bookings.length, 0), 0)} lượt đặt hôm nay` 
                  : `${totalBookings} lượt đặt trong tuần`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 text-lg transition hover:border-white/20 hover:text-white"
            >›</button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {viewMode === 'day' && (
              <span className="hidden rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-600 sm:block">
                ← Kéo để xem thêm →
              </span>
            )}
            <button
              type="button"
              onClick={openGlobalAdd}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:from-blue-500 hover:to-violet-500"
              style={{ boxShadow: '0 8px 20px -10px rgba(99,102,241,0.7)' }}
            >
              <span className="text-base leading-none">＋</span>
              <span className="hidden sm:inline">Thêm lịch đặt</span>
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {viewMode === 'day' ? (
          <div className="overflow-x-auto overscroll-x-contain">
            <div style={{ width: WIDTH, minWidth: WIDTH }}>
              {/* Hour header */}
              <div
                className="grid sticky top-0 z-10 border-b border-white/[0.07] bg-[#0a1a38]/95 text-center text-[11px] font-semibold text-slate-600 backdrop-blur-sm"
                style={{ gridTemplateColumns: COL }}
              >
                <div className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-slate-600">Sân</div>
                {bookingHours.map(h => (
                  <div key={h} className="border-l border-white/[0.04] px-1 py-2.5">{fmt(h)}</div>
                ))}
              </div>

              {/* Facility rows */}
              {schedule.map((f, fIdx) => (
                <FacilitySection
                  key={f.name}
                  facility={f}
                  fIdx={fIdx}
                  onChipClick={openEdit}
                  onAddClick={openAdd}
                />
              ))}
            </div>
          </div>
        ) : viewMode === 'week' ? (
          <div className="p-4 sm:p-5">
            <WeekView currentDate={currentDate} schedule={schedule} />
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <ListView
              bookingsData={bookingsData}
              courtsData={courtsData}
              onDetailClick={openListDetail}
            />
          </div>
        )}
      </motion.section>

      {/* Modal drawer */}
      <OwnerBookingModal
        open={modal.open}
        mode={modal.mode}
        initialData={modal.initial}
        facilities={facilities}
        courts={courts}
        onClose={() => setModal(CLOSED)}
        onSave={handleSave}
      />
    </>
  );
};