import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

type FindFieldLocationState = {
  toastMessage?: string;
};

type SportName = 'Bóng Đá' | 'Tennis' | 'Cầu Lông' | 'Pickleball';

type Venue = {
  id: number;
  sport: SportName;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  priceK: number;
  tag: string;
  formatLabel: string;
  slots: string[];
  amenities: string[];
  indoor: boolean;
  hasSlot: boolean;
  x: number;
  y: number;
};

const sports: SportName[] = ['Bóng Đá', 'Tennis', 'Cầu Lông', 'Pickleball'];

const sportFilters: Record<SportName, string[]> = {
  'Bóng Đá': ['5 Người', '7 Người', 'Có Nhân Tạo', 'Trong Nhà', 'Dưới 400K', 'Có Chỗ Trống'],
  Tennis: ['Sân Cứng', 'Sân Đất Nện', 'Có Đèn', 'Trong Nhà', 'Dưới 350K', 'Có Chỗ Trống'],
  'Cầu Lông': ['Sàn Thảm', 'Sàn Gỗ', 'Có Máy Lạnh', 'Trong Nhà', 'Dưới 200K', 'Có Chỗ Trống'],
  Pickleball: ['Trong Nhà', 'Ngoài Trời', 'Có Huấn Luyện', 'Cho Thuê Vợt', 'Dưới 300K', 'Có Chỗ Trống'],
};

