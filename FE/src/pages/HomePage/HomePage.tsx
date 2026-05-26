import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPublicCourts, type PublicCourt } from '../../Axios/Axios';

type Venue = {
  id: string;
  name: string;
  sport: string;
  distance: string;
  rating: string;
  price: string;
  slots: string[];
  tag: string;
  image: string;
};

const defaultCourtImage =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1280&auto=format&fit=crop';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);

const buildFeaturedVenue = (court: PublicCourt): Venue => {
  const pricePerHour = Number.isFinite(court.price_per_hour) ? court.price_per_hour : 0;
  const ratingValue = Number.isFinite(court.avg_rating) ? court.avg_rating : 0;
  const primarySport = court.sports?.[0]?.trim() || 'Môn thể thao';
  const location = court.location?.trim() || 'Liên hệ';

  return {
    id: court.id,
    name: court.name,
    sport: primarySport,
    distance: location,
    rating: ratingValue.toFixed(1),
    price: formatCurrency(pricePerHour),
    slots: [],
    tag: court.status === 'closed' ? 'Tạm đóng' : 'Đang mở',
    image: court.images?.[0]?.trim() || defaultCourtImage,
  };
};

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const itemUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const defaultSportCategories = [
  {
    name: 'Bóng Đá',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop',
    glow: 'bg-[#CCFF00]/30',
    border: 'border-[#CCFF00]/20 group-hover:border-[#CCFF00]/60',
  },
  {
    name: 'Tennis',
    image: 'https://media.istockphoto.com/id/1223794261/photo/tennis-court-with-ball-and-net-close-up.jpg?s=612x612&w=0&k=20&c=kPQufmCwyiPQ6A1qEMZ62rucNgEIkDg5y_8f-qZcAN0=',
    glow: 'bg-[#00F5FF]/30',
    border: 'border-[#00F5FF]/20 group-hover:border-[#00F5FF]/60',
  },
  {
    name: 'Cầu Lông',
    image: 'https://maythongdich.com/uploads/images/vi/news/cau-long-tieng-anh-la-gi.jpg',
    glow: 'bg-[#CCFF00]/30',
    border: 'border-[#CCFF00]/20 group-hover:border-[#CCFF00]/60',
  },
  {
    name: 'Pickleball',
    image: 'https://img.freepik.com/premium-photo/orange-pickleball-ball-with-paddle-closeup-pickleball-court-with-space-text_600978-7575.jpg',
    glow: 'bg-[#00F5FF]/30',
    border: 'border-[#00F5FF]/20 group-hover:border-[#00F5FF]/60',
  },
];

const whyChooseUs = [
  {
    title: 'Ghép đối thủ bằng AI',
    description:
      'AI ghép đối thủ theo trình độ, lịch rảnh và môn thể thao yêu thích để bạn vào trận nhanh hơn.',
    icon: '🧠',
  },
  {
    title: 'Kế hoạch tập luyện thông minh',
    description:
      'Nhận lộ trình cá nhân hóa, nhắc lịch tập tự động và theo dõi mức tiến bộ theo từng tuần.',
    icon: '📈',
  },
  {
    title: 'Đặt sân tức thì',
    description:
      'Lịch trống theo thời gian thực, xác nhận ngay qua app và hủy linh hoạt trước khung giờ quy định.',
    icon: '⚡',
  },
  {
    title: 'Sân được xác thực',
    description:
      'Hệ thống kiểm định giúp người chơi an tâm về chất lượng mặt sân và dịch vụ.',
    icon: '✅',
  },
  {
    title: 'Quản lý cho chủ sân',
    description:
      'Dashboard trực quan cho chủ sân theo dõi lượt đặt, doanh thu, tỉ lệ lấp đầy và đánh giá.',
    icon: '🏟️',
  },
  {
    title: 'Tích điểm và ưu đãi',
    description:
      'Mỗi trận đấu đều tích điểm đổi ưu đãi, sự kiện đặc quyền và các suất tập miễn phí.',
    icon: '🏆',
  },
];

