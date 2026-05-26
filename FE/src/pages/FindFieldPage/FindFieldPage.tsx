import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getPublicCourts, type PublicCourt } from '../../Axios/Axios';
import { CourtMap } from '../../components/CourtMap';

type FindFieldLocationState = {
  toastMessage?: string;
  selectedVenueId?: string;
  sport?: string;
  directionsCourt?: any;
  showMap?: boolean;
  fromMatch?: string;
};

type SortOption = 'distanceAsc' | 'priceAsc' | 'priceDesc' | 'ratingDesc';

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'distanceAsc', label: 'Gần Nhất' },
  { value: 'priceAsc', label: 'Giá: Thấp Đến Cao' },
  { value: 'priceDesc', label: 'Giá: Cao Đến Thấp' },
  { value: 'ratingDesc', label: 'Đánh Giá Cao' },
];


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
  // Check raw string first – 'Gần đây' / 'Gần đây' should show all
  const raw = selectedLocation.trim().toLowerCase();
  if (!raw || raw === 'gần đây' || raw.includes('đây') || raw === 'gan day' || raw === 'gan ay') {
    return true;
  }

  const normalizedSelected = normalizeLocationText(selectedLocation);
  if (!normalizedSelected) return true;

  const normalizedVenue = normalizeLocationText(venueLocation);
  if (!normalizedVenue) return false;

  const matchedAlias = Object.keys(locationAliases).find(key => normalizedSelected.includes(key));
  const tokens = matchedAlias ? locationAliases[matchedAlias] : [normalizedSelected];

  return tokens.some(token => normalizedVenue.includes(token));
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

// Map Vietnamese chip label → English API param
const SPORT_TO_API: Partial<Record<SportName, string>> = {
  'Bóng Đá': 'football',
  'Tennis': 'tennis',
  'Cầu Lông': 'badminton',
  'Pickleball': 'pickleball',
};

