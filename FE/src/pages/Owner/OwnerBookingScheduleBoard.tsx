import React from 'react';
import { motion } from 'framer-motion';
import {
  bookingHours,
  bookingScheduleFacilities,
  bookingWeekDays,
  bookingWeekScheduleFacilities,
  type BookingTone,
  type FacilitySchedule,
} from './ownerBookingScheduleMockData';

const facilityAccentClass: Record<BookingTone, string> = {
  blue: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/35',
  violet: 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/35',
  emerald: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/35',
  slate: 'bg-slate-500/20 text-slate-200 ring-1 ring-slate-400/30',
};

const bookingToneClass: Record<BookingTone, string> = {
  blue: 'border-blue-400/45 bg-gradient-to-r from-blue-600/95 via-blue-500/75 to-blue-500/45 text-white shadow-[0_18px_28px_-20px_rgba(37,99,235,0.95)]',
  violet: 'border-violet-400/45 bg-gradient-to-r from-violet-600/95 via-violet-500/75 to-violet-500/45 text-white shadow-[0_18px_28px_-20px_rgba(139,92,246,0.95)]',
  emerald: 'border-emerald-400/45 bg-gradient-to-r from-emerald-600/95 via-emerald-500/75 to-emerald-500/45 text-white shadow-[0_18px_28px_-20px_rgba(16,185,129,0.95)]',
  slate: 'border-slate-400/45 bg-gradient-to-r from-slate-600/95 via-slate-500/75 to-slate-500/45 text-white shadow-[0_18px_28px_-20px_rgba(100,116,139,0.95)]',
};

const dayTimelineColumns = '250px repeat(16, 120px)';
const dayTimelineWidth = '2170px';
const hourCount = bookingHours.length;

const facilityBadgeText = (count: number) => `${count} lượt đặt`;

type BookingViewMode = 'day' | 'week';

const formatHourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

const BookingBlock: React.FC<{
  booking: FacilitySchedule['courts'][number]['bookings'][number];
}> = ({ booking }) => {
  const start = booking.startHour - 7;
  const end = booking.endHour - 7;
  const span = Math.max(1, end - start);
  const left = (start / hourCount) * 100;
  const width = (span / hourCount) * 100;
  const minWidth = Math.max(span * 92, 92);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute top-2 bottom-2 z-20 min-w-[92px] overflow-visible rounded-2xl border px-4 py-2.5 ${bookingToneClass[booking.tone]}`}
      style={{ left: `${left}%`, width: `${width}%`, minWidth: `${minWidth}px` }}
    >
      <p className="text-sm font-extrabold leading-tight whitespace-normal break-words">{booking.customer}</p>
      <p className="mt-0.5 text-[11px] font-medium text-white/80">{booking.note ?? `${formatHourLabel(booking.startHour)} - ${formatHourLabel(booking.endHour)}`}</p>
    </motion.div>
  );
};

const CourtRow: React.FC<{
  court: FacilitySchedule['courts'][number];
}> = ({ court }) => {
  return (
    <div className="grid border-t border-white/[0.08]" style={{ gridTemplateColumns: dayTimelineColumns, width: dayTimelineWidth }}>
      <div className="flex min-h-[68px] items-center gap-3 px-5 py-4">
        <span className={`h-2.5 w-2.5 rounded-full ${court.open ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        <div>
          <p className="text-[1rem] font-extrabold leading-tight text-white">{court.name}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">{court.capacity}</p>
        </div>
      </div>

      <div className="relative min-h-[68px] overflow-visible">
        {court.bookings.map((booking) => (
          <BookingBlock key={`${court.name}-${booking.customer}-${booking.startHour}`} booking={booking} />
        ))}
      </div>
    </div>
  );
};