const venues: Venue[] = [
  {
    id: 1,
    sport: 'Bóng Đá',
    name: 'Champions Arena',
    image:
      'https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 187,
    distanceKm: 1.2,
    priceK: 360,
    tag: 'Đang Chọn',
    formatLabel: '7 Người',
    slots: ['17:00', '18:00', '19:00', '20:00'],
    amenities: ['Có Nhân Tạo', 'Bãi Đỗ Xe', 'Phòng Tắm', 'Căn Tin', 'Phòng Thay Đồ'],
    indoor: false,
    hasSlot: true,
    x: 45,
    y: 41,
  },
  {
    id: 2,
    sport: 'Bóng Đá',
    name: 'Elite Football Complex',
    image:
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop',
    rating: 4.7,
    reviews: 142,
    distanceKm: 2.3,
    priceK: 280,
    tag: 'Phổ Biến',
    formatLabel: '5 Người',
    slots: ['16:00', '17:00', '18:00', '19:00'],
    amenities: ['Có Nhân Tạo', 'Bãi Đỗ Xe', 'Phòng Tắm', 'Căn Tin'],
    indoor: false,
    hasSlot: true,
    x: 58,
    y: 52,
  },
  {
    id: 3,
    sport: 'Bóng Đá',
    name: 'Northside Arena',
    image:
      'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 201,
    distanceKm: 3.1,
    priceK: 400,
    tag: 'Trong Nhà',
    formatLabel: '7 Người',
    slots: ['18:00', '20:00', '21:00'],
    amenities: ['Trong Nhà', 'Phòng Tắm', 'Điều Hòa', 'Khu Chờ'],
    indoor: true,
    hasSlot: true,
    x: 33,
    y: 36,
  },
  {
    id: 11,
    sport: 'Tennis',
    name: 'Blue Sky Tennis Club',
    image:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 223,
    distanceKm: 1.1,
    priceK: 320,
    tag: 'Giờ Vàng',
    formatLabel: 'Sân Cứng',
    slots: ['06:00', '08:00', '17:00', '19:00'],
    amenities: ['Sân Cứng', 'Có Đèn', 'Phòng Tắm', 'Thuê Vợt'],
    indoor: false,
    hasSlot: true,
    x: 49,
    y: 37,
  },
  {
    id: 12,
    sport: 'Tennis',
    name: 'Clay Court Hub',
    image:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
    rating: 4.6,
    reviews: 119,
    distanceKm: 2.6,
    priceK: 340,
    tag: 'Đất Nện',
    formatLabel: 'Sân Đất Nện',
    slots: ['07:00', '09:00', '16:00', '18:00'],
    amenities: ['Sân Đất Nện', 'Có Đèn', 'Căn Tin'],
    indoor: false,
    hasSlot: true,
    x: 64,
    y: 46,
  },
  {
    id: 13,
    sport: 'Tennis',
    name: 'Indoor Ace Court',
    image:
      'https://images.unsplash.com/photo-1595435742656-5272d0b3fa95?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 176,
    distanceKm: 3.3,
    priceK: 350,
    tag: 'Premium',
    formatLabel: 'Trong Nhà',
    slots: ['10:00', '14:00', '18:00', '20:00'],
    amenities: ['Trong Nhà', 'Sân Cứng', 'Điều Hòa', 'Có Đèn'],
    indoor: true,
    hasSlot: true,
    x: 38,
    y: 60,
  },
  {
    id: 21,
    sport: 'Cầu Lông',
    name: 'Shuttle Pro Arena',
    image:
      'https://images.unsplash.com/photo-1613918431703-aa508f0f9dc8?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 265,
    distanceKm: 0.9,
    priceK: 170,
    tag: 'Hot',
    formatLabel: 'Sàn Thảm',
    slots: ['17:00', '18:00', '19:00', '20:00'],
    amenities: ['Sàn Thảm', 'Có Máy Lạnh', 'Bãi Xe'],
    indoor: true,
    hasSlot: true,
    x: 46,
    y: 40,
  },
  {
    id: 22,
    sport: 'Cầu Lông',
    name: 'Feather Club House',
    image:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop',
    rating: 4.7,
    reviews: 150,
    distanceKm: 2.1,
    priceK: 190,
    tag: 'Sạch Đẹp',
    formatLabel: 'Sàn Gỗ',
    slots: ['16:00', '17:30', '19:00'],
    amenities: ['Sàn Gỗ', 'Có Máy Lạnh', 'Nước Uống'],
    indoor: true,
    hasSlot: true,
    x: 59,
    y: 50,
  },
  {
    id: 23,
    sport: 'Cầu Lông',
    name: 'Urban Smash Center',
    image:
      'https://images.unsplash.com/photo-1634522238509-d8b308fb5d12?q=80&w=1200&auto=format&fit=crop',
    rating: 4.6,
    reviews: 104,
    distanceKm: 3.5,
    priceK: 140,
    tag: 'Tiết Kiệm',
    formatLabel: 'Theo Giờ',
    slots: ['15:00', '17:00', '21:00'],
    amenities: ['Sàn Thảm', 'Theo Giờ', 'Phòng Tắm'],
    indoor: false,
    hasSlot: true,
    x: 35,
    y: 57,
  },
  {
    id: 31,
    sport: 'Pickleball',
    name: 'Pickle Prime Court',
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 128,
    distanceKm: 1.7,
    priceK: 260,
    tag: 'Mới',
    formatLabel: 'Ngoài Trời',
    slots: ['06:30', '08:00', '17:30'],
    amenities: ['Ngoài Trời', 'Cho Thuê Vợt', 'Căng Tin'],
    indoor: false,
    hasSlot: true,
    x: 48,
    y: 39,
  },
  {
    id: 32,
    sport: 'Pickleball',
    name: 'Indoor Pickle Hub',
    image:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 210,
    distanceKm: 2.4,
    priceK: 290,
    tag: 'Được Yêu Thích',
    formatLabel: 'Trong Nhà',
    slots: ['09:00', '13:00', '18:00'],
    amenities: ['Trong Nhà', 'Cho Thuê Vợt', 'Có Huấn Luyện'],
    indoor: true,
    hasSlot: true,
    x: 57,
    y: 55,
  },
  {
    id: 33,
    sport: 'Pickleball',
    name: 'Arena Pickle Studio',
    image:
      'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1200&auto=format&fit=crop',
    rating: 4.7,
    reviews: 98,
    distanceKm: 3.0,
    priceK: 300,
    tag: 'Huấn Luyện',
    formatLabel: 'Có Huấn Luyện',
    slots: ['10:00', '16:00', '19:00'],
    amenities: ['Có Huấn Luyện', 'Cho Thuê Vợt', 'Trong Nhà'],
    indoor: true,
    hasSlot: true,
    x: 39,
    y: 63,
  },
];