const SPORT_CHIPS: Array<{ value: SportName | 'all'; label: string; icon: string }> = [
  { value: 'all', label: 'Tất cả', icon: '' },
  { value: 'Pickleball', label: 'Sân pickleball', icon: '' },
  { value: 'Cầu Lông', label: 'Sân cầu lông', icon: '' },
  { value: 'Bóng Đá', label: 'Sân bóng đá', icon: '' },
  { value: 'Tennis', label: 'Sân tennis', icon: '' },
];

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
  const [sortBy, setSortBy] = useState<SortOption>('distanceAsc');
  const [maxPriceFilter] = useState<number>(9999);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [directionsCourt, setDirectionsCourt] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchText, setSearchText] = useState('');
  const [activeSportFilter, setActiveSportFilter] = useState<SportName | 'all'>('all');
  const [fromMatch, setFromMatch] = useState<string | undefined>(undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const state = location.state as FindFieldLocationState | null;

    if (state?.selectedVenueId) {
      setSelectedVenueId(state.selectedVenueId);
    }

    if (state?.directionsCourt) {
      setDirectionsCourt(state.directionsCourt);
    }

    if (state?.showMap) {
      setViewMode('map');
    }

    if (state?.fromMatch) {
      setFromMatch(state.fromMatch);
    }

    if (state?.sport && defaultSports.includes(state.sport as SportName)) {
      setActiveSportFilter(state.sport as SportName);
    }

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
        const apiSport = activeSportFilter !== 'all' ? SPORT_TO_API[activeSportFilter as SportName] : undefined;
        const data = await getPublicCourts(apiSport ? { sport: apiSport } : undefined);

        if (isMounted) setCourts(data);
      } catch (error: unknown) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu sân.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadCourts();
    return () => { isMounted = false; };
  }, [activeSportFilter]);

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

  const venues = useMemo(() => {
    const baseCourts = [...courts];
    if (directionsCourt && !baseCourts.some(c => c.id === directionsCourt.id)) {
      baseCourts.push(directionsCourt);
    }
    return baseCourts.map((court) => buildVenue(court, userCoordinates));
  }, [courts, userCoordinates, directionsCourt]);

  const selectedLocation = searchParams.get('location') ?? 'Gần đây';

  // Pre-fill searchText from ?location= URL param (when coming from HomePage)
  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc && loc !== 'Gần đây' && loc !== 'Gần đây') {
      setSearchText(loc);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Read ?sport= param from URL and activate the matching chip
  useEffect(() => {
    const sportParam = searchParams.get('sport');
    if (!sportParam) return;
    const matched = defaultSports.find(s => s.toLowerCase() === sportParam.toLowerCase()
      || SPORT_TO_API[s]?.toLowerCase() === sportParam.toLowerCase());
    if (matched) setActiveSportFilter(matched);
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

  const sportVenues = useMemo(() => {
    if (activeSportFilter === 'all') return venues;
    return venues.filter(v => v.id === directionsCourt?.id || v.sport === activeSportFilter);
  }, [activeSportFilter, venues, directionsCourt]);

  const locationFilteredVenues = useMemo(
    () => sportVenues.filter(v => v.id === directionsCourt?.id || matchLocation(v.locationText, selectedLocation)),
    [selectedLocation, sportVenues, directionsCourt],
  );

  const filteredVenues = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const bySearch = locationFilteredVenues.filter(v => {
      if (v.id === directionsCourt?.id) return true;
      if (!q) return true;
      return v.name.toLowerCase().includes(q) || v.locationText.toLowerCase().includes(q);
    });
    const byPrice = bySearch.filter(v => v.id === directionsCourt?.id || v.priceK <= maxPriceFilter);
    return [...byPrice].sort((a, b) => {
      if (sortBy === 'priceAsc') return a.priceK - b.priceK;
      if (sortBy === 'priceDesc') return b.priceK - a.priceK;
      if (sortBy === 'ratingDesc') return b.rating - a.rating;
      return a.distanceKm - b.distanceKm;
    });
  }, [locationFilteredVenues, maxPriceFilter, sortBy, searchText, directionsCourt]);


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

  const selectedVenue = selectedVenueId
    ? filteredVenues.find(v => v.id === selectedVenueId)
    : filteredVenues[0];

  void selectedVenue;

  // Shared top bar content
  const topBar = (
    <div className={`${viewMode === 'map' ? 'flex-shrink-0' : 'sticky top-0 z-30'} border-b border-white/8 bg-[#0f1923]/95 backdrop-blur`}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-2 gap-y-2 px-4 py-3">

        <div className="flex flex-shrink-0 rounded-xl border border-white/10 bg-white/5 p-0.5">
          {(['list', 'map'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewMode === mode ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {mode === 'list' ? '📋 Danh sách' : '🗺️ Bản đồ'}
            </button>
          ))}
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Nhập tên sân, quận, hoặc từ khóa..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-56 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/60 transition"
        />
        <button className="flex-shrink-0 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition">
          Tìm kiếm
        </button>

        {/* Divider */}
        <span className="h-5 w-px bg-white/10 flex-shrink-0" />

        {/* Sport chips */}
        {SPORT_CHIPS.map(chip => {
          const active = activeSportFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setActiveSportFilter(chip.value)}
              className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition ${active
                  ? 'bg-blue-500 text-white shadow-[0_4px_14px_-6px_rgba(59,130,246,0.7)]'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/25'
                }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="fixed right-4 top-4 z-[100] rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 backdrop-blur"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIST MODE: Always rendered underneath ── */}
      <div className="min-h-screen bg-[#0f1923] text-slate-100">
        {topBar}

        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
          {/* Count + sort row */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {isLoading ? 'Đang tải...' : `${filteredVenues.length} sân được tìm thấy`}
            </p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border border-white/10 bg-[#1a2332] px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-white/25 transition"
            >
              {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {loadError && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-10 text-center">
              <p className="text-rose-300">{loadError}</p>
            </div>
          )}

          {!loadError && (
            <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <AnimatePresence mode="popLayout">
                {filteredVenues.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/3 p-12 text-center">
                    <p className="text-slate-400">Không có sân phù hợp. Thử từ khóa khác.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredVenues.map((venue, idx) => (
                      <motion.div
                        key={venue.id} layout
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.22 }}
                        onClick={() => navigate(`/courts/${venue.id}`, { state: { fromMatch } })}
                        className="group cursor-pointer overflow-hidden rounded-2xl border border-white/8 bg-[#141e2b] transition hover:border-[#1D9E75]/50 hover:shadow-[0_12px_32px_-16px_rgba(29,158,117,0.25)]"
                      >
                        <div className="relative h-44 overflow-hidden">
                          <img src={venue.image} alt={venue.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <span className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${venue.tag === 'Đang mở' ? 'bg-[#1D9E75]/90 text-white' : 'bg-slate-700/90 text-slate-300'
                            }`}>{venue.tag}</span>
                          <span className="absolute left-2 bottom-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-slate-200 backdrop-blur">{venue.formatLabel}</span>
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h3 className="truncate font-semibold text-white text-sm">{venue.name}</h3>
                          <p className="truncate text-xs text-slate-500">{venue.locationText}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                              {venue.rating > 0 ? `⭐ ${venue.rating.toFixed(1)}` : <span className="italic opacity-60">Chưa có đánh giá</span>}
                            </span>
                            <span className="font-bold text-[#1D9E75]">{new Intl.NumberFormat('vi-VN').format(venue.priceK * 1000)}đ/giờ</span>
                          </div>
                          {venue.amenities.length > 0 && (
                            <p className="truncate text-[11px] text-slate-600">{venue.amenities.slice(0, 3).join(' · ')}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── MAP MODE: slide-over overlay ── */}
      <AnimatePresence>
        {viewMode === 'map' && (
          <motion.div
            key="map-overlay"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            className="fixed inset-0 z-[60] flex flex-col bg-[#0f1923]"
          >
            {topBar}
            <div className="flex-1 overflow-hidden">
              <CourtMap targetCourt={directionsCourt} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

