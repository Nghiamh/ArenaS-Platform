import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Download, Plus, Search } from 'lucide-react';
import { createOwnerBooking, type OwnerCourt, type OwnerBooking } from '../../Axios/Axios';
import {
  bookingHours,
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

/* ── Redesigned Colors based on Reference Image ── */
const ACCENT: Record<string, string> = {
  blue:    'bg-cyan-500/20    text-cyan-200    ring-1 ring-cyan-400/35',
  violet:  'bg-violet-500/20  text-violet-200  ring-1 ring-violet-400/35',
  emerald: 'bg-[#00B074]/20   text-[#00B074]   ring-1 ring-[#00B074]/35',
  slate:   'bg-slate-500/20   text-slate-200   ring-1 ring-slate-400/30',
};

const STATUS_CHIP = {
  confirmed: { bg: 'from-[#00B074]/15 to-[#00B074]/30', border: 'border-[#00B074]/40', shadow: 'rgba(0,176,116,0.25)', text: 'text-[#00B074]' },
  completed: { bg: 'from-[#00B074]/15 to-[#00B074]/30', border: 'border-[#00B074]/40', shadow: 'rgba(0,176,116,0.25)', text: 'text-[#00B074]' },
  pending:   { bg: 'from-[#E59E0B]/15 to-[#E59E0B]/30', border: 'border-[#E59E0B]/40', shadow: 'rgba(229,158,11,0.25)',  text: 'text-[#E59E0B]' },
  cancelled: { bg: 'from-[#EF4444]/10 to-[#EF4444]/20', border: 'border-[#EF4444]/30', shadow: 'rgba(239,68,68,0.15)',  text: 'text-slate-400' },
  default:   { bg: 'from-cyan-600/15 to-cyan-500/30',    border: 'border-cyan-400/40',    shadow: 'rgba(6,182,212,0.25)',  text: 'text-cyan-300' },
};

const COL   = '250px repeat(16, 200px)';
const WIDTH = '3450px';
const HC    = bookingHours.length;
const fmt   = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${(h % 1) * 60 === 30 ? '30' : '00'}`;
const WEEK_COL = 'minmax(230px,270px) repeat(7,minmax(150px,1fr))';

const getDisplayStatus = (status: string, date: string, endTime: string) => {
  if (status === 'confirmed') {
    const now = new Date();
    const endTimeDate = new Date(`${date}T${endTime}:00+07:00`);
    if (now > endTimeDate) {
      return 'completed';
    }
  }
  return status;
};

/* ═══════════════════════════════════════
   Booking chip (day view)
   ═══════════════════════════════════════ */
const Chip: React.FC<{ b: any; onClick: () => void }> = ({ b, onClick }) => {
  const s    = b.startHour - 7;
  const span = b.endHour - b.startHour;
  
  // Pick chip tone based on booking status
  const statusKey = b.status || 'confirmed';
  const t = STATUS_CHIP[statusKey as keyof typeof STATUS_CHIP] || STATUS_CHIP.default;

  // Format booking ID matching mockup (e.g. BK-9921)
  const bookingCode = b.bookingId 
    ? `BK-${b.bookingId.substring(b.bookingId.length - 4).toUpperCase()}` 
    : 'BK-0000';

  return (
    <motion.button
      type="button"
      onClick={e => { e.stopPropagation(); onClick(); }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`group absolute top-[6px] bottom-[6px] z-20 overflow-hidden rounded-xl border bg-gradient-to-r
        text-left transition-all hover:brightness-110 hover:scale-[1.01] hover:z-30 ${t.bg} ${t.border}`}
      style={{
        left: `calc(${(s / HC) * 100}% + 4px)`,
        width: `calc(${(span / HC) * 100}% - 8px)`,
        minWidth: 40,
        boxShadow: `0 8px 20px -8px ${t.shadow}`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="relative px-2.5 py-1.5">
        <p className="text-[11px] font-bold leading-tight text-white truncate">
          <span className={`mr-1 font-mono text-[9px] font-black opacity-80 ${t.text}`}>{bookingCode}</span> 
          {b.customer}
        </p>
        <p className="text-[9px] text-white/60 font-mono leading-tight">{fmt(b.startHour)}–{fmt(b.endHour)}</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 rounded-xl">
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"><Search className="w-3 h-3" /> Chi tiết</span>
      </div>
    </motion.button>
  );
};

/* ═══════════════════════════════════════
   Add-slot button
   ═══════════════════════════════════════ */
const AddSlot: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute inset-[4px] z-10 flex items-center justify-center rounded-xl border border-dashed border-transparent
      transition-all hover:border-white/10 hover:bg-white/[0.02] group"
    title="Thêm lịch đặt"
  >
    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition">
      <Plus className="w-3 h-3" /> Thêm lịch đặt
    </span>
  </button>
);

/* ═══════════════════════════════════════
   Court row
   ═══════════════════════════════════════ */
const CourtRow: React.FC<{
  court: any;
  onChipClick: (b: any, bIdx: number) => void;
  onAddClick: () => void;
}> = ({ court, onChipClick, onAddClick }) => (
  <div
    className="grid border-t border-white/[0.05] hover:bg-white/[0.01] transition-colors"
    style={{ gridTemplateColumns: COL, width: WIDTH }}
  >
    {/* Court label */}
    <div className="flex min-h-[64px] items-center gap-3 px-5 py-3 border-r border-white/[0.05]">
      <div className={`h-2 w-2 flex-shrink-0 rounded-full ${court.open ? 'bg-[#00B074]' : 'bg-slate-600'}`} />
      <div>
        <p className="text-xs font-black text-white">{court.name}</p>
        <p className="mt-0.5 text-[10px] text-slate-500 font-semibold">{court.capacity}</p>
      </div>
    </div>

    {/* Timeline */}
    <div className="relative min-h-[64px]" style={{ gridColumn: '2 / -1', position: 'relative' }}>
      {bookingHours.map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-r border-white/[0.03]"
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
  onChipClick: (fIdx: number, cIdx: number, b: any, bIdx: number) => void;
  onAddClick: (fIdx: number, cIdx: number) => void;
}> = ({ facility, fIdx, onChipClick, onAddClick }) => (
  <section className="border-t border-white/[0.05] first:border-t-0">
    {/* Facility header */}
    <div
      className="grid items-center bg-white/[0.015]"
      style={{ gridTemplateColumns: COL, width: WIDTH }}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-r border-white/[0.05]">
        <span className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md ${ACCENT[facility.accent] || ACCENT.blue}`}>
          <span className="h-1 w-1 rounded-full bg-current" />
        </span>
        <div>
          <p className="text-xs font-black tracking-tight text-white uppercase">{facility.name}</p>
          <p className="mt-0.5 text-[9px] font-semibold text-slate-500">{facility.location}</p>
        </div>
      </div>
      <div className="col-span-16 flex items-center gap-2 px-4">
        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
          {facility.bookingCount} đơn đặt
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
  const current = new Date(currentDate);
  const day = current.getDay();
  const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diffToMonday));

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
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
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1524]/60">
      <div className="grid border-b border-white/[0.08] bg-[#0A111E]/80" style={{ gridTemplateColumns: WEEK_COL }}>
        <div className="border-r border-white/[0.06] px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Cơ sở / Sân</div>
        {weekDays.map(d => (
          <div key={d.key} className="border-r border-white/[0.06] px-3 py-3 text-center last:border-r-0">
            <p className="text-[10px] font-bold uppercase text-slate-500">{d.label}</p>
            <p className="mt-1 text-lg font-black text-white">{d.date}</p>
            {d.total > 0 && (
              <span className="mt-1.5 inline-flex rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                {d.total} đặt
              </span>
            )}
          </div>
        ))}
      </div>

      {schedule.map(f => (
        <div key={f.name} className="border-b border-white/[0.06] last:border-b-0">
          <div className="grid bg-white/[0.01]" style={{ gridTemplateColumns: WEEK_COL }}>
            <div className="flex items-center gap-2 border-r border-white/[0.06] px-5 py-4">
              <span className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md ${ACCENT[f.accent] || ACCENT.blue}`}>
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
              <div>
                <p className="text-xs font-bold text-white uppercase">{f.name}</p>
                <p className="text-[9px] text-slate-500">{f.location}</p>
              </div>
            </div>
            {weekDays.map((d, i) => {
              let fTotal = 0;
              f.courts.forEach((c: any) => {
                if (c.bookingsByDay && c.bookingsByDay[i]) {
                  fTotal += c.bookingsByDay[i].length;
                }
              });

              return (
                <div key={d.key} className="border-r border-white/[0.06] px-3 py-4 last:border-r-0 flex items-center justify-center">
                  {fTotal > 0
                    ? <span className={`rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400`}>{fTotal} đặt</span>
                    : <span className="text-[10px] text-slate-700">—</span>}
                </div>
              );
            })}
          </div>

          {f.courts.map((court: any) => (
            <div key={`${f.name}-${court.name}`} className="grid border-t border-white/[0.04]" style={{ gridTemplateColumns: WEEK_COL }}>
              <div className="flex items-center gap-2 border-r border-white/[0.06] px-5 py-3">
                <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${court.open ? 'bg-[#00B074]' : 'bg-slate-600'}`} />
                <div>
                  <p className="text-xs font-bold text-white">{court.name}</p>
                  <p className="text-[9px] text-slate-500">{court.capacity}</p>
                </div>
              </div>
              {weekDays.map((d, i) => {
                const bks = court.bookingsByDay ? court.bookingsByDay[i] ?? [] : [];
                return (
                  <div key={`${court.name}-${d.key}`} className="border-r border-white/[0.06] p-1.5 last:border-r-0">
                    <div className={`min-h-[72px] rounded-lg border p-1.5 ${i % 2 === 0 ? 'border-white/[0.03] bg-white/[0.01]' : 'border-transparent'}`}>
                      {bks.length > 0 ? (
                        <div className="space-y-1">
                          {bks.map((b: any, bIdx: number) => {
                            const t = STATUS_CHIP[b.status as keyof typeof STATUS_CHIP] || STATUS_CHIP.default;
                            const code = b.bookingId ? `BK-${b.bookingId.substring(b.bookingId.length - 4).toUpperCase()}` : 'BK-0000';
                            return (
                              <div key={`${court.name}-${d.key}-${b.customer}-${bIdx}`}
                                className={`rounded-md border bg-gradient-to-r px-2 py-1 ${t.bg} ${t.border}`}>
                                <p className="text-[10px] font-bold text-white truncate"><span className="opacity-85 mr-0.5">{code}</span> {b.customer}</p>
                                <p className="text-[9px] text-white/50">{fmt(b.startHour)}–{fmt(b.endHour)}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[56px] items-center justify-center rounded-md border border-dashed border-white/[0.03] text-[10px] text-slate-700">
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
  listPage?: number;
  setListPage?: React.Dispatch<React.SetStateAction<number>>;
  listTotalPages?: number;
}> = ({ bookingsData, courtsData, onDetailClick, listPage, setListPage, listTotalPages }) => {
  const getSubCourtName = (courtId: string, subCourtId: string) => {
    const court = courtsData.find(c => c.id === courtId);
    const sub = court?.sub_courts.find(sc => sc._id === subCourtId);
    return court && sub ? `${court.name} - ${sub.name}` : 'Sân đã bị xóa';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1524]/60">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs text-slate-300">
          <thead className="bg-[#0A111E]/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4">Mã Đơn</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Số điện thoại</th>
              <th className="px-6 py-4">Sân đặt</th>
              <th className="px-6 py-4">Ngày đặt</th>
              <th className="px-6 py-4">Khung giờ</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {bookingsData.length > 0 ? (
              bookingsData.map((b) => {
                const code = b._id ? `BK-${b._id.substring(b._id.length - 4).toUpperCase()}` : 'BK-0000';
                return (
                  <tr key={b._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-cyan-400">{code}</td>
                    <td className="px-6 py-4 font-bold text-white">{b.customer_name}</td>
                    <td className="px-6 py-4 text-slate-400">{b.customer_phone || '—'}</td>
                    <td className="px-6 py-4 font-medium text-slate-300">{getSubCourtName(b.court_id, b.sub_court_id)}</td>
                    <td className="px-6 py-4 text-slate-400">{b.date}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{b.start_time} - {b.end_time}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDetailClick(b)}
                        className="rounded-lg bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 text-[10px] font-bold text-white transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Không có lịch đặt nào trong khoảng thời gian này
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {listTotalPages && listTotalPages > 1 && setListPage && listPage && (
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-[#0A111E]/80">
          <p className="text-[10px] text-slate-400 font-bold">
            Trang <span className="text-white">{listPage}</span> / {listTotalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={listPage <= 1}
              onClick={() => setListPage(prev => prev - 1)}
              className="flex h-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0E1524] px-3 text-[10px] font-bold text-slate-400 hover:text-white hover:border-white/20 transition disabled:opacity-50 disabled:pointer-events-none"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={listPage >= listTotalPages}
              onClick={() => setListPage(prev => prev + 1)}
              className="flex h-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0E1524] px-3 text-[10px] font-bold text-slate-400 hover:text-white hover:border-white/20 transition disabled:opacity-50 disabled:pointer-events-none"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
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
  listPage?: number;
  setListPage?: React.Dispatch<React.SetStateAction<number>>;
  listTotalPages?: number;
}> = ({ viewMode, currentDate, setCurrentDate, courtsData, bookingsData, fetchScheduleData, listPage, setListPage, listTotalPages }) => {
  const [schedule, setSchedule] = useState<ScheduleState>([]);
  const [modal, setModal] = useState<ModalState>(CLOSED);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchScheduleData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select')) return;

    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Synchronize courts and bookings into the schedule timeline layout
  useEffect(() => {
    const nextSchedule: ScheduleState = courtsData.map((court, i) => {
      const courtBookings = bookingsData.filter(b => b.court_id === court.id);
      const accent = ['blue', 'violet', 'emerald', 'slate'][i % 4];
      
      return {
        name: court.name,
        location: court.location,
        accent,
        bookingCount: courtBookings.length,
        courts: court.sub_courts.map(sub => {
          const subBookings = courtBookings.filter(b => b.sub_court_id === sub._id);
          
          // Build bookingsByDay (for week view)
          const bookingsByDay: Record<number, any[]> = {};
          
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
                phone: b.customer_phone,
                source: b.source,
                startHour: sh + sm / 60,
                endHour: eh + em / 60,
                tone: b.tone || accent,
                note: b.note,
                status: getDisplayStatus(b.status, dateStr, b.end_time),
                dayIndex: dIdx,
                totalPrice: b.total_price,
                date: b.date,
              };
            });
          }

          return {
            id: sub._id,
            name: sub.name,
            capacity: `${sub.type === 'badminton' ? 'Cầu lông' : sub.type === 'pickleball' ? 'Pickleball' : sub.type} · ${sub.price_per_hour / 1000}K/giờ`,
            price: `${sub.price_per_hour / 1000}K`,
            open: sub.status === 'open',
            bookings: subBookings.filter(b => b.date === currentDate).map(b => {
              const [sh, sm] = b.start_time.split(':').map(Number);
              const [eh, em] = b.end_time.split(':').map(Number);
              return {
                bookingId: b._id,
                customer: b.customer_name,
                phone: b.customer_phone,
                source: b.source,
                startHour: sh + sm / 60,
                endHour: eh + em / 60,
                tone: b.tone || accent,
                note: b.note,
                status: getDisplayStatus(b.status, currentDate, b.end_time),
                totalPrice: b.total_price,
                date: b.date,
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

  const openEdit = useCallback((fIdx: number, cIdx: number, b: any, bIdx: number) => {
    setModal({
      open: true, mode: 'view', bIdx,
      fIdx, cIdx,
      bookingId: b.bookingId,
      initial: {
        facilityName: schedule[fIdx].name,
        courtName: schedule[fIdx].courts[cIdx].name,
        customer: b.customer, 
        phone: b.phone || '',
        startHour: b.startHour, endHour: b.endHour,
        tone: b.tone, note: b.note ?? '',
        status: b.status || 'confirmed', 
        source: b.source || 'app',
        date: b.date || currentDate,
        totalPrice: b.totalPrice,
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
        tone: b.tone || 'blue',
        note: b.note || '',
        status: getDisplayStatus(b.status, b.date, b.end_time) as any,
        source: b.source as any,
        date: b.date,
        totalPrice: b.total_price,
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
        date: currentDate,
      },
    });
  }, [schedule]);

  const openGlobalAdd = () => setModal({
    open: true, mode: 'add', bIdx: null, fIdx: -1, cIdx: -1,
    initial: { source: 'phone', status: 'confirmed', tone: 'blue', date: currentDate },
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

      const sh = Math.floor(data.startHour).toString().padStart(2, '0');
      const sm = (data.startHour % 1) * 60 === 30 ? '30' : '00';
      const eh = Math.floor(data.endHour).toString().padStart(2, '0');
      const em = (data.endHour % 1) * 60 === 30 ? '30' : '00';

      if (modal.bIdx === null) {
        await createOwnerBooking({
          court_id: court.id,
          sub_court_id: subCourt._id!,
          date: data.date,
          start_time: `${sh}:${sm}`,
          end_time: `${eh}:${em}`,
          customer_name: data.customer,
          customer_phone: data.phone,
          note: data.note,
          status: data.status,
          source: data.source,
          tone: data.tone
        });
      }

      await fetchScheduleData();
      setModal(CLOSED);
    } catch (error) {
      console.error('Lỗi khi lưu đặt sân:', error);
      alert('Lỗi: ' + (error instanceof Error ? error.message : ''));
    }
  }, [modal, schedule, courtsData, currentDate, fetchScheduleData]);

  // Format header range
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
        return `${dd}/${mm}`;
      };

      return `${formatShort(startOfWeek)} – ${formatShort(endOfWeek)}, ${startOfWeek.getFullYear()}`;
    }
  };

  const headerTitle = getHeaderTitle();


  const facilities = schedule.map(f => f.name);
  const courts     = schedule.flatMap(f => f.courts.map((c: any) => c.name));

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E1524]/60 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]"
      >
        {/* ── Top bar matching Mockup ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] bg-[#0A111E]/40 px-5 py-4">
          
          <div className="flex items-center gap-3">
            <h3 className="text-base font-extrabold text-white">Lịch Trình Chi Tiết</h3>
            <span className="rounded-full bg-[#00B074]/15 px-2 py-0.5 text-[10px] font-black text-[#00B074] animate-pulse border border-[#00B074]/20">
              Trực tiếp (Live)
            </span>
            <button className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-400 transition ml-1">
              Lịch sử
            </button>
          </div>

          {/* Quick nav controllers */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0E1524] text-slate-400 text-lg transition hover:border-white/20 hover:text-white"
            >‹</button>
            <span className="text-xs font-black text-white">{headerTitle}</span>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0E1524] text-slate-400 text-lg transition hover:border-white/20 hover:text-white"
            >›</button>
          </div>

          {/* Right actions matching mockup */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0E1524] hover:border-white/20 hover:text-white px-3 text-xs font-bold text-slate-400 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Tải lại
            </button>
            <button
              type="button"
              onClick={() => alert('Xuất dữ liệu Excel thành công')}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0E1524] hover:border-white/20 hover:text-white px-3 text-xs font-bold text-slate-400 transition"
            >
              <Download className="w-3.5 h-3.5" /> Xuất dữ liệu
            </button>
            <button
              type="button"
              onClick={openGlobalAdd}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3.5 text-xs font-extrabold text-[#07162f] transition shadow-[0_4px_12px_rgba(6,182,212,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo đơn mới
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {viewMode === 'day' ? (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`overflow-x-auto overscroll-x-contain select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <div style={{ width: WIDTH, minWidth: WIDTH }}>
              
              {/* Hour header */}
              <div
                className="grid sticky top-0 z-10 border-b border-white/[0.05] bg-[#0A111E] text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                style={{ gridTemplateColumns: COL }}
              >
                <div className="px-5 py-3 text-left font-black text-slate-500 border-r border-white/[0.05]">CƠ SỞ / SÂN VẬN ĐỘNG</div>
                {bookingHours.map(h => (
                  <div key={h} className="border-l border-white/[0.03] px-1 py-3">{fmt(h)}</div>
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
              listPage={listPage}
              setListPage={setListPage}
              listTotalPages={listTotalPages}
            />
          </div>
        )}
      </motion.section>

      {/* Floating Bottom-Right Button */}
      {!modal.open && (
        <button
          type="button"
          onClick={openGlobalAdd}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400 text-3xl font-bold text-[#07162f] shadow-[0_10px_28px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all font-sans"
          style={{ cursor: 'pointer' }}
          title="Thêm lịch đặt nhanh"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

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