const FacilitySection: React.FC<{ facility: FacilitySchedule }> = ({ facility }) => {
  return (
    <section className="border-t border-white/[0.08] first:border-t-0">
      <div className="grid items-center bg-white/[0.03] px-4 py-3 sm:px-5" style={{ gridTemplateColumns: dayTimelineColumns, width: dayTimelineWidth }}>
        <div className="flex items-center gap-3 pr-4">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-lg ${facilityAccentClass[facility.accent]}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
          </span>
          <div>
            <h2 className="text-[1rem] font-extrabold leading-tight text-white">{facility.name}</h2>
            <p className="mt-1 text-xs font-medium text-slate-400">{facility.location}</p>
          </div>
        </div>

        <div className="col-span-16 flex items-center justify-end">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${facilityAccentClass[facility.accent]}`}>{facilityBadgeText(facility.bookingCount)}</span>
        </div>
      </div>

      {facility.courts.map((court) => (
        <CourtRow key={`${facility.name}-${court.name}`} court={court} />
      ))}
    </section>
  );
};

const weekTimelineColumns = 'minmax(220px, 260px) repeat(7, minmax(170px, 1fr))';

const WeekBookingCell: React.FC<{ booking: string; time: string; tone: BookingTone }> = ({ booking, time, tone }) => (
  <div className={`rounded-2xl border px-3 py-2 ${bookingToneClass[tone]}`}>
    <p className="text-sm font-extrabold leading-tight text-white">{booking}</p>
    <p className="mt-1 text-xs font-medium text-white/80">{time}</p>
  </div>
);

const WeekView: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07162f]/90">
            <div className="grid border-b border-white/10 bg-[#0d1d3f]/90" style={{ gridTemplateColumns: weekTimelineColumns }}>
        <div className="border-r border-white/[0.08] px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Cơ sở</div>
        {bookingWeekDays.map((day) => (
          <div key={day.key} className="border-r border-white/[0.08] px-4 py-4 text-center last:border-r-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{day.label}</p>
            <p className="mt-1 text-lg font-black text-white">{day.date}</p>
            <span className="mt-2 inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-[11px] font-bold text-blue-200 ring-1 ring-blue-400/35">
              {day.total} lượt
            </span>
          </div>
        ))}
      </div>

      {bookingWeekScheduleFacilities.map((facility) => (
        <div key={facility.name} className="border-b border-white/[0.08] last:border-b-0">
          <div className="grid bg-white/[0.03]" style={{ gridTemplateColumns: weekTimelineColumns }}>
            <div className="flex items-center gap-3 border-r border-white/[0.08] px-5 py-5">
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-lg ${facilityAccentClass[facility.accent]}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
            </span>
            <div>
              <p className="text-[1rem] font-extrabold leading-tight text-white">{facility.name}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{facility.location}</p>
            </div>
            </div>

            {bookingWeekDays.map((day, index) => (
              <div key={`${facility.name}-${day.key}`} className="border-r border-white/[0.08] px-3 py-3 last:border-r-0">
                <div className={`flex min-h-[72px] items-center justify-center rounded-2xl border px-3 py-3 ${index % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.02]'}`}>
                  {day.total > 0 ? (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${facilityAccentClass[facility.accent]}`}>
                      {day.total} đặt
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {facility.courts.map((court) => (
            <div key={`${facility.name}-${court.name}`} className="grid border-t border-white/[0.08]" style={{ gridTemplateColumns: weekTimelineColumns }}>
              <div className="flex items-center gap-3 border-r border-white/[0.08] px-5 py-4">
                <span className={`h-2.5 w-2.5 rounded-full ${court.open ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <div>
                  <p className="text-[1rem] font-extrabold leading-tight text-white">{court.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">{court.capacity} · {court.price}</p>
                </div>
              </div>

              {bookingWeekDays.map((day, index) => {
                const dayBookings = court.bookingsByDay[index] ?? [];

                return (
                  <div key={`${court.name}-${day.key}`} className="border-r border-white/[0.08] px-3 py-3 last:border-r-0">
                    <div className={`min-h-[84px] rounded-2xl border px-3 py-3 ${index % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.02]'}`}>
                      <div className="space-y-2">
                        {dayBookings.length > 0 ? (
                          dayBookings.map((booking) => (
                            <WeekBookingCell
                              key={`${court.name}-${day.key}-${booking.customer}`}
                              booking={booking.customer}
                              time={`${formatHourLabel(booking.startHour)} - ${formatHourLabel(booking.endHour)}`}
                              tone={booking.tone}
                            />
                          ))
                        ) : (
                          <div className="flex min-h-[56px] items-center justify-center rounded-2xl border border-dashed border-white/[0.06] text-xs text-slate-600">
                            Trống
                          </div>
                        )}
                      </div>
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

type OwnerBookingScheduleBoardProps = {
  viewMode: BookingViewMode;
};

export const OwnerBookingScheduleBoard: React.FC<OwnerBookingScheduleBoardProps> = ({ viewMode }) => {
  const activeViewTitle = viewMode === 'day' ? 'Ngày' : 'Tuần';
  const headerTitle = viewMode === 'day' ? 'Thứ Hai, 02/03/2026' : '02 thg 3 - 08 thg 3, 2026';
  const headerBadge = viewMode === 'day' ? 'Hôm nay' : 'Tuần này';

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[30px] border border-white/10 bg-[#081734]/90 shadow-[0_28px_70px_-34px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
        <button
          type="button"
          aria-label="Xem ngày trước"
          className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <span className="text-xl leading-none">‹</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-[1.65rem]">{headerTitle}</h2>
          <span className="mt-2 inline-flex rounded-full bg-blue-600/25 px-3 py-1 text-xs font-bold text-blue-200">{headerBadge}</span>
        </div>

        <button
          type="button"
          aria-label="Xem ngày sau"
          className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <span className="text-xl leading-none">›</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          {activeViewTitle} xem
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-400">
          Kéo ngang để xem thêm nội dung
        </div>
      </div>

      {viewMode === 'day' ? (
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="w-max min-w-[2170px]">
            <div className="grid border-b border-white/10 bg-[#0d1d3f]/90 text-center text-xs font-bold text-slate-500" style={{ gridTemplateColumns: dayTimelineColumns, width: dayTimelineWidth }}>
                    <div className="px-5 py-3 text-left uppercase tracking-[0.2em]">Khung sân</div>
              {bookingHours.map((hour) => (
                <div key={hour} className="px-2 py-3">
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {bookingScheduleFacilities.map((facility) => (
              <FacilitySection key={facility.name} facility={facility} />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <WeekView />
        </div>
      )}
    </motion.section>
  );
};