const reviews = [
  {
    quote:
      'Từ lúc dùng ArenaS, mình đặt sân nhanh hơn rất nhiều. Lịch trống cập nhật theo thời gian thực nên không còn tình trạng đến nơi mới biết hết sân.',
    name: 'Minh Tuấn',
    role: 'Người chơi bóng đá',
  },
  {
    quote:
      'Phần quản lý chủ sân rất hữu ích. Tôi theo dõi doanh thu theo khung giờ, tháng nào cũng dễ tối ưu công suất sân.',
    name: 'Văn Hùng',
    role: 'Chủ sân',
  },
  {
    quote:
      'UI rất dễ dùng, đặt sân xong là có thông báo ngay. Nhóm mình tránh được việc booking trùng giờ.',
    name: 'Thu Hà',
    role: 'Người chơi tennis',
  },
];

const processSteps = [
  {
    id: '01',
    title: 'Tìm sân phù hợp',
    description: 'Lọc theo môn, khu vực, giá và khung giờ trống theo thời gian thực.',
  },
  {
    id: '02',
    title: 'Đặt sân trong 1 chạm',
    description: 'Chọn giờ, xác nhận và thanh toán. Nhận thông báo qua app và email.',
  },
  {
    id: '03',
    title: 'Ra sân và tích điểm',
    description: 'Thi đấu, cập nhật thành tích và nhận CourtPoints sau mỗi trận.',
  },
];

const stats = [
  { label: 'Người chơi', value: '50K+' },
  { label: 'Sân thể thao', value: '2.000+' },
  { label: 'Đánh giá trung bình', value: '4.9' },
  { label: 'Thành phố', value: '15+' },
];

const heroRotatingWords = ['Đặt Sân', 'Nhanh Chóng', 'Tiện Lợi'];

const sectionTitleClass = 'text-3xl md:text-5xl font-extrabold tracking-tight text-white font-montserrat';