const sportFilterPredicates: Record<SportName, Record<string, (venue: Venue) => boolean>> = {
  'Bóng Đá': {
    '5 Người': (venue) => venue.formatLabel === '5 Người',
    '7 Người': (venue) => venue.formatLabel === '7 Người',
    'Có Nhân Tạo': (venue) => venue.amenities.includes('Có Nhân Tạo'),
    'Trong Nhà': (venue) => venue.indoor,
    'Dưới 400K': (venue) => venue.priceK < 400,
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
  Tennis: {
    'Sân Cứng': (venue) => venue.amenities.includes('Sân Cứng'),
    'Sân Đất Nện': (venue) => venue.amenities.includes('Sân Đất Nện'),
    'Có Đèn': (venue) => venue.amenities.includes('Có Đèn'),
    'Trong Nhà': (venue) => venue.indoor,
    'Dưới 350K': (venue) => venue.priceK < 350,
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
  'Cầu Lông': {
    'Sàn Thảm': (venue) => venue.amenities.includes('Sàn Thảm'),
    'Sàn Gỗ': (venue) => venue.amenities.includes('Sàn Gỗ'),
    'Có Máy Lạnh': (venue) => venue.amenities.includes('Có Máy Lạnh'),
    'Trong Nhà': (venue) => venue.indoor,
    'Dưới 200K': (venue) => venue.priceK < 200,
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
  Pickleball: {
    'Trong Nhà': (venue) => venue.indoor,
    'Ngoài Trời': (venue) => !venue.indoor,
    'Có Huấn Luyện': (venue) => venue.amenities.includes('Có Huấn Luyện'),
    'Cho Thuê Vợt': (venue) => venue.amenities.includes('Cho Thuê Vợt'),
    'Dưới 300K': (venue) => venue.priceK < 300,
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
};

export const FindFieldPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [toastMessage, setToastMessage] = useState('');
  const [lastToastLocationKey, setLastToastLocationKey] = useState<string | null>(null);
  const [activeSport, setActiveSport] = useState<SportName>('Bóng Đá');
  const [activeFilter, setActiveFilter] = useState<string>(sportFilters['Bóng Đá'][0]);
  const [selectedVenueId, setSelectedVenueId] = useState<number>(1);

  useEffect(() => {
    const state = location.state as FindFieldLocationState | null;

    if (!state?.toastMessage || lastToastLocationKey === location.key) {
      return;
    }

    setToastMessage(state.toastMessage);
    setLastToastLocationKey(location.key);
    navigate(location.pathname, { replace: true, state: null });
  }, [lastToastLocationKey, location.key, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToastMessage('');
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    setActiveFilter(sportFilters[activeSport][0]);
  }, [activeSport]);

  const sportVenues = useMemo(() => venues.filter((venue) => venue.sport === activeSport), [activeSport]);

  const filteredVenues = useMemo(() => {
    const filterPredicate = sportFilterPredicates[activeSport][activeFilter];

    if (!filterPredicate) {
      return sportVenues;
    }

    return sportVenues.filter(filterPredicate);
  }, [activeFilter, activeSport, sportVenues]);

  useEffect(() => {
    const hasSelectedVenue = filteredVenues.some((venue) => venue.id === selectedVenueId);

    if (!hasSelectedVenue && filteredVenues.length > 0) {
      setSelectedVenueId(filteredVenues[0].id);
    }
  }, [filteredVenues, selectedVenueId]);

  const selectedVenue = filteredVenues.find((venue) => venue.id === selectedVenueId) ?? filteredVenues[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(37,99,235,0.24),transparent_30%),radial-gradient(circle_at_95%_15%,rgba(56,189,248,0.18),transparent_26%),linear-gradient(180deg,#020617_0%,#020b1d_45%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-35" />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed right-4 top-24 z-[90] rounded-2xl border border-emerald-300/40 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-[0_16px_42px_-20px_rgba(16,185,129,0.9)] backdrop-blur md:right-8"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 mx-auto max-w-[1500px] px-4 pb-4 pt-5 md:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:w-[360px]">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Môn Thể Thao</label>
            <select
              value={activeSport}
              onChange={(event) => setActiveSport(event.target.value as SportName)}
              className="h-12 rounded-xl border border-blue-400/45 bg-slate-900/80 px-4 text-lg font-bold text-white outline-none transition focus:border-blue-300"
            >
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="arena-scroll flex gap-2 overflow-x-auto pb-1">
              {sportFilters[activeSport].map((filter) => {
                const isActive = filter === activeFilter;

                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'border-blue-400/75 bg-blue-500/20 text-blue-100 shadow-[0_10px_26px_-18px_rgba(59,130,246,0.95)]'
                        : 'border-white/10 bg-slate-900/75 text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-white/10 bg-slate-900/75 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/25 hover:text-white">
                Bộ Lọc Thêm
              </button>
              <button className="rounded-xl border border-white/10 bg-slate-900/75 px-4 py-2 text-sm font-semibold text-slate-100">
                Sắp Xếp: Gần Nhất
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto grid max-w-[1500px] gap-4 px-4 pb-8 md:px-6 lg:grid-cols-[1.16fr_0.84fr]">
        <section className="min-h-[680px] overflow-hidden rounded-[24px] border border-blue-400/25 bg-slate-950/70 shadow-[0_26px_80px_-40px_rgba(2,6,23,0.95)] backdrop-blur">
          <div className="border-b border-white/10 px-4 py-4 md:px-5">
            <h2 className="text-3xl font-black tracking-tight text-white">Sân {activeSport.toLowerCase()}</h2>
            <p className="mt-1 text-sm text-blue-200/85">Sắp xếp theo khoảng cách · TP. Hồ Chí Minh</p>
          </div>

          <div className="arena-scroll max-h-[650px] space-y-3 overflow-y-auto px-3 py-3 md:px-4">
            <AnimatePresence mode="popLayout">
              {filteredVenues.map((venue, index) => {
                const isSelected = selectedVenue?.id === venue.id;

                return (
                  <motion.article
                    layout
                    key={venue.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 18 }}
                    transition={{ delay: index * 0.03, duration: 0.28 }}
                    onMouseEnter={() => setSelectedVenueId(venue.id)}
                    className={`rounded-[20px] border bg-[#081128]/96 p-2.5 transition ${
                      isSelected
                        ? 'border-blue-500 shadow-[0_22px_44px_-26px_rgba(59,130,246,0.95)]'
                        : 'border-white/10 hover:border-blue-400/45'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row">
                      <div className="relative h-44 overflow-hidden rounded-2xl md:h-auto md:w-[235px] md:min-w-[235px]">
                        <img
                          src={venue.image}
                          alt={venue.name}
                          className="h-full w-full object-cover transition duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                          {venue.formatLabel}
                        </span>
                        <span className="absolute right-2 top-2 rounded-full bg-blue-500/90 px-3 py-1 text-xs font-bold text-white">
                          {venue.tag}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 px-1 py-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-3xl font-black leading-tight text-white">{venue.name}</h3>
                            <p className="mt-1 text-base text-slate-300">
                              ⭐ {venue.rating.toFixed(1)} ({venue.reviews}) · {venue.distanceKm.toFixed(1)} km
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-slate-400">từ</p>
                            <p className="text-[2.2rem] font-black leading-none text-blue-400">{venue.priceK}K</p>
                            <p className="text-base text-slate-400">/giờ</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {venue.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full border border-white/12 bg-slate-900/85 px-3 py-1 text-sm text-slate-200"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-300">Còn Trống Hôm Nay</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {venue.slots.map((slot) => (
                                <span
                                  key={slot}
                                  className="rounded-xl border border-blue-400/25 bg-slate-900/70 px-3 py-1 text-sm text-slate-300"
                                >
                                  {slot}
                                </span>
                              ))}
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-7 text-base font-black text-white shadow-[0_12px_34px_-20px_rgba(59,130,246,0.98)]"
                          >
                            Đặt Ngay
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>

            {filteredVenues.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center">
                <p className="text-lg font-bold text-white">Không có sân phù hợp với bộ lọc hiện tại</p>
                <p className="mt-2 text-sm text-slate-300">Thử đổi sang bộ lọc khác để xem thêm kết quả.</p>
              </div>
            )}
          </div>
        </section>

        <section className="relative min-h-[680px] overflow-hidden rounded-[24px] border border-blue-400/25 bg-slate-950/75 shadow-[0_26px_80px_-40px_rgba(2,6,23,0.95)] backdrop-blur lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-5">
            <h3 className="text-[2rem] font-black leading-none text-white">Bản Đồ Trực Tiếp</h3>
            <span className="text-sm font-semibold text-blue-300">{filteredVenues.length} sân</span>
          </div>

          <div className="relative h-[620px] overflow-hidden p-3 md:p-4">
            <div className="arena-map-bg relative h-full w-full overflow-hidden rounded-2xl border border-white/10">
              <div className="pointer-events-none absolute left-[8%] top-[38%] h-[2px] w-[84%] bg-blue-500/40" />
              <div className="pointer-events-none absolute left-[10%] top-[66%] h-[2px] w-[80%] bg-blue-500/35" />
              <div className="pointer-events-none absolute left-[50%] top-[8%] h-[84%] w-[2px] bg-blue-500/35" />

              <div className="pointer-events-none absolute left-[18%] top-[18%] h-[120px] w-[84px] rounded-xl border border-white/10 bg-white/5" />
              <div className="pointer-events-none absolute left-[24%] top-[44%] h-[150px] w-[96px] rounded-xl border border-white/10 bg-white/5" />
              <div className="pointer-events-none absolute left-[57%] top-[56%] h-[130px] w-[208px] rounded-xl border border-emerald-300/30 bg-emerald-500/16" />

              {filteredVenues.map((venue) => {
                const isSelected = selectedVenue?.id === venue.id;

                return (
                  <motion.button
                    key={venue.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: isSelected ? 1.06 : 1 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => setSelectedVenueId(venue.id)}
                    style={{ left: `${venue.x}%`, top: `${venue.y}%` }}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <motion.span
                      animate={{ boxShadow: ['0 0 0 0 rgba(59,130,246,0.42)', '0 0 0 12px rgba(59,130,246,0)'] }}
                      transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.25 }}
                      className={`absolute inset-0 rounded-full ${isSelected ? 'opacity-100' : 'opacity-50'}`}
                    />
                    <span
                      className={`relative block rounded-full px-4 py-2 text-base font-black leading-none text-white ${
                        isSelected ? 'bg-blue-600' : 'bg-slate-600/90'
                      }`}
                    >
                      {venue.priceK}K /giờ
                    </span>
                  </motion.button>
                );
              })}

              {selectedVenue && (
                <motion.div
                  key={selectedVenue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-[50%] top-[29%] min-w-[228px] -translate-x-1/2 rounded-2xl border border-slate-300/55 bg-white px-4 py-3 text-slate-900 shadow-xl"
                >
                  <p className="text-2xl font-black leading-tight">{selectedVenue.name}</p>
                  <p className="mt-1 text-base font-semibold text-slate-600">{selectedVenue.priceK}K /giờ</p>
                </motion.div>
              )}

              <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <span className="h-3 w-3 rounded-full bg-slate-500" /> Còn Trống
                </span>
                <span className="inline-flex items-center gap-2 text-blue-200">
                  <span className="h-3 w-3 rounded-full bg-blue-500" /> Đang Chọn
                </span>
              </div>

              <div className="absolute right-3 top-3 flex flex-col gap-2">
                <button className="h-10 w-10 rounded-xl border border-white/15 bg-slate-900/80 text-xl font-bold text-white transition hover:border-white/30">
                  +
                </button>
                <button className="h-10 w-10 rounded-xl border border-white/15 bg-slate-900/80 text-xl font-bold text-white transition hover:border-white/30">
                  -
                </button>
              </div>

              <button className="absolute bottom-4 right-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_12px_30px_-18px_rgba(59,130,246,0.95)] transition hover:brightness-110">
                Vị Trí Của Tôi
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
