import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getPublicCourtById, getCourtSlots,
  getCourtReviews, getCanReview, createReview, updateReview, deleteReview, getMyCourtReview,
  lockSlots, unlockSlots,
  type PublicCourt, type CourtSlotData, type CourtReview,
} from '../../Axios/Axios';
import { BookingModal } from '../../components/BookingModal';

type LocationState = { court?: PublicCourt; fromMatch?: string };

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600&auto=format&fit=crop';
const EXTRA_IMGS = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=800&auto=format&fit=crop',
];

const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

const CourtDetailPage: React.FC = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [court, setCourt] = useState<PublicCourt | null>(state?.court ?? null);
  const [loading, setLoading] = useState(!state?.court);
  const [error, setError] = useState<string | null>(null);

  // Calendar States
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [weekStartOffset, setWeekStartOffset] = useState(0);
  const [shift, setShift] = useState<'morning' | 'afternoon'>('afternoon');
  // Start on the first non-past day of the current week
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const day = now.getDay();
    // Monday=0 index ... Sunday=6 index
    const mondayOffset = day === 0 ? 6 : day - 1;
    return Math.min(mondayOffset, 6);
  });

  // Derived Calendar Data
  const startOfWeek = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff + weekStartOffset * 7);
    return d;
  }, [weekStartOffset]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  }), [startOfWeek]);

  const endOfWeek = weekDays[6];
  const formatShortDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  const dateRangeStr = `${formatShortDate(startOfWeek)} - ${formatShortDate(endOfWeek)}`;

  const getDayLabel = (d: Date) => {
    const day = d.getDay();
    return day === 0 ? 'Chủ nhật' : `Thứ ${day + 1}`;
  };

  const { openHour, closeHour } = useMemo(() => {
    const o = court?.open_time ? parseInt(court.open_time.split(':')[0], 10) : 6;
    const c = court?.close_time ? parseInt(court.close_time.split(':')[0], 10) : 22;
    return { openHour: o, closeHour: c };
  }, [court]);

  const currentHours = useMemo(() => {
    // Or just divide by 2 for balanced visual grid:
    const splitHour = Math.floor((openHour + closeHour) / 2);

    if (shift === 'morning') {
      const length = Math.max(0, splitHour - openHour);
      return Array.from({ length }, (_, i) => openHour + i);
    }

    const length = Math.max(0, closeHour - splitHour);
    return Array.from({ length }, (_, i) => splitHour + i);
  }, [shift, openHour, closeHour]);

  // Real booking data based on selected date
  const d = weekDays[selectedDayIdx];
  const selectedDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [slotData, setSlotData] = useState<Record<string, CourtSlotData>>({});

  const [selectedSlot, setSelectedSlot] = useState<{
    subCourtId: string;
    subCourtName: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // ── Reviews State ────────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<CourtReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsAvg, setReviewsAvg] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  // Review Write Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [myReview, setMyReview] = useState<CourtReview | null>(null);
  const [editingMyReview, setEditingMyReview] = useState(false);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [canReview, setCanReview] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const isLoggedIn = !!localStorage.getItem('accessToken');

  const handleBookingNow = () => {
    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          returnTo: `/courts/${courtId}`,
        },
      });
      return;
    }

    setBookingModalOpen(true);
  };

  useEffect(() => {
    if (!courtId || !selectedDateStr) return;
    let isMounted = true;
    getCourtSlots(courtId, selectedDateStr)
      .then(data => {
        if (!isMounted) return;
        const map: Record<string, CourtSlotData> = {};
        data.forEach(d => { map[d.sub_court_id] = d; });
        setSlotData(map);
      })
      .catch(console.error);
    return () => { isMounted = false; };
  }, [courtId, selectedDateStr]);

  useEffect(() => {
    if (!courtId) { setLoading(false); return; }
    let dead = false;
    if (!court) setLoading(true);
    getPublicCourtById(courtId)
      .then(f => {
        if (!dead) {
          setCourt(f);
        }
      })
      .catch(e => { if (!dead && !court) setError(e instanceof Error ? e.message : 'Lỗi tải sân.'); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [courtId]);

  // Fetch reviews khi courtId thay đổi hoặc reviewPage thay đổi
  useEffect(() => {
    if (!courtId) return;
    setReviewsLoading(true);
    getCourtReviews(courtId, reviewPage, 6)
      .then(res => {
        setReviews(res.reviews);
        setReviewsTotal(res.total);
        setReviewsAvg(res.avgRating);
        setReviewTotalPages(res.pagination.totalPages);
      })
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  }, [courtId, reviewPage]);

  // Kiểm tra user có thể đánh giá không
  useEffect(() => {
    if (!courtId || !isLoggedIn) return;
    // Fetch cả myReview và canReview song song
    Promise.all([
      getCanReview(courtId).catch(() => ({ canReview: false })),
      getMyCourtReview(courtId).catch(() => null),
    ]).then(([cr, mr]) => {
      setCanReview(cr.canReview);
      setMyReview(mr);
      if (mr) {
        // Nếu đã có review, điền sẵn để sửa
        setReviewRating(mr.rating);
        setReviewComment(mr.comment || '');
      }
    });
  }, [courtId, isLoggedIn]);

  const handleSubmitReview = async () => {
    if (!courtId) return;
    setReviewError('');
    setReviewSubmitting(true);
    try {
      if (myReview && editingMyReview) {
        // Sửa review
        const res = await updateReview(myReview._id, { rating: reviewRating, comment: reviewComment });
        setMyReview(res.review);
        setEditingMyReview(false);
      } else {
        // Tạo mới
        const res = await createReview({ court_id: courtId, rating: reviewRating, comment: reviewComment });
        setMyReview(res.review);
        setCanReview(false);
      }
      setShowReviewModal(false);
      setReviewComment(myReview?.comment || '');
      // Refresh danh sách reviews
      const res2 = await getCourtReviews(courtId, 1, 6);
      setReviews(res2.reviews);
      setReviewsTotal(res2.total);
      setReviewsAvg(res2.avgRating);
      setReviewTotalPages(res2.pagination.totalPages);
      setReviewPage(1);
    } catch (e: any) {
      setReviewError(e.message || 'Có lỗi xảy ra');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!myReview || !courtId) return;
    try {
      await deleteReview(myReview._id);
      setMyReview(null);
      setReviewRating(5);
      setReviewComment('');
      setShowDeleteReviewModal(false);
      // Kiểm tra lại có thể review không
      const cr = await getCanReview(courtId);
      setCanReview(cr.canReview);
      // Refresh list
      const res2 = await getCourtReviews(courtId, 1, 6);
      setReviews(res2.reviews);
      setReviewsTotal(res2.total);
      setReviewsAvg(res2.avgRating);
      setReviewTotalPages(res2.pagination.totalPages);
      setReviewPage(1);
    } catch (e: any) {
      setReviewError(e.message || 'Không thể xóa đánh giá');
      setShowReviewModal(true); // Show modal to display error
    }
  };

  const gallery = useMemo(() => {
    const raw = (court?.images ?? []).filter(i => i?.trim());
    const base = raw.length ? raw : [DEFAULT_IMG];
    const all = [...base, ...EXTRA_IMGS].slice(0, 5);
    while (all.length < 5) all.push(EXTRA_IMGS[all.length % EXTRA_IMGS.length]);
    return all;
  }, [court]);

  const price = court?.price_per_hour ?? 0;
  // avg_rating only shown if > 0 (real reviews exist)
  const rating = (court?.avg_rating ?? 0) > 0 ? court!.avg_rating : 0;

  const handleOpenBookingModal = async () => {
    if (!selectedSlot || !courtId) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    try {
      await lockSlots({
        court_id: courtId,
        sub_court_id: selectedSlot.subCourtId,
        date: selectedDateStr,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
      });
      setBookingModalOpen(true);
    } catch (e: any) {
      showToast(e.message || 'Không thể khóa slot. Vui lòng thử lại sau.');
      // Refresh slots
      getCourtSlots(courtId, selectedDateStr).then(data => {
        const map: Record<string, CourtSlotData> = {};
        data.forEach(d => { map[d.sub_court_id] = d; });
        setSlotData(map);
      }).catch(console.error);
    }
  };

  const handleCloseBookingModal = async () => {
    setBookingModalOpen(false);
    if (selectedSlot && courtId) {
      try {
        await unlockSlots({
          court_id: courtId,
          sub_court_id: selectedSlot.subCourtId,
          date: selectedDateStr,
        });
        const data = await getCourtSlots(courtId, selectedDateStr);
        const map: Record<string, CourtSlotData> = {};
        data.forEach(d => { map[d.sub_court_id] = d; });
        setSlotData(map);
      } catch (e) {
        console.error('Failed to unlock', e);
      }
    }
    setSelectedSlot(null);
  };

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1923]">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#1D9E75]/20 border-t-[#1D9E75]" />
    </div>
  );

  if (error || !court) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f1923]">
      <p className="text-rose-400 text-sm">{error ?? 'Không tìm thấy sân.'}</p>
      <button onClick={() => navigate(-1)} className="rounded-xl bg-[#1D9E75] px-5 py-2 text-sm font-semibold text-white">Quay lại</button>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1923] text-slate-100 pb-20">

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1400px] px-4 pt-5 pb-2 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-slate-300 transition">Trang chủ</button>
          <span>/</span>
          <button onClick={() => navigate('/tim-san')} className="hover:text-slate-300 transition">Tìm sân</button>
          <span>/</span>
          <span className="text-slate-300 truncate max-w-[200px]">{court.name}</span>
        </nav>
      </div>

      {/* 1. Header Section */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl bg-[#141e2b] border border-white/8 px-6 py-5">
          {/* Left: Court name & Location */}
          <div className="space-y-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-white">{court.name}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
              {rating > 0 && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>⭐ {rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{court.location || 'Chưa cập nhật địa chỉ'}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tim-san', { state: { targetCourtId: court.id, directionsCourt: court, showMap: true } })}
              className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-5 py-2.5 text-sm font-semibold text-blue-400 hover:bg-blue-500/20 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Chỉ đường
            </button>
          </div>
        </div>
      </div>

      {/* 2. Middle Section (Grid) */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col gap-6 lg:flex-row">

          {/* Left: Gallery (65%) */}
          <div className="w-full lg:w-[65%]">
            <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[300px] md:h-[420px]">
              {/* Image 1 (Large) */}
              <div className="col-span-2 row-span-2 rounded-xl overflow-hidden relative group">
                <img src={gallery[0]} alt="Court view 1" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              {/* Image 2 (Small Top) */}
              <div className="col-span-1 row-span-1 rounded-xl overflow-hidden relative group">
                <img src={gallery[1]} alt="Court view 2" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              {/* Image 3 (Small Bottom) */}
              <div className="col-span-1 row-span-1 rounded-xl overflow-hidden relative group cursor-pointer">
                <img src={gallery[2]} alt="Court view 3" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                  <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg font-semibold text-sm border border-white/20 shadow-lg text-white">
                    Xem tất cả
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info Panels (35%) */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6">

            {/* Court Info */}
            <div className="bg-[#141e2b] border border-white/8 rounded-2xl p-6 space-y-5 shadow-lg">
              <h3 className="font-bold text-white border-l-4 border-[#1D9E75] pl-3 text-lg leading-none">Thông tin sân</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Giờ hoạt động:</span>
                  <span className="font-semibold text-white">{court.open_time} - {court.close_time}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Số sân thi đấu:</span>
                  <span className="font-semibold text-white">{court.sub_courts?.length || court.number_of_courts || 0} Sân</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Giá sân:</span>
                  <span className="font-semibold text-white">{price > 0 ? `${fmt(price)} đ/h` : 'Liên hệ'}</span>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-[#141e2b] border border-white/8 rounded-2xl p-6 space-y-5 shadow-lg flex-1">
              <h3 className="font-bold text-white border-l-4 border-blue-500 pl-3 text-lg leading-none">Dịch vụ tiện ích</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {court.amenities?.map(amenity => (
                  <div key={amenity} className="flex items-center gap-2.5 text-slate-300">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 border border-white/10 text-slate-400 text-xs">
                      ❖
                    </div>
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
                {(!court.amenities || court.amenities.length === 0) && (
                  <p className="text-slate-500 col-span-2">Chưa có thông tin tiện ích</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Bottom Section (Calendar Timeline) */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="bg-[#141e2b] border border-white/8 rounded-2xl p-6 shadow-lg overflow-x-auto">

          {/* Top Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 min-w-[800px]">

            {/* Date range */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeekStartOffset(o => o - 1)}
                disabled={weekStartOffset <= 0}
                className={`h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center transition ${weekStartOffset <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
              >
                &lt;
              </button>
              <span className="text-sm font-semibold text-white min-w-[90px] text-center">{dateRangeStr}</span>
              <button onClick={() => setWeekStartOffset(o => o + 1)} className="h-8 w-8 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center transition">
                &gt;
              </button>
            </div>

            {/* Legends */}
            <div className="flex items-center gap-5 text-xs font-medium">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm border border-white/20 bg-transparent"></span><span className="text-slate-400">Giờ trống</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-700"></span><span className="text-slate-400">Đã khóa</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-rose-500"></span><span className="text-slate-400">Đã đặt</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#1D9E75]"></span><span className="text-slate-400">Đã chơi</span></div>
            </div>

            {/* Action chips */}
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekStartOffset(0)} className="px-4 py-1.5 rounded-full border border-white/10 text-xs font-semibold hover:bg-white/5 transition flex items-center gap-1.5 text-slate-300">
                Hôm nay
              </button>
              <button
                onClick={() => setShift('morning')}
                className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition ${shift === 'morning' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
              >
                Ca sáng
              </button>
              <button
                onClick={() => setShift('afternoon')}
                className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition ${shift === 'afternoon' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
              >
                Ca chiều
              </button>
            </div>
          </div>

          {/* Week Tabs */}
          <div className="flex border-b border-white/10 mb-4 min-w-[800px]">
            {weekDays.map((day, idx) => {
              const isPastDay = day < today;
              return (
                <button
                  key={idx}
                  onClick={() => { if (!isPastDay) setSelectedDayIdx(idx); }}
                  disabled={isPastDay}
                  className={`px-6 py-3 text-sm font-semibold transition border-b-2 ${isPastDay
                    ? 'text-slate-700 border-transparent cursor-not-allowed'
                    : idx === selectedDayIdx
                      ? 'text-blue-400 border-blue-500'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                    }`}
                >
                  {getDayLabel(day)}
                </button>
              );
            })}
          </div>

          {/* Schedule Grid */}
          <div className="min-w-[800px] border border-white/5 rounded-xl overflow-hidden bg-[#0f1923]/50">
            {/* Header Row (Hours) */}
            <div className="flex border-b border-white/5">
              <div className="w-16 flex-shrink-0"></div> {/* Empty corner */}
              {currentHours.map(hr => (
                <div key={hr} className="flex-1 py-3 text-center text-xs font-semibold text-slate-500 border-l border-white/5">
                  {hr}:00
                </div>
              ))}
            </div>

            {/* Court Rows */}
            {(court.sub_courts && court.sub_courts.length > 0 ? court.sub_courts : Array.from({ length: court.number_of_courts || 8 })).map((subCourt: any, courtIdx) => {
              let scId = subCourt?._id || subCourt?.id;
              if (!scId && Object.keys(slotData).length > 0) {
                scId = Object.keys(slotData)[courtIdx];
              }
              const scData = scId ? slotData[scId] : undefined;

              return (
                <div key={scId || courtIdx} className="flex border-b border-white/5 last:border-b-0">
                  <div className="w-16 flex-shrink-0 flex items-center justify-center font-bold text-slate-300 text-sm border-r border-white/5 bg-[#141e2b] truncate px-1">
                    <span className="w-2 h-4 bg-amber-400 rounded-sm mr-2 flex-shrink-0"></span>
                    {subCourt?.name || `Sân ${courtIdx + 1}`}
                  </div>
                  {currentHours.map((hr) => {
                    // Look up the 2 slots for this hour
                    const startStr1 = `${hr.toString().padStart(2, '0')}:00`;
                    const startStr2 = `${hr.toString().padStart(2, '0')}:30`;

                    const slot1 = scData?.slots?.find(s => s.start === startStr1);
                    const slot2 = scData?.slots?.find(s => s.start === startStr2);

                    const isSlotSelected = (slotStart: string) => {
                      if (!selectedSlot || selectedSlot.subCourtId !== scId) return false;
                      return slotStart >= selectedSlot.startTime && slotStart < selectedSlot.endTime;
                    };

                    const getSlotColor = (status?: string, slotStart?: string) => {
                      if (slotStart) {
                        const slotDate = new Date(`${selectedDateStr}T${slotStart}:00`);
                        if (slotDate < new Date()) {
                          if (status === 'booked') return 'bg-[#1D9E75] border-[#1D9E75]/80 cursor-not-allowed'; // Đã chơi
                          return 'bg-white/[0.02] border-white/5 cursor-not-allowed'; // Quá giờ (trống)
                        }
                      }

                      if (slotStart && isSlotSelected(slotStart)) return 'bg-cyan-500/30 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.15)]';
                      if (!status || status === 'available') return 'bg-transparent border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5';
                      if (status === 'locked') return 'bg-slate-700 border-slate-600 hover:border-slate-500';
                      if (status === 'booked') return 'bg-rose-500 border-rose-400 hover:border-rose-300';

                      return 'bg-transparent border border-white/10';
                    };

                    const handleSlotClick = (slotStart: string, slotEnd: string, status?: string) => {
                      const slotDate = new Date(`${selectedDateStr}T${slotStart}:00`);
                      if (slotDate < new Date()) return; // Cannot book past times

                      if (status && status !== 'available') return;
                      if (!scId) return;
                      const scName = subCourt?.name || `Sân ${courtIdx + 1}`;

                      if (!selectedSlot || selectedSlot.subCourtId !== scId) {
                        setSelectedSlot({ subCourtId: scId, subCourtName: scName, startTime: slotStart, endTime: slotEnd });
                        return;
                      }

                      if (slotStart >= selectedSlot.startTime && slotStart < selectedSlot.endTime) {
                        setSelectedSlot(null);
                        return;
                      }

                      if (slotStart === selectedSlot.endTime) {
                        setSelectedSlot(prev => prev ? { ...prev, endTime: slotEnd } : null);
                        return;
                      }

                      if (slotEnd === selectedSlot.startTime) {
                        setSelectedSlot(prev => prev ? { ...prev, startTime: slotStart } : null);
                        return;
                      }

                      setSelectedSlot({ subCourtId: scId, subCourtName: scName, startTime: slotStart, endTime: slotEnd });
                    };

                    const nextHourStr = `${(hr + 1).toString().padStart(2, '0')}:00`;

                    return (
                      <div key={hr} className="flex-1 p-1 flex gap-1 border-l border-white/5">
                        <div onClick={() => handleSlotClick(startStr1, startStr2, slot1?.status)} className={`flex-1 h-10 rounded-md transition cursor-pointer ${getSlotColor(slot1?.status, startStr1)}`} title={`${startStr1} - ${slot1?.status || 'available'}`}></div>
                        <div onClick={() => handleSlotClick(startStr2, nextHourStr, slot2?.status)} className={`flex-1 h-10 rounded-md transition cursor-pointer ${getSlotColor(slot2?.status, startStr2)}`} title={`${startStr2} - ${slot2?.status || 'available'}`}></div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>

        {/* 4. Reviews Section */}
        <div className="bg-[#141e2b] border border-white/8 rounded-2xl p-6 shadow-lg mt-6">
          <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
            <h3 className="font-bold text-white border-l-4 border-amber-400 pl-3 text-lg leading-none">
              Đánh giá ({reviewsTotal})
            </h3>
            <div className="flex items-center gap-3">
              {reviewsAvg > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-400 text-base">{'★'.repeat(Math.round(reviewsAvg))}{'☆'.repeat(5 - Math.round(reviewsAvg))}</span>
                  <span className="font-semibold text-slate-300">{reviewsAvg.toFixed(1)}/5</span>
                </div>
              )}
              {/* Nút chỉ hiện khi đã book nhưng chưa review */}
              {!myReview && canReview && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black transition shadow-md disabled:opacity-50"
                >
                  Viết đánh giá
                </button>
              )}
              {/* Nút sửa khi đã có review */}
              {myReview && !editingMyReview && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingMyReview(true); setShowReviewModal(true); setReviewRating(myReview.rating); setReviewComment(myReview.comment || ''); }}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-bold hover:bg-blue-500/20 transition"
                  > Sửa</button>
                  <button
                    onClick={() => setShowDeleteReviewModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition"
                  >🗑️ Xóa</button>
                </div>
              )}
            </div>
          </div>

          {/* My review card nổi bật */}
          {myReview && (
            <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-500/5 p-4 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white overflow-hidden">
                {myReview.user_avatar
                  ? <img src={myReview.user_avatar} alt="" className="h-full w-full object-cover" />
                  : myReview.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">{myReview.user_name} <span className="text-[10px] text-amber-400 font-normal ml-1">• Đánh giá của bạn</span></p>
                  <span className="text-amber-400 text-xs">{'★'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)}</span>
                </div>
                {myReview.comment && <p className="mt-1 text-sm text-slate-300 italic">"{myReview.comment}"</p>}
                <p className="mt-1 text-[11px] text-slate-500">{new Date(myReview.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          )}

          {reviewsLoading ? (
            <div className="text-center py-8 text-slate-500 animate-pulse text-sm">Đang tải đánh giá...</div>
          ) : reviews.length === 0 && !myReview ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-white/10">
              <p className="text-slate-500 text-sm">Chưa có đánh giá nào.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {reviews.map(r => (
                  <div key={r._id} className="rounded-xl border border-white/5 bg-[#0f1923] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 border border-slate-700 text-sm font-bold text-white overflow-hidden shrink-0">
                          {r.user_avatar
                            ? <img src={r.user_avatar} alt="" className="h-full w-full object-cover" />
                            : r.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{r.user_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-slate-400 leading-relaxed italic">"{r.comment}"</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {reviewTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    disabled={reviewPage <= 1}
                    onClick={() => setReviewPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-40 transition"
                  >← Trước</button>
                  <span className="text-xs text-slate-500">{reviewPage} / {reviewTotalPages}</span>
                  <button
                    disabled={reviewPage >= reviewTotalPages}
                    onClick={() => setReviewPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-40 transition"
                  >Tiếp →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.05] bg-[#10111a] p-6 shadow-[0_28px_70px_-35px_rgba(0,0,0,0.9)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

            <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-4">
              <h3 className="text-base font-bold text-white">{editingMyReview ? 'Sửa đánh giá' : 'Viết đánh giá'}</h3>
              <button onClick={() => { setShowReviewModal(false); setReviewError(''); }}
                className="text-slate-400 hover:text-white transition text-lg font-bold px-1">✕</button>
            </div>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Số sao</label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setReviewRating(s)}
                    className={`text-2xl transition-transform hover:scale-110 ${s <= reviewRating ? 'text-amber-400' : 'text-slate-700'}`}
                  >★</button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-5">
              <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Nhận xét (tùy chọn)</label>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận về sân..."
                maxLength={500}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none transition"
              />
              <p className="text-[10px] text-slate-600 mt-0.5 text-right">{reviewComment.length}/500</p>
            </div>

            {reviewError && (
              <p className="text-xs text-rose-400 mb-3 font-semibold">{reviewError}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowReviewModal(false); setReviewError(''); }}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition"
              >Hủy</button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black transition shadow-md disabled:opacity-50"
              >{reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Review Confirmation Modal */}
      {showDeleteReviewModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.05] bg-[#10111a] p-6 shadow-[0_28px_70px_-35px_rgba(0,0,0,0.9)] relative overflow-hidden text-center">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
              <span className="text-2xl text-rose-400">🗑️</span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">Xóa đánh giá?</h3>
            <p className="mb-6 text-sm text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa đánh giá này không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteReviewModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-transparent py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition"
              >Hủy</button>
              <button
                onClick={handleDeleteMyReview}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-rose-400 transition shadow-rose-500/20"
              >Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Booking Bar */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0c1220]/95 backdrop-blur-xl shadow-2xl shadow-black/50">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">

              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedSlot.subCourtName} • <span className="text-cyan-400">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                </p>
                <p className="text-xs text-slate-500">{formatShortDate(weekDays[selectedDayIdx])} • Nhấn để đặt sân</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSlot(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/10 transition"
              >
                Hủy chọn
              </button>
              <button
                onClick={handleBookingNow}
                onClick={handleOpenBookingModal}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
              >
                Đặt sân ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedSlot && court && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={handleCloseBookingModal}
          courtName={court.name}
          subCourtName={selectedSlot.subCourtName}
          payload={{
            court_id: courtId!,
            sub_court_id: selectedSlot.subCourtId,
            date: selectedDateStr,
            start_time: selectedSlot.startTime,
            end_time: selectedSlot.endTime,
            match_id: new URLSearchParams(location.search).get('matchId') || state?.fromMatch || undefined,
          }}
          pricePerHour={court.price_per_hour || 0}
          onSuccess={() => {
            // Refresh slot data but do NOT close the modal
            getCourtSlots(courtId!, selectedDateStr)
              .then(data => {
                const map: Record<string, CourtSlotData> = {};
                data.forEach(d => { map[d.sub_court_id] = d; });
                setSlotData(map);
              })
              .catch(console.error);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-4 top-24 z-[9999] rounded-2xl border border-rose-500/40 bg-rose-500/20 px-5 py-3 text-sm font-semibold text-rose-400 shadow-[0_16px_42px_-20px_rgba(244,63,94,0.9)] backdrop-blur md:right-8 transition-all duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default CourtDetailPage;
