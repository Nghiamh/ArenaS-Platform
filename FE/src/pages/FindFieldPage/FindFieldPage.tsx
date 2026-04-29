import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getPublicCourts, type PublicCourt } from '../../Axios/Axios';
import { CourtMap } from '../../components/CourtMap';

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

const formatVndInput = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

type SportName = 'Bóng Đá' | 'Tennis' | 'Cầu Lông' | 'Pickleball';

type Venue = {
  id: string;
  sport: SportName;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  priceK: number;
  locationText: string;
  tag: string;
  formatLabel: string;
  slots: string[];
  amenities: string[];
  indoor: boolean;
  hasSlot: boolean;
  x: number;
  y: number;
};

const defaultCourtImage =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop';

const defaultSports: SportName[] = ['Bóng Đá', 'Tennis', 'Cầu Lông', 'Pickleball'];

type UserCoordinates = {
  latitude: number;
  longitude: number;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const computeDistanceKm = (from: UserCoordinates, to: UserCoordinates) => {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const normalizeLocationText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const locationAliases: Record<string, string[]> = {
  'tp thu duc': ['tp thu duc', 'thu duc', 'quan 9', 'q9', 'quan 2', 'q2'],
  'thu duc': ['thu duc', 'tp thu duc', 'quan 9', 'q9', 'quan 2', 'q2'],
  'quan 9': ['quan 9', 'q9', 'thu duc', 'tp thu duc'],
  q9: ['q9', 'quan 9', 'thu duc', 'tp thu duc'],
  'quan 2': ['quan 2', 'q2', 'thu duc', 'tp thu duc'],
  q2: ['q2', 'quan 2', 'thu duc', 'tp thu duc'],
};

const matchLocation = (venueLocation: string, selectedLocation: string) => {
  const normalizedSelected = normalizeLocationText(selectedLocation);

  if (!normalizedSelected || normalizedSelected === 'gan day') {
    return true;
  }

  const normalizedVenue = normalizeLocationText(venueLocation);

  if (!normalizedVenue) {
    return false;
  }

  const matchedAlias = Object.keys(locationAliases).find((key) => normalizedSelected.includes(key));
  const tokens = matchedAlias ? locationAliases[matchedAlias] : [normalizedSelected];

  return tokens.some((token) => normalizedVenue.includes(token));
};

const pickSportCategory = (sports: string[]): SportName => {
  for (const sport of sports) {
    const normalized = sport.toLowerCase();

    if (normalized.includes('bóng') || normalized.includes('football') || normalized.includes('futsal')) {
      return 'Bóng Đá';
    }

    if (normalized.includes('tennis')) {
      return 'Tennis';
    }

    if (normalized.includes('cầu lông') || normalized.includes('badminton')) {
      return 'Cầu Lông';
    }

    if (normalized.includes('pickle')) {
      return 'Pickleball';
    }
  }

  return 'Bóng Đá';
};

const hashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const hashToPercent = (value: string, min: number, max: number): number => {
  const range = max - min;
  const normalized = (hashString(value) % 1000) / 1000;
  return min + normalized * range;
};

const buildVenue = (court: PublicCourt, userCoordinates: UserCoordinates | null): Venue => {
  const sportCategory = pickSportCategory(court.sports ?? []);
  const pricePerHour = Number.isFinite(court.price_per_hour) ? court.price_per_hour : 0;
  const priceK = Math.max(Math.round(pricePerHour / 1000), 0);
  const coordinates = court.coordinates ? { ...court.coordinates } : null;
  const distanceKm =
    userCoordinates && coordinates ? computeDistanceKm(userCoordinates, coordinates) : 0;
  const rating = Number.isFinite(court.avg_rating) ? court.avg_rating : 0;
  const primarySport = court.sports?.[0]?.trim() || 'Môn thể thao';
  const amenities = court.amenities ?? [];
  const locationText = court.location?.trim() || '';
  const indoor = amenities.some((amenity) => /trong nha|indoor/i.test(amenity));
  const isAvailable = court.status === 'available' || court.status === 'open';

  return {
    id: court.id,
    sport: sportCategory,
    name: court.name,
    image: court.images?.[0]?.trim() || defaultCourtImage,
    rating,
    reviews: 0,
    distanceKm,
    priceK,
    locationText,
    tag: isAvailable ? 'Đang mở' : 'Tạm đóng',
    formatLabel: primarySport,
    slots: [],
    amenities,
    indoor,
    hasSlot: isAvailable,
    x: hashToPercent(court.id, 18, 82),
    y: hashToPercent(`${court.id}-y`, 18, 82),
  };
};

const sportFilters: Record<SportName, string[]> = {
  'Bóng Đá': ['5 Người', '7 Người', 'Có Nhân Tạo', 'Trong Nhà', 'Có Chỗ Trống'],
  Tennis: ['Sân Cứng', 'Sân Đất Nện', 'Có Đèn', 'Trong Nhà', 'Có Chỗ Trống'],
  'Cầu Lông': ['Sàn Thảm', 'Sàn Gỗ', 'Có Máy Lạnh', 'Trong Nhà', 'Có Chỗ Trống'],
  Pickleball: ['Trong Nhà', 'Ngoài Trời', 'Có Huấn Luyện', 'Cho Thuê Vợt', 'Có Chỗ Trống'],
};

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
  const [courts, setCourts] = useState<PublicCourt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);
  const [activeSport, setActiveSport] = useState<SportName>(defaultSports[0]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('distanceAsc');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(400);
  const [priceInputValue, setPriceInputValue] = useState<string>('400.000');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
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
    let isMounted = true;

    const loadCourts = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await getPublicCourts();

        if (isMounted) {
          setCourts(data);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu sân.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCourts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 },
    );
  }, []);

  const venues = useMemo(
    () => courts.map((court) => buildVenue(court, userCoordinates)),
    [courts, userCoordinates],
  );

  const selectedLocation = searchParams.get('location') ?? 'Gần đây';

  const availableSports = useMemo(() => {
    const uniqueSports = new Set<SportName>();

    venues.forEach((venue) => {
      uniqueSports.add(venue.sport);
    });

    return uniqueSports.size > 0 ? Array.from(uniqueSports) : defaultSports;
  }, [venues]);

  useEffect(() => {
    const sportParam = searchParams.get('sport');

    if (!sportParam) {
      return;
    }

    const matchedSport = availableSports.find(
      (sport) => sport.toLowerCase() === sportParam.toLowerCase(),
    );

    if (matchedSport) {
      setActiveSport(matchedSport);
    }
  }, [availableSports, searchParams]);

  useEffect(() => {
    if (!availableSports.includes(activeSport)) {
      setActiveSport(availableSports[0]);
    }
  }, [activeSport, availableSports]);

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

  const sportVenues = useMemo(() => venues.filter((venue) => venue.sport === activeSport), [activeSport, venues]);
  const locationFilteredVenues = useMemo(
    () => sportVenues.filter((venue) => matchLocation(venue.locationText, selectedLocation)),
    [selectedLocation, sportVenues],
  );
  const priceScopeVenues = locationFilteredVenues.length > 0 ? locationFilteredVenues : sportVenues;
  const maxSportPrice = useMemo(() => {
    if (priceScopeVenues.length === 0) {
      return 100;
    }

    return Math.max(...priceScopeVenues.map((venue) => venue.priceK), 100);
  }, [priceScopeVenues]);
  const minSportPrice = useMemo(() => {
    if (priceScopeVenues.length === 0) {
      return 0;
    }

    return Math.min(...priceScopeVenues.map((venue) => venue.priceK), 0);
  }, [priceScopeVenues]);
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
    const byFilters = locationFilteredVenues.filter((venue) => {
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
  }, [activeSport, locationFilteredVenues, maxPriceFilter, selectedFilters, sortBy]);

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
    if (filteredVenues.length === 0) {
      setSelectedVenueId(null);
      return;
    }

    const hasSelectedVenue = selectedVenueId
      ? filteredVenues.some((venue) => venue.id === selectedVenueId)
      : false;

    if (!hasSelectedVenue) {
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

  const selectedVenue = selectedVenueId
    ? filteredVenues.find((venue) => venue.id === selectedVenueId)
    : filteredVenues[0];

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
                      {availableSports.map((sport) => {
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
            <p className="mt-1 text-sm text-blue-200/85">
              Sắp xếp theo khoảng cách · {selectedLocation || 'TP. Hồ Chí Minh'}
            </p>
          </div>

          <div className="arena-scroll max-h-[650px] space-y-3 overflow-y-auto px-3 py-3 md:px-4">
            {isLoading && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center">
                <p className="text-lg font-bold text-white">Đang tải danh sách sân...</p>
                <p className="mt-2 text-sm text-slate-300">Vui lòng đợi trong giây lát.</p>
              </div>
            )}

            {loadError && (
              <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-8 text-center">
                <p className="text-lg font-bold text-rose-100">Không thể tải danh sách sân</p>
                <p className="mt-2 text-sm text-rose-200/80">{loadError}</p>
              </div>
            )}

            {!isLoading && !loadError && (
              <>
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
                                  {venue.slots.length > 0 ? (
                                    venue.slots.map((slot) => (
                                      <span
                                        key={slot}
                                        className="rounded-xl border border-blue-400/25 bg-slate-900/70 px-3 py-1 text-sm text-slate-300"
                                      >
                                        {slot}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-300">
                                      {venue.hasSlot ? 'Liên hệ để xem giờ trống' : 'Chưa có lịch trống'}
                                    </span>
                                  )}
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
              </>
            )}
          </div>
        </section>

        <section className="relative min-h-[680px] overflow-hidden rounded-[24px] border border-blue-400/25 bg-slate-950/75 shadow-[0_26px_80px_-40px_rgba(2,6,23,0.95)] backdrop-blur lg:sticky lg:top-24">
          <CourtMap />
        </section>
      </main>
    </div>
  );
};
