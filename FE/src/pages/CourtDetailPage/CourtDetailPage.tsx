import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getPublicCourts, type PublicCourt } from '../../Axios/Axios';

type LocationState = { court?: PublicCourt };

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600&auto=format&fit=crop';
const EXTRA_IMGS = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=800&auto=format&fit=crop',
];

const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

function seedBooked(date: string): Set<number> {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = ((h * 31) + date.charCodeAt(i)) | 0;
  const s = new Set<number>();
  [12, 13, 17, 18, 19, 20].forEach((hr, i) => { if ((h >> i) & 1) s.add(hr); });
  return s;
}

const OPEN_HR = 5, CLOSE_HR = 24;

const REVIEWS = [
  { id: 1, avatar: 'M', name: 'Minh Tuấn', date: '12/05/2026', rating: 5, text: 'Sân đẹp, mặt cỏ xịn, giá cả hợp lý.' },
  { id: 2, avatar: 'H', name: 'Hải Hùng', date: '10/05/2026', rating: 4, text: 'Chỗ để xe hơi chật nhưng sân thì rất ok.' },
  { id: 3, avatar: 'T', name: 'Trần Văn', date: '01/05/2026', rating: 5, text: 'Tuyệt vời! Sẽ quay lại nhiều lần.' }
];

const CourtDetailPage: React.FC = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [court, setCourt] = useState<PublicCourt | null>(state?.court ?? null);
  const [loading, setLoading] = useState(!state?.court);
  const [error, setError] = useState<string | null>(null);

  // Calendar States
  const [weekStartOffset, setWeekStartOffset] = useState(0);
  const [shift, setShift] = useState<'morning' | 'afternoon'>('afternoon');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

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

  const currentHours = useMemo(() => {
    if (shift === 'morning') return Array.from({ length: 7 }, (_, i) => 5 + i);
    return Array.from({ length: 12 }, (_, i) => 12 + i);
  }, [shift]);

  // Mock booking data based on selected date
  const selectedDateStr = weekDays[selectedDayIdx].toISOString().slice(0, 10);
  const booked = useMemo(() => seedBooked(selectedDateStr), [selectedDateStr]);

  useEffect(() => {
    if (court || !courtId) { setLoading(false); return; }
    let dead = false;
    setLoading(true);
    getPublicCourts()
      .then(list => {
        if (!dead) {
          const f = list.find(c => c.id === courtId) ?? null;
          setCourt(f);
          if (!f) setError('Không tìm thấy sân.');
        }
      })
      .catch(e => { if (!dead) setError(e instanceof Error ? e.message : 'Lỗi tải sân.'); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [court, courtId]);

  const gallery = useMemo(() => {
    const raw = (court?.images ?? []).filter(i => i?.trim());
    const base = raw.length ? raw : [DEFAULT_IMG];
    const all = [...base, ...EXTRA_IMGS].slice(0, 5);
    while (all.length < 5) all.push(EXTRA_IMGS[all.length % EXTRA_IMGS.length]);
    return all;
  }, [court]);

  const price = court?.price_per_hour ?? 0;
  const rating = Number.isFinite(court?.avg_rating) ? court!.avg_rating : 4.5;
  const reviewCount = 1; // Mock

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
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{court.location || 'Chưa cập nhật địa chỉ'}</span>
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
                        <span className="text-slate-400">Giờ mở cửa:</span>
                        <span className="font-semibold text-white">{OPEN_HR}h - {CLOSE_HR}h</span>
                     </div>
                     <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">Số sân thi đấu:</span>
                        <span className="font-semibold text-white">{court.number_of_courts || 8} Sân</span>
                     </div>
                     <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">Giá sân:</span>
                        <span className="font-semibold text-white">{price > 0 ? `${fmt(price)} đ/h` : 'Liên hệ'}</span>
                     </div>
                     <div className="flex items-center justify-between pb-1">
                        <span className="text-slate-400">Giá sân giờ vàng:</span>
                        <span className="font-semibold text-white">{price > 0 ? `${fmt(price * 1.2)} đ/h` : 'Liên hệ'}</span>
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
                <button onClick={() => setWeekStartOffset(o => o - 1)} className="h-8 w-8 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center transition">
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
                  className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition ${
                    shift === 'morning' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  Ca sáng
                </button>
                <button 
                  onClick={() => setShift('afternoon')}
                  className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition ${
                    shift === 'afternoon' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  Ca chiều
                </button>
             </div>
           </div>

           {/* Week Tabs */}
           <div className="flex border-b border-white/10 mb-4 min-w-[800px]">
             {weekDays.map((day, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`px-6 py-3 text-sm font-semibold transition border-b-2 ${
                    idx === selectedDayIdx ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {getDayLabel(day)}
                </button>
             ))}
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
             {Array.from({ length: court.number_of_courts || 8 }).map((_, courtIdx) => (
               <div key={courtIdx} className="flex border-b border-white/5 last:border-b-0">
                  <div className="w-16 flex-shrink-0 flex items-center justify-center font-bold text-slate-300 text-sm border-r border-white/5 bg-[#141e2b]">
                     <span className="w-2 h-4 bg-amber-400 rounded-sm mr-2"></span>
                     0{courtIdx + 1}
                  </div>
                  {currentHours.map((hr, hrIdx) => {
                     // Fake some bookings based on hour and court to make it look realistic
                     const isBooked = booked.has(hr) && (courtIdx % 2 === hrIdx % 2);
                     return (
                       <div key={hr} className="flex-1 p-1.5 border-l border-white/5">
                          <div className={`w-full h-10 rounded-md transition cursor-pointer hover:border-white/30 ${
                             isBooked ? 'bg-slate-800 border-slate-700' : 'bg-transparent border border-white/10'
                          }`}></div>
                       </div>
                     );
                  })}
               </div>
             ))}
           </div>

        </div>

        {/* 4. Reviews Section (Placed below booking/schedule) */}
        <div className="bg-[#141e2b] border border-white/8 rounded-2xl p-6 shadow-lg mt-6">
          <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
            <h3 className="font-bold text-white border-l-4 border-amber-400 pl-3 text-lg leading-none">
              Đánh giá ({REVIEWS.length})
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-amber-400 text-lg">{'★'.repeat(Math.round(rating))}</span>
              <span className="font-semibold text-slate-300">{rating.toFixed(1)}/5 điểm</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map(r => (
              <div key={r.id} className="rounded-xl border border-white/5 bg-[#0f1923] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300">
                      {r.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{r.name}</p>
                      <p className="text-[11px] text-slate-500">{r.date}</p>
                    </div>
                  </div>
                  <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtDetailPage;