type HomeLocationState = {
  toastMessage?: string;
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeHeroWordIndex, setActiveHeroWordIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [lastToastLocationKey, setLastToastLocationKey] = useState<string | null>(null);
  const [featuredVenues, setFeaturedVenues] = useState<Venue[]>([]);
  const [sportCounts, setSportCounts] = useState<Record<string, number>>({});
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [ownerForm, setOwnerForm] = useState({ name: '', phone: '', email: '', venueName: '' });
  const [ownerFormSent, setOwnerFormSent] = useState(false);
  const [ownerFormSubmitting, setOwnerFormSubmitting] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroWordIndex((prev) => (prev + 1) % heroRotatingWords.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedVenues = async () => {
      setIsFeaturedLoading(true);
      setFeaturedError(null);

      try {
        const courts = await getPublicCourts();
        const nextVenues = courts.slice(0, 3).map(buildFeaturedVenue);

        const counts: Record<string, number> = {
          'Bóng Đá': 0,
          'Tennis': 0,
          'Cầu Lông': 0,
          'Pickleball': 0
        };

        courts.forEach(court => {
          if (!court.sports || !Array.isArray(court.sports)) return;
          court.sports.forEach(sport => {
            const lowerSport = sport.toLowerCase();
            if (lowerSport.includes('bóng đá') || lowerSport.includes('football') || lowerSport.includes('soccer')) counts['Bóng Đá']++;
            else if (lowerSport.includes('tennis') || lowerSport.includes('quần vợt')) counts['Tennis']++;
            else if (lowerSport.includes('cầu lông') || lowerSport.includes('badminton')) counts['Cầu Lông']++;
            else if (lowerSport.includes('pickleball')) counts['Pickleball']++;
          });
        });

        if (isMounted) {
          setFeaturedVenues(nextVenues);
          setSportCounts(counts);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setFeaturedError(error instanceof Error ? error.message : 'Không thể tải sân nổi bật.');
        }
      } finally {
        if (isMounted) {
          setIsFeaturedLoading(false);
        }
      }
    };

    void loadFeaturedVenues();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const state = location.state as HomeLocationState | null;

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
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const handleOwnerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerFormSubmitting(true);
    setTimeout(() => {
      setOwnerFormSubmitting(false);
      setOwnerFormSent(true);
    }, 1200);
  };

  return (
    <div className="relative overflow-x-clip bg-[#0A0A0B] text-slate-100 font-inter">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed right-4 top-24 z-[70] rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/20 px-5 py-3 text-sm font-semibold text-[#CCFF00] shadow-[0_16px_42px_-20px_rgba(204,255,0,0.9)] backdrop-blur md:right-8"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <section
        className="relative overflow-hidden px-4 pb-14 pt-16 md:px-8 md:pt-24 border-b border-white/5"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(10,10,11,0.6) 0%, rgba(10,10,11,0.9) 100%), url(https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1600&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-7xl relative z-10">
          <motion.div
            className="mb-10 text-center"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              variants={itemUp}
              className="inline-flex items-center rounded-full border border-[#CCFF00]/30 bg-[#CCFF00]/10 px-5 py-2 text-sm font-bold tracking-widest uppercase text-[#CCFF00]"
            >
              Nền Tảng Đặt Sân ArenaS
            </motion.span>
            <motion.h1
              variants={itemUp}
              className="mt-5 text-5xl font-black leading-[0.95] text-white md:text-8xl font-montserrat tracking-tight"
            >
              ArenaS
            </motion.h1>

            <div className="mt-4 min-h-[76px] md:min-h-[108px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={heroRotatingWords[activeHeroWordIndex]}
                  initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  className="text-5xl font-black tracking-tight text-[#CCFF00] md:text-8xl font-montserrat"
                >
                  {heroRotatingWords[activeHeroWordIndex]}
                  <span className="ml-1 inline-block animate-pulse text-[#CCFF00]">|</span>
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.p
              variants={itemUp}
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg"
            >
              Đặt sân thể thao theo thời gian thực, thao tác nhanh và trải nghiệm tiện lợi trên một nền tảng duy nhất.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={itemUp} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-5 text-center transition hover:bg-white/10">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#00F5FF] uppercase mb-2">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CCFF00] mb-2">Nổi bật</p>
              <h2 className={sectionTitleClass}>Sân được chọn lọc</h2>
            </div>
            <button onClick={() => navigate('/tim-san')} className="text-sm font-bold text-[#00F5FF] transition hover:text-white">Xem tất cả sân →</button>
          </div>

          <motion.div
            key={isFeaturedLoading ? 'loading' : 'loaded'}
            className="grid gap-6 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            {isFeaturedLoading && (
              <div className="rounded-3xl border border-white/5 bg-[#101011] p-6 text-center text-sm text-slate-400">
                Đang tải sân nổi bật...
              </div>
            )}

            {featuredError && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-400">
                {featuredError}
              </div>
            )}

            {!isFeaturedLoading && !featuredError && featuredVenues.length === 0 && (
              <div className="rounded-3xl border border-white/5 bg-[#101011] p-6 text-center text-sm text-slate-400">
                Chưa có sân nổi bật để hiển thị.
              </div>
            )}

            {featuredVenues.map((venue) => (
              <motion.article
                key={venue.id}
                variants={itemUp}
                whileHover={{ y: -8 }}
                onClick={() => navigate(`/courts/${venue.id}`)}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-[#101011] transition-all hover:border-[#CCFF00]/30 shadow-lg"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#CCFF00] px-3 py-1 text-xs font-bold text-[#0A0A0B]">
                    {venue.tag}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full bg-[#0A0A0B]/80 px-3 py-1 text-xs font-semibold text-[#00F5FF]">
                    {venue.sport}
                  </span>
                </div>

                <div className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{venue.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {Number(venue.rating) > 0 ? <span className="text-[#CCFF00]">★ {Number(venue.rating).toFixed(1)}</span> : <span className="italic opacity-60">Chưa có đánh giá</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">từ</p>
                      <p className="text-2xl font-black leading-none text-[#CCFF00]">{venue.price}</p>
                      <p className="text-[11px] text-slate-400 uppercase mt-1">/ giờ</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {venue.slots.length > 0 ? (
                      venue.slots.map((slot) => (
                         <span key={slot} className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                          {slot}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                        Liên hệ để xem lịch trống
                      </span>
                    )}
                  </div>

                  <button className="w-full rounded-xl bg-[#2A3317] border border-[#CCFF00]/30 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.05)] transition hover:bg-[#CCFF00] hover:text-[#0A0A0B] hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] mt-2">
                    Đặt ngay →
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24 border-t border-white/5 bg-[#0C0C0E]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F5FF] mb-2">Tại sao chọn ArenaS</p>
            <h2 className={sectionTitleClass}>Tất cả những gì bạn cần để chơi nhiều hơn</h2>
          </div>

          <motion.div
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {whyChooseUs.map((feature) => (
              <motion.article
                key={feature.title}
                variants={itemUp}
                whileHover={{ y: -6 }}
                className="bg-white/5 border border-white/5 rounded-2xl p-6 transition hover:border-[#CCFF00]/30 hover:bg-white/10"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#CCFF00]/10 text-[#CCFF00] text-2xl border border-[#CCFF00]/20">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Owner Contact Section ─────────────────────────────────────── */}
      <section className="relative px-4 py-16 md:px-8 md:py-24 border-t border-white/5 bg-[#0C0C0E] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(0,245,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.2)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-[#00F5FF]/6 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-[#CCFF00]/4 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">

            {/* ── Left: Benefits ─────────────────────────────────────────── */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={container}
              className="space-y-8 lg:pt-4"
            >
              <motion.span variants={itemUp} className="inline-flex items-center gap-2 rounded-full border border-[#00F5FF]/30 bg-[#00F5FF]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#00F5FF]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00F5FF]" />
                Dành cho Chủ Sân
              </motion.span>

              <motion.h2 variants={itemUp} className="text-4xl font-black leading-tight tracking-tight text-white md:text-5xl font-montserrat">
                Bạn có sân thể thao?<br />
                <span className="text-[#00F5FF]">Hợp tác cùng ArenaS</span>
              </motion.h2>

              <motion.p variants={itemUp} className="text-base leading-relaxed text-slate-400">
                Tiếp cận hàng nghìn người chơi, quản lý lịch đặt tự động và tăng doanh thu — hoàn toàn miễn phí để bắt đầu.
              </motion.p>

              <motion.ul variants={container} className="space-y-4">
                {[
                  { icon: '📅', text: 'Nhận đặt sân online 24/7, không cần trực điện thoại' },
                  { icon: '📊', text: 'Dashboard doanh thu, tỷ lệ lấp đầy theo thời gian thực' },
                  { icon: '👥', text: 'Hàng nghìn người chơi tìm kiếm sân trong khu vực của bạn' },
                  { icon: '🛡️', text: 'Hỗ trợ kỹ thuật tận tâm, thiết lập chỉ trong 5 phút' },
                ].map((item) => (
                  <motion.li key={item.text} variants={itemUp} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base">
                      {item.icon}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-300">{item.text}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div variants={itemUp} className="flex items-center gap-4 pt-2">
                <a
                  href="tel:+84123456789"
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-[#00F5FF]/40 hover:bg-[#00F5FF]/5 hover:text-[#00F5FF]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.49 5.49l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Gọi ngay
                </a>
                <a
                  href="mailto:contact@arenas.vn"
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-[#CCFF00]/40 hover:bg-[#CCFF00]/5 hover:text-[#CCFF00]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Gửi email
                </a>
              </motion.div>
            </motion.div>

            {/* ── Right: Contact Form ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101011] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
                <div className="border-b border-white/5 px-7 py-5">
                  <p className="text-lg font-black tracking-tight text-white">Đăng ký hợp tác</p>
                  <p className="mt-1 text-sm text-slate-400">Điền thông tin — chúng tôi liên hệ trong 24 giờ</p>
                </div>

                <div className="px-7 py-7">
                  <AnimatePresence mode="wait">
                    {ownerFormSent ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex flex-col items-center py-8 text-center"
                      >
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#CCFF00]/30 bg-[#CCFF00]/10">
                          <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#CCFF00]" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-xl font-black text-white">Đã nhận thông tin!</p>
                        <p className="mt-2 max-w-xs text-sm text-slate-400">
                          Cảm ơn <span className="font-semibold text-white">{ownerForm.name || 'bạn'}</span>! Đội ngũ ArenaS sẽ liên hệ trong vòng 24 giờ để hướng dẫn thiết lập sân.
                        </p>
                        <button
                          onClick={() => navigate('/register')}
                          className="mt-7 rounded-2xl bg-[#CCFF00] px-7 py-3 text-sm font-bold text-[#0A0A0B] transition hover:bg-[#d4ff1a]"
                        >
                          Tạo tài khoản ngay →
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        onSubmit={handleOwnerFormSubmit}
                        className="space-y-4"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                              Họ và tên <span className="text-red-400">*</span>
                            </label>
                            <input
                              required
                              type="text"
                              placeholder="Nguyễn Văn A"
                              value={ownerForm.name}
                              onChange={(e) => setOwnerForm((f) => ({ ...f, name: e.target.value }))}
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#00F5FF]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#00F5FF]/30"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                              Số điện thoại <span className="text-red-400">*</span>
                            </label>
                            <input
                              required
                              type="tel"
                              placeholder="0901 234 567"
                              value={ownerForm.phone}
                              onChange={(e) => setOwnerForm((f) => ({ ...f, phone: e.target.value }))}
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#00F5FF]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#00F5FF]/30"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Email</label>
                          <input
                            type="email"
                            placeholder="email@example.com"
                            value={ownerForm.email}
                            onChange={(e) => setOwnerForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#00F5FF]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#00F5FF]/30"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Tên sân / cơ sở thể thao
                          </label>
                          <input
                            type="text"
                            placeholder="Sân Bóng Đá Tân Bình, Cụm Cầu Lông..."
                            value={ownerForm.venueName}
                            onChange={(e) => setOwnerForm((f) => ({ ...f, venueName: e.target.value }))}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#00F5FF]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#00F5FF]/30"
                          />
                        </div>

                        <motion.button
                          type="submit"
                          disabled={ownerFormSubmitting}
                          whileHover={{ scale: ownerFormSubmitting ? 1 : 1.02 }}
                          whileTap={{ scale: ownerFormSubmitting ? 1 : 0.97 }}
                          className="relative w-full overflow-hidden rounded-2xl bg-[#CCFF00] py-4 text-sm font-black uppercase tracking-[0.06em] text-[#0A0A0B] shadow-[0_0_20px_rgba(204,255,0,0.15)] transition hover:bg-[#d4ff1a] hover:shadow-[0_0_28px_rgba(204,255,0,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {ownerFormSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                              </svg>
                              Đang gửi...
                            </span>
                          ) : (
                            'Gửi thông tin đăng ký →'
                          )}
                        </motion.button>

                        <p className="text-center text-xs text-slate-500">
                          Hoặc{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="font-semibold text-[#00F5FF] transition hover:text-white"
                          >
                            tự tạo tài khoản ngay
                          </button>
                        </p>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CCFF00] mb-2">Quy trình đơn giản</p>
            <h2 className={sectionTitleClass}>Đặt sân trong 60 giây</h2>
          </div>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            {processSteps.map((step) => (
              <motion.div key={step.id} variants={itemUp} className="bg-[#101011] border border-white/5 rounded-[2rem] p-8 text-center relative overflow-hidden group hover:border-[#00F5FF]/30 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00F5FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 inline-flex h-12 min-w-[48px] items-center justify-center rounded-full border border-[#00F5FF]/30 bg-[#00F5FF]/10 px-3 text-sm font-bold text-[#00F5FF] shadow-[0_0_15px_rgba(0,245,255,0.2)]">
                  {step.id}
                </span>
                <h3 className="relative z-10 mt-6 text-xl font-bold text-white tracking-tight">{step.title}</h3>
                <p className="relative z-10 mt-3 text-sm leading-relaxed text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24 border-t border-white/5 bg-[#0C0C0E]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F5FF] mb-2">Khám phá</p>
              <h2 className={sectionTitleClass}>Tìm theo môn thể thao</h2>
            </div>
            <button className="text-sm font-bold text-[#CCFF00] transition hover:text-white">Xem tất cả môn →</button>
          </div>

          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {defaultSportCategories.map((sport) => {
              const count = sportCounts[sport.name] || 0;
              return (
                <motion.article
                  key={sport.name}
                  variants={itemUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={`group relative h-72 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[#101011] border transition-colors duration-500 ${sport.border} p-6`}
                >
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] opacity-20 transition-opacity duration-500 group-hover:opacity-60 ${sport.glow}`} />

                  <div className="relative z-10 w-32 h-32 mb-8 mt-2 overflow-hidden rounded-2xl shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110">
                    <img src={sport.image} alt={sport.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="relative z-10 flex w-full flex-col items-start mt-auto">
                    <h3 className="text-xl font-bold text-white tracking-tight">{sport.name}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#CCFF00]">
                      {count > 0 ? `${count} sân` : '1 sân'}
                    </p>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 pt-16 md:px-8 md:pt-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CCFF00] mb-2">Đánh giá</p>
            <h2 className={sectionTitleClass}>Được yêu thích bởi người chơi</h2>
          </div>

          <motion.div
            className="grid gap-6 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            {reviews.map((review) => (
              <motion.blockquote
                key={review.name}
                variants={itemUp}
                className="bg-white/5 rounded-3xl border border-white/10 p-8 transition hover:bg-white/10 hover:border-[#00F5FF]/30"
              >
                <div className="text-[#CCFF00] mb-4 text-xl">★★★★★</div>
                <p className="text-sm leading-relaxed text-slate-300 italic">“{review.quote}”</p>
                <footer className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-bold text-white">{review.name}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#00F5FF] mt-1">{review.role}</p>
                </footer>
              </motion.blockquote>
            ))}
          </motion.div>
        </div>
      </section>


      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        className="relative mt-12 overflow-hidden border-t border-[#CCFF00]/20 bg-[#0A0A0B] px-4 py-12 md:px-10 md:py-20"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#CCFF00]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00F5FF]/30 bg-[#00F5FF]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#00F5FF]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
              Có mặt trên iOS & Android
            </div>

            <h3 className="mt-6 text-4xl font-black leading-tight text-white md:text-6xl font-montserrat tracking-tight">
              Chơi nhiều hơn.<br />
              <span className="text-[#CCFF00]">Đặt sân thông minh hơn.</span>
            </h3>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Mang ArenaS theo bên bạn. Đặt sân, tìm đối thủ và theo dõi thống kê, tất cả trong lòng bàn tay.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101011] px-6 py-4 text-left transition hover:border-[#CCFF00]/50 hover:bg-[#1A1A1C]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0A0A0B]">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M16.2 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9 .8 1 1.7 2.1 2.9 2 .9 0 1.3-.6 2.5-.6 1.2 0 1.5.6 2.5.5 1-.1 1.7-1 2.4-2 .8-1.1 1.1-2.1 1.1-2.2-.1 0-2.2-.8-2.2-3.6z" />
                    <path d="M13.8 6.1c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.8-1 2.8 1 .1 2-.5 2.6-1.2z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Tải về trên</span>
                  <span className="block text-2xl font-black leading-none text-white">App Store</span>
                </span>
              </button>

              <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101011] px-6 py-4 text-left transition hover:border-[#00F5FF]/50 hover:bg-[#1A1A1C]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0A0A0B]">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M3.5 2.3l11.2 9.5-3.2 3.2L3.5 2.3zm0 19.4l8.1-12.2 3.2 3.2-11.3 9zm12.4-7.6l2.8-2.1c1-.8 1-1.9 0-2.7L16 7.2l-3.4 3.4 3.3 3.5z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Tải về tại</span>
                  <span className="block text-2xl font-black leading-none text-white">Google Play</span>
                </span>
              </button>
            </div>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-[360px]"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            animate={{ y: [0, -10, 0], rotate: [0, 0.8, 0] }}
            transition={{
              opacity: { duration: 0.5 },
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <motion.div
              className="absolute -inset-5 rounded-[2.5rem] border border-[#CCFF00]/20 opacity-40"
              animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#101011] p-3 shadow-[0_30px_70px_-30px_rgba(204,255,0,0.15)]">
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=900&auto=format&fit=crop"
                alt="ArenaS Mobile App"
                className="h-[420px] w-full rounded-[1.6rem] object-cover object-center"
              />

              <motion.div
                className="absolute bottom-7 left-6 right-6 rounded-2xl border border-white/10 bg-[#0A0A0B]/80 p-5 backdrop-blur-md"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#CCFF00]">⚡ Đặt Sân Tiếp Theo</p>
                <p className="mt-2 text-2xl font-black leading-none text-white tracking-tight">Champions Arena</p>
                <p className="mt-2 text-sm text-slate-400">Hôm nay, 18:00 · Cách 1.2 km</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};
