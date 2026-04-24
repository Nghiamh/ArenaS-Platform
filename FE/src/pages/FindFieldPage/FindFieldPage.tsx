import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type FindFieldLocationState = {
  toastMessage?: string;
};

type SortOption = 'distanceAsc' | 'priceAsc' | 'priceDesc' | 'ratingDesc';

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'distanceAsc', label: 'Gần Nhất' },
  { value: 'priceAsc', label: 'Giá: Thấp Đến Cao' },
  { value: 'priceDesc', label: 'Giá: Cao Đến Thấp' },
  { value: 'ratingDesc', label: 'Đánh Giá Cao' },
];

const formatVnd = (priceK: number) => `${new Intl.NumberFormat('vi-VN').format(priceK * 1000)} VND`;
const formatVndInput = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

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
  'Bóng Đá': ['5 Người', '7 Người', 'Có Nhân Tạo', 'Trong Nhà', 'Có Chỗ Trống'],
  Tennis: ['Sân Cứng', 'Sân Đất Nện', 'Có Đèn', 'Trong Nhà', 'Có Chỗ Trống'],
  'Cầu Lông': ['Sàn Thảm', 'Sàn Gỗ', 'Có Máy Lạnh', 'Trong Nhà', 'Có Chỗ Trống'],
  Pickleball: ['Trong Nhà', 'Ngoài Trời', 'Có Huấn Luyện', 'Cho Thuê Vợt', 'Có Chỗ Trống'],
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
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
  Tennis: {
    'Sân Cứng': (venue) => venue.amenities.includes('Sân Cứng'),
    'Sân Đất Nện': (venue) => venue.amenities.includes('Sân Đất Nện'),
    'Có Đèn': (venue) => venue.amenities.includes('Có Đèn'),
    'Trong Nhà': (venue) => venue.indoor,
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
  'Cầu Lông': {
    'Sàn Thảm': (venue) => venue.amenities.includes('Sàn Thảm'),
    'Sàn Gỗ': (venue) => venue.amenities.includes('Sàn Gỗ'),
    'Có Máy Lạnh': (venue) => venue.amenities.includes('Có Máy Lạnh'),
    'Trong Nhà': (venue) => venue.indoor,
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
  Pickleball: {
    'Trong Nhà': (venue) => venue.indoor,
    'Ngoài Trời': (venue) => !venue.indoor,
    'Có Huấn Luyện': (venue) => venue.amenities.includes('Có Huấn Luyện'),
    'Cho Thuê Vợt': (venue) => venue.amenities.includes('Cho Thuê Vợt'),
    'Có Chỗ Trống': (venue) => venue.hasSlot,
  },
};

export const FindFieldPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [toastMessage, setToastMessage] = useState('');
  const [lastToastLocationKey, setLastToastLocationKey] = useState<string | null>(null);
  const [activeSport, setActiveSport] = useState<SportName>('Bóng Đá');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('distanceAsc');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(400);
  const [priceInputValue, setPriceInputValue] = useState<string>('400.000');
  const [selectedVenueId, setSelectedVenueId] = useState<number>(1);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [isExtraFilterOpen, setIsExtraFilterOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sportDropdownRef = useRef<HTMLDivElement | null>(null);
  const extraFilterRef = useRef<HTMLDivElement | null>(null);
  const sortDropdownRef = useRef<HTMLDivElement | null>(null);

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
    const sportParam = searchParams.get('sport');

    if (!sportParam || !sports.includes(sportParam as SportName)) {
      return;
    }

    setActiveSport(sportParam as SportName);
  }, [searchParams]);

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
    setSelectedFilters([]);
    setIsExtraFilterOpen(false);
  }, [activeSport]);

  const sportVenues = useMemo(() => venues.filter((venue) => venue.sport === activeSport), [activeSport]);
  const maxSportPrice = useMemo(
    () => Math.max(...sportVenues.map((venue) => venue.priceK), 100),
    [sportVenues],
  );
  const minSportPrice = useMemo(
    () => Math.min(...sportVenues.map((venue) => venue.priceK), 0),
    [sportVenues],
  );
  const quickFilters = useMemo(() => sportFilters[activeSport].slice(0, 3), [activeSport]);
  const extraFilters = useMemo(() => sportFilters[activeSport].slice(3), [activeSport]);
  const priceFillPercent = useMemo(() => {
    if (maxSportPrice === minSportPrice) {
      return 100;
    }

    return ((maxPriceFilter - minSportPrice) / (maxSportPrice - minSportPrice)) * 100;
  }, [maxPriceFilter, maxSportPrice, minSportPrice]);
  const selectedSortLabel = useMemo(
    () => sortOptions.find((option) => option.value === sortBy)?.label ?? 'Gần Nhất',
    [sortBy],
  );

  useEffect(() => {
    setMaxPriceFilter(maxSportPrice);
    setPriceInputValue(formatVndInput(maxSportPrice * 1000));
  }, [maxSportPrice]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((selectedFilter) => selectedFilter !== filter) : [...prev, filter],
    );
  };

  const filteredVenues = useMemo(() => {
    const byFilters = sportVenues.filter((venue) => {
      if (selectedFilters.length === 0) {
        return true;
      }

      return selectedFilters.every((filter) => {
        const filterPredicate = sportFilterPredicates[activeSport][filter];

        if (!filterPredicate) {
          return true;
        }

        return filterPredicate(venue);
      });
    });

    const byPrice = byFilters.filter((venue) => venue.priceK <= maxPriceFilter);

    return [...byPrice].sort((a, b) => {
      if (sortBy === 'priceAsc') {
        return a.priceK - b.priceK;
      }

      if (sortBy === 'priceDesc') {
        return b.priceK - a.priceK;
      }

      if (sortBy === 'ratingDesc') {
        return b.rating - a.rating;
      }

      return a.distanceKm - b.distanceKm;
    });
  }, [activeSport, maxPriceFilter, selectedFilters, sortBy, sportVenues]);

  const handlePriceSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setMaxPriceFilter(value);
    setPriceInputValue(formatVndInput(value * 1000));
  };

  const handlePriceInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/[^\d]/g, '');

    if (!nextValue) {
      setPriceInputValue('');
      return;
    }

    const numericValueInVnd = Number(nextValue);
    const numericValueInK = Math.round(numericValueInVnd / 1000);
    const clampedValue = Math.min(Math.max(numericValueInK, minSportPrice), maxSportPrice);
    setMaxPriceFilter(clampedValue);
    setPriceInputValue(formatVndInput(clampedValue * 1000));
  };

  const handlePriceInputBlur = () => {
    if (!priceInputValue) {
      setMaxPriceFilter(maxSportPrice);
      setPriceInputValue(formatVndInput(maxSportPrice * 1000));
      return;
    }

    const numericValueInVnd = Number(priceInputValue.replace(/[^\d]/g, ''));
    const numericValueInK = Math.round(numericValueInVnd / 1000);
    const clampedValue = Math.min(Math.max(numericValueInK, minSportPrice), maxSportPrice);
    setMaxPriceFilter(clampedValue);
    setPriceInputValue(formatVndInput(clampedValue * 1000));
  };

  useEffect(() => {
    const hasSelectedVenue = filteredVenues.some((venue) => venue.id === selectedVenueId);

    if (!hasSelectedVenue && filteredVenues.length > 0) {
      setSelectedVenueId(filteredVenues[0].id);
    }
  }, [filteredVenues, selectedVenueId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!sportDropdownRef.current?.contains(event.target as Node)) {
        setIsSportDropdownOpen(false);
      }

      if (!extraFilterRef.current?.contains(event.target as Node)) {
        setIsExtraFilterOpen(false);
      }

      if (!sortDropdownRef.current?.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <div ref={sportDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsSportDropdownOpen((prev) => !prev)}
                className="group flex h-12 w-full items-center justify-between rounded-xl border border-blue-400/45 bg-gradient-to-br from-slate-900/90 to-[#0b1838]/90 px-4 text-lg font-extrabold text-white outline-none transition hover:border-blue-300/70 focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300/40"
                aria-haspopup="listbox"
                aria-expanded={isSportDropdownOpen}
                aria-label="Chọn môn thể thao"
              >
                <span className="tracking-tight">{activeSport}</span>
                <motion.span
                  animate={{ rotate: isSportDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-blue-200"
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {isSportDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-[calc(100%+10px)] z-40 w-full overflow-hidden rounded-2xl border border-blue-300/35 bg-slate-900/95 p-1.5 shadow-[0_18px_44px_-22px_rgba(37,99,235,0.95)] backdrop-blur-xl"
                  >
                    <ul role="listbox" aria-label="Danh sách môn thể thao" className="space-y-1">
                      {sports.map((sport) => {
                        const isSelected = sport === activeSport;

                        return (
                          <li key={sport}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setActiveSport(sport);
                                setIsSportDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-lg font-bold transition ${
                                isSelected
                                  ? 'bg-blue-500/20 text-blue-100'
                                  : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                              }`}
                            >
                              <span>{sport}</span>
                              {isSelected && <span className="text-xs font-black uppercase tracking-wider text-blue-200">Đang chọn</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="arena-scroll flex gap-2 overflow-x-auto pb-1">
              {quickFilters.map((filter) => {
                const isActive = selectedFilters.includes(filter);

                return (
                  <button
                    key={filter}
                    onClick={() => toggleFilter(filter)}
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

              <div ref={extraFilterRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsExtraFilterOpen((prev) => !prev)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                    isExtraFilterOpen || selectedFilters.some((filter) => extraFilters.includes(filter))
                      ? 'border-blue-400/70 bg-blue-500/18 text-blue-100'
                      : 'border-white/10 bg-slate-900/75 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  Bộ Lọc Thêm {extraFilters.length > 0 ? `(${extraFilters.length})` : ''}
                </button>

                <AnimatePresence>
                  {isExtraFilterOpen && extraFilters.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-0 top-[calc(100%+8px)] z-40 min-w-[260px] rounded-2xl border border-white/12 bg-slate-900/95 p-2 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.9)] backdrop-blur"
                    >
                      <div className="flex flex-wrap gap-2">
                        {extraFilters.map((filter) => {
                          const isActive = selectedFilters.includes(filter);

                          return (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => toggleFilter(filter)}
                              className={`rounded-xl border px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                                isActive
                                  ? 'border-blue-400/75 bg-blue-500/20 text-blue-100'
                                  : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/25 hover:text-white'
                              }`}
                            >
                              {filter}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="rounded-2xl border border-blue-300/25 bg-gradient-to-br from-slate-900/92 to-[#0b1736]/90 px-3.5 py-2.5 shadow-[0_16px_34px_-24px_rgba(37,99,235,0.75)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Giá Tối Đa (VND)</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="range"
                    min={minSportPrice}
                    max={maxSportPrice}
                    step={10}
                    value={maxPriceFilter}
                    onChange={handlePriceSliderChange}
                    className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-slate-600/40 accent-blue-500"
                    style={{
                      background: `linear-gradient(90deg, rgba(59,130,246,0.95) ${priceFillPercent}%, rgba(100,116,139,0.35) ${priceFillPercent}%)`,
                    }}
                    aria-label="Lọc giá tối đa"
                  />
                  <div className="flex items-center rounded-xl border border-blue-300/25 bg-slate-950/85 px-2 py-1 shadow-inner shadow-blue-400/10">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={priceInputValue}
                      onChange={handlePriceInputChange}
                      onBlur={handlePriceInputBlur}
                      className="w-[92px] bg-transparent text-right text-[0.95rem] font-bold tracking-tight text-slate-100 outline-none"
                      aria-label="Nhập giá tối đa"
                    />
                    <span className="ml-1 text-[11px] font-black uppercase tracking-[0.12em] text-blue-200">VND</span>
                  </div>
                </div>
              </div>

              {selectedFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilters([])}
                  className="rounded-xl border border-rose-300/40 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-200/70 hover:bg-rose-500/25"
                >
                  Xóa lựa chọn ({selectedFilters.length})
                </button>
              )}

              <div ref={sortDropdownRef} className="relative">
                <div className="rounded-2xl border border-blue-300/25 bg-gradient-to-br from-slate-900/92 to-[#0b1736]/90 px-3.5 py-2.5 shadow-[0_16px_34px_-24px_rgba(37,99,235,0.75)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sắp Xếp</p>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                    className="mt-1.5 flex min-w-[170px] items-center justify-between rounded-xl border border-blue-300/35 bg-slate-950/80 px-3 py-2 text-sm font-bold text-white transition hover:border-blue-300/60"
                    aria-haspopup="listbox"
                    aria-expanded={isSortDropdownOpen}
                    aria-label="Sắp xếp sân"
                  >
                    <span>{selectedSortLabel}</span>
                    <motion.span
                      animate={{ rotate: isSortDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-[10px] text-blue-200"
                    >
                      ▼
                    </motion.span>
                  </button>
                </div>

                <AnimatePresence>
                  {isSortDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[220px] rounded-2xl border border-blue-300/25 bg-slate-900/95 p-1.5 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.9)] backdrop-blur"
                    >
                      <ul role="listbox" aria-label="Các tuỳ chọn sắp xếp" className="space-y-1">
                        {sortOptions.map((option) => {
                          const isSelected = option.value === sortBy;

                          return (
                            <li key={option.value}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSortBy(option.value);
                                  setIsSortDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                                  isSelected
                                    ? 'bg-blue-500/20 text-blue-100'
                                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                                }`}
                              >
                                <span>{option.label}</span>
                                {isSelected && (
                                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Đang chọn</span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
                            <p className="text-[2.2rem] font-black leading-none text-blue-400">
                              {new Intl.NumberFormat('vi-VN').format(venue.priceK * 1000)}
                            </p>
                            <p className="text-base text-slate-400">VND/giờ</p>
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
                      className={`relative block rounded-full px-3 py-2 text-sm font-black leading-none text-white ${
                        isSelected ? 'bg-blue-600' : 'bg-slate-600/90'
                      }`}
                    >
                      {formatVnd(venue.priceK)}
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
                  <p className="mt-1 text-base font-semibold text-slate-600">{formatVnd(selectedVenue.priceK)} /giờ</p>
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
