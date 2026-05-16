import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerCourts, getOwnerBookings, createOwnerBooking, type OwnerCourt, type OwnerBooking } from '../../Axios/Axios';
import {
  bookingHours,
  bookingScheduleFacilities,
  bookingWeekDays,
  bookingWeekScheduleFacilities,
  type BookingTone,
  type BookingBlock,
  type FacilitySchedule,
} from './ownerBookingScheduleMockData';
import { OwnerBookingModal, type BookingModalData, type ModalMode } from './OwnerBookingModal';

/* ── Types ── */
type ScheduleState = FacilitySchedule[];
type ModalState = {
  open: boolean; mode: ModalMode; initial: Partial<BookingModalData>;
  fIdx: number; cIdx: number; bIdx: number | null;
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
const fmt   = (h: number) => `${String(h).padStart(2, '0')}:00`;
const WEEK_COL = 'minmax(210px,250px) repeat(7,minmax(150px,1fr))';

/* ═══════════════════════════════════════
   Booking chip (day view)
═══════════════════════════════════════ */
const Chip: React.FC<{ b: BookingBlock; onClick: () => void }> = ({ b, onClick }) => {
  const s    = b.startHour - 7;
  const span = Math.max(1, b.endHour - b.startHour);
  const t    = TONE_CHIP[b.tone];

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
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">✏ Sửa</span>
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
  court: FacilitySchedule['courts'][number];
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
      {court.bookings.map((b, bIdx) => (
        <Chip key={`${court.name}-${b.customer}-${b.startHour}`} b={b} onClick={() => onChipClick(b, bIdx)} />
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════
   Facility section
═══════════════════════════════════════ */
const FacilitySection: React.FC<{
  facility: FacilitySchedule;
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
        <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg ${ACCENT[facility.accent]}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        <div>
          <p className="text-sm font-extrabold leading-tight text-white">{facility.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{facility.location}</p>
        </div>
      </div>
      <div className="col-span-16 flex items-center gap-2 px-4">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ACCENT[facility.accent]}`}>
          {facility.bookingCount} lượt đặt
        </span>
      </div>
    </div>

    {facility.courts.map((court, cIdx) => (
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
const WeekView: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07162f]/80">
    {/* Header */}
    <div className="grid border-b border-white/[0.08] bg-[#0a1a38]/80" style={{ gridTemplateColumns: WEEK_COL }}>
      <div className="border-r border-white/[0.06] px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-600">Cơ sở / Sân</div>
      {bookingWeekDays.map(d => (
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

    {bookingWeekScheduleFacilities.map(f => (
      <div key={f.name} className="border-b border-white/[0.06] last:border-b-0">
        {/* Facility header */}
        <div className="grid bg-white/[0.02]" style={{ gridTemplateColumns: WEEK_COL }}>
          <div className="flex items-center gap-2.5 border-r border-white/[0.06] px-5 py-4">
            <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg ${ACCENT[f.accent]}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-white">{f.name}</p>
              <p className="text-[11px] text-slate-500">{f.location}</p>
            </div>
          </div>
          {bookingWeekDays.map(d => (
            <div key={d.key} className="border-r border-white/[0.06] px-3 py-4 last:border-r-0 flex items-center justify-center">
              {d.total > 0
                ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ACCENT[f.accent]}`}>{d.total} đặt</span>
                : <span className="text-[11px] text-slate-700">—</span>}
            </div>
          ))}
        </div>

        {f.courts.map(court => (
          <div key={`${f.name}-${court.name}`} className="grid border-t border-white/[0.05]" style={{ gridTemplateColumns: WEEK_COL }}>
            <div className="flex items-center gap-2.5 border-r border-white/[0.06] px-5 py-3">
              <div className={`h-2 w-2 flex-shrink-0 rounded-full ${court.open ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <div>
                <p className="text-sm font-bold text-white">{court.name}</p>
                <p className="text-[11px] text-slate-500">{court.capacity} · {court.price}</p>
              </div>
            </div>
            {bookingWeekDays.map((d, i) => {
              const bks = court.bookingsByDay[i] ?? [];
              return (
                <div key={`${court.name}-${d.key}`} className="border-r border-white/[0.06] p-2 last:border-r-0">
                  <div className={`min-h-[72px] rounded-xl border p-2 ${i % 2 === 0 ? 'border-white/[0.05] bg-white/[0.02]' : 'border-transparent'}`}>
                    {bks.length > 0 ? (
                      <div className="space-y-1.5">
                        {bks.map(b => (
                          <div key={`${court.name}-${d.key}-${b.customer}`}
                            className={`rounded-lg border bg-gradient-to-r px-2.5 py-1.5 ${TONE_CHIP[b.tone].bg} ${TONE_CHIP[b.tone].border}`}>
                            <p className="text-[12px] font-bold text-white truncate">{b.customer}</p>
                            <p className="text-[10px] text-white/70">{fmt(b.startHour)}–{fmt(b.endHour)}</p>
                          </div>
                        ))}
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

/* ═══════════════════════════════════════
   MAIN BOARD
═══════════════════════════════════════ */
type BookingViewMode = 'day' | 'week';

export const OwnerBookingScheduleBoard: React.FC<{ viewMode: BookingViewMode }> = ({ viewMode }) => {
  const [schedule, setSchedule] = useState<ScheduleState>([]);
  const [ownerCourts, setOwnerCourts] = useState<OwnerCourt[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [modal, setModal] = useState<ModalState>(CLOSED);

  const fetchScheduleData = useCallback(async () => {
    try {
      const [courtsData, bookingsData] = await Promise.all([
        getOwnerCourts(),
        getOwnerBookings({ startDate: currentDate, endDate: currentDate }) // only day view for now
      ]);

      setOwnerCourts(courtsData);

      // Parse to ScheduleState
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
            return {
              id: sub._id,
              name: sub.name,
              capacity: `${sub.type} · ${sub.price_per_hour / 1000}K/giờ`,
              price: `${sub.price_per_hour / 1000}K`,
              open: sub.status === 'open',
              bookings: subBookings.map(b => {
                const [sh, sm] = b.start_time.split(':').map(Number);
                const [eh, em] = b.end_time.split(':').map(Number);
                return {
                  bookingId: b._id,
                  customer: b.customer_name,
                  startHour: sh + sm / 60,
                  endHour: eh + em / 60,
                  tone: b.tone as BookingTone || accent,
                  note: b.note,
                };
              })
            };
          })
        };
      });

      setSchedule(nextSchedule);
    } catch (error) {
      console.error('Failed to fetch schedule data:', error);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const facilities = schedule.map(f => f.name);
  const courts     = schedule.flatMap(f => f.courts.map(c => c.name));

  const openEdit = useCallback((fIdx: number, cIdx: number, b: BookingBlock, bIdx: number) => {
    setModal({
      open: true, mode: 'view', bIdx,
      fIdx, cIdx,
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
      const cIdx = modal.cIdx >= 0 ? modal.cIdx : schedule[fIdx].courts.findIndex(c => c.name === data.courtName);
      if (cIdx < 0) return;

      const court = ownerCourts.find(c => c.name === data.facilityName);
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
  }, [modal, schedule, ownerCourts, currentDate, fetchScheduleData]);

  const handleDelete = useCallback(() => {
    if (modal.fIdx < 0 || modal.cIdx < 0 || modal.bIdx === null) return;
    setSchedule(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as ScheduleState;
      next[modal.fIdx].courts[modal.cIdx].bookings.splice(modal.bIdx!, 1);
      next[modal.fIdx].bookingCount = Math.max(0, next[modal.fIdx].bookingCount - 1);
      return next;
    });
    setModal(CLOSED);
  }, [modal]);

  const headerTitle = viewMode === 'day' ? 'Thứ Hai, 02/03/2026' : '02 thg 3 – 08 thg 3, 2026';
  const totalBookings = schedule.reduce((a, f) => a + f.bookingCount, 0);

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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 text-lg transition hover:border-white/20 hover:text-white"
            >‹</button>
            <div>
              <p className="text-base font-extrabold text-white">{headerTitle}</p>
              <p className="text-[11px] text-slate-500">{totalBookings} lượt đặt · {viewMode === 'day' ? 'hôm nay' : 'tuần này'}</p>
            </div>
            <button
              type="button"
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
        ) : (
          <div className="p-4 sm:p-5">
            <WeekView />
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
        onDelete={modal.bIdx !== null ? handleDelete : undefined}
      />
    </>
  );
};