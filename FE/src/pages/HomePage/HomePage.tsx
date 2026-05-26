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
    glow: 'bg-emerald-500/30',
    border: 'border-emerald-500/20 group-hover:border-emerald-500/60',
  },
  {
    name: 'Tennis',
    image: 'https://media.istockphoto.com/id/1223794261/photo/tennis-court-with-ball-and-net-close-up.jpg?s=612x612&w=0&k=20&c=kPQufmCwyiPQ6A1qEMZ62rucNgEIkDg5y_8f-qZcAN0=',
    glow: 'bg-orange-500/30',
    border: 'border-orange-500/20 group-hover:border-orange-500/60',
  },
  {
    name: 'Cầu Lông',
    image: 'https://maythongdich.com/uploads/images/vi/news/cau-long-tieng-anh-la-gi.jpg',
    glow: 'bg-blue-500/30',
    border: 'border-blue-500/20 group-hover:border-blue-500/60',
  },
  {
    name: 'Pickleball',
    image: 'https://img.freepik.com/premium-photo/orange-pickleball-ball-with-paddle-closeup-pickleball-court-with-space-text_600978-7575.jpg',
    glow: 'bg-purple-500/30',
    border: 'border-purple-500/20 group-hover:border-purple-500/60',
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

const sectionTitleClass = 'text-3xl md:text-5xl font-extrabold tracking-tight text-white';



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

        // Calculate dynamic counts for sports
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



  return (
    <div className="relative overflow-x-clip bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#061136_45%,#030712_100%)] text-slate-100">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed right-4 top-24 z-[70] rounded-2xl border border-emerald-300/40 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-[0_16px_42px_-20px_rgba(16,185,129,0.9)] backdrop-blur md:right-8"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" />

      <section
        className="relative overflow-hidden px-4 pb-14 pt-16 md:px-8 md:pt-24"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(7,14,40,0.88) 0%, rgba(7,14,40,0.66) 42%, rgba(7,14,40,0.8) 100%), url(https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1600&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.16),transparent_30%)]" />
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="mb-10 text-center"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              variants={itemUp}
              className="inline-flex items-center rounded-full border border-blue-300/55 bg-blue-500/20 px-5 py-2 text-sm font-semibold text-blue-100"
            >
              Nền Tảng Đặt Sân ArenaS
            </motion.span>
            <motion.h1
              variants={itemUp}
              className="mt-5 text-5xl font-black leading-[0.95] text-white md:text-8xl"
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
                  className="text-5xl font-black tracking-tight text-blue-400 md:text-8xl"
                >
                  {heroRotatingWords[activeHeroWordIndex]}
                  <span className="ml-1 inline-block animate-pulse text-blue-300">|</span>
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.p
              variants={itemUp}
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-200 md:text-lg"
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
              <motion.div key={stat.label} variants={itemUp} className="glass-soft rounded-2xl px-4 py-5">
                <p className="text-2xl font-extrabold text-white md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-300">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Nổi bật</p>
              <h2 className={sectionTitleClass}>Sân được chọn lọc</h2>
            </div>
            <button onClick={() => navigate('/tim-san')} className="text-sm font-semibold text-blue-300 transition hover:text-white">Xem tất cả sân →</button>
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
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-center text-sm text-slate-300">
                Đang tải sân nổi bật...
              </div>
            )}

            {featuredError && (
              <div className="rounded-3xl border border-rose-300/25 bg-rose-500/10 p-6 text-center text-sm text-rose-100">
                {featuredError}
              </div>
            )}

            {!isFeaturedLoading && !featuredError && featuredVenues.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-center text-sm text-slate-300">
                Chưa có sân nổi bật để hiển thị.
              </div>
            )}

            {featuredVenues.map((venue) => (
              <motion.article
                key={venue.id}
                variants={itemUp}
                whileHover={{ y: -8 }}
                onClick={() => navigate(`/courts/${venue.id}`)}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.9)]"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-blue-500/90 px-3 py-1 text-xs font-semibold text-white">
                    {venue.tag}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-semibold text-slate-200">
                    {venue.sport}
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{venue.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {Number(venue.rating) > 0 ? `⭐ ${Number(venue.rating).toFixed(1)}` : <span className="italic opacity-60">Chưa có đánh giá</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">từ</p>
                      <p className="text-3xl font-extrabold leading-none text-blue-300">{venue.price}</p>
                      <p className="text-sm text-slate-400">/ giờ</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {venue.slots.length > 0 ? (
                      venue.slots.map((slot) => (
                        <span key={slot} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200">
                          {slot}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200">
                        Liên hệ để xem lịch trống
                      </span>
                    )}
                  </div>

                  <button className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:brightness-110">
                    Đặt ngay
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Tại sao chọn ArenaS</p>
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
                className="glass-soft rounded-2xl border border-white/10 p-6"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Quy trình đơn giản</p>
            <h2 className={sectionTitleClass}>Đặt sân trong 60 giây</h2>
          </div>

          <motion.div
            className="grid gap-5 md:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            {processSteps.map((step) => (
              <motion.div key={step.id} variants={itemUp} className="glass-panel rounded-3xl p-6 text-center">
                <span className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-full border border-blue-300/50 bg-blue-500/20 px-3 text-sm font-bold text-blue-100">
                  {step.id}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Khám phá</p>
              <h2 className={sectionTitleClass}>Tìm theo môn thể thao</h2>
            </div>
            <button className="text-sm font-semibold text-slate-300 transition hover:text-white">Xem tất cả môn →</button>
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
                  className={`group relative h-72 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[#0A101D] border transition-colors duration-500 ${sport.border} p-6`}
                >
                  {/* Glow effect */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] opacity-40 transition-opacity duration-500 group-hover:opacity-80 ${sport.glow}`} />

                  {/* Image Center */}
                  <div className="relative z-10 w-32 h-32 mb-8 mt-2 overflow-hidden rounded-2xl shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110">
                    <img src={sport.image} alt={sport.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Text Bottom Left */}
                  <div className="relative z-10 flex w-full flex-col items-start mt-auto">
                    <h3 className="text-xl font-bold text-white">{sport.name}</h3>
                    <p className="mt-1 text-sm font-bold text-emerald-400">
                      {count > 0 ? `${count} sân` : '1 sân'}
                    </p>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 pt-16 md:px-8 md:pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Đánh giá</p>
            <h2 className={sectionTitleClass}>Được yêu thích bởi hàng nghìn người chơi</h2>
          </div>

          <motion.div
            className="grid gap-5 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            {reviews.map((review) => (
              <motion.blockquote
                key={review.name}
                variants={itemUp}
                className="glass-soft rounded-3xl border border-white/10 p-6"
              >
                <p className="text-sm leading-relaxed text-slate-200">“{review.quote}”</p>
                <footer className="mt-4 border-t border-white/10 pt-4">
                  <p className="font-bold text-white">{review.name}</p>
                  <p className="text-sm text-slate-400">{review.role}</p>
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
        className="relative mt-12 overflow-hidden border-y border-blue-300/30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent_32%),radial-gradient(circle_at_86%_0%,rgba(147,197,253,0.22),transparent_32%),linear-gradient(110deg,#1d4ed8_0%,#2563eb_48%,#1d4ed8_100%)] px-4 py-8 md:px-10 md:py-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
              Có mặt trên iOS & Android
            </div>

            <h3 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">
              Chơi nhiều hơn.
              <br />
              Đặt sân thông minh hơn.
            </h3>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-blue-100/90">
              Mang ArenaS theo bên bạn. Đặt sân, tìm đối thủ và theo dõi thống kê, tất cả trong lòng bàn tay.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-left shadow-[0_12px_30px_-20px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M16.2 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9 .8 1 1.7 2.1 2.9 2 .9 0 1.3-.6 2.5-.6 1.2 0 1.5.6 2.5.5 1-.1 1.7-1 2.4-2 .8-1.1 1.1-2.1 1.1-2.2-.1 0-2.2-.8-2.2-3.6z" />
                    <path d="M13.8 6.1c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.8-1 2.8 1 .1 2-.5 2.6-1.2z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Tải về trên</span>
                  <span className="block text-3xl font-black leading-none text-slate-900">App Store</span>
                </span>
              </button>

              <button className="flex items-center gap-3 rounded-2xl border border-white/35 bg-white/12 px-6 py-4 text-left backdrop-blur transition hover:-translate-y-0.5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M3.5 2.3l11.2 9.5-3.2 3.2L3.5 2.3zm0 19.4l8.1-12.2 3.2 3.2-11.3 9zm12.4-7.6l2.8-2.1c1-.8 1-1.9 0-2.7L16 7.2l-3.4 3.4 3.3 3.5z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-blue-100">Tải về tại</span>
                  <span className="block text-3xl font-black leading-none text-white">Google Play</span>
                </span>
              </button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-lg text-blue-50">
              <span className="tracking-[0.2em] text-yellow-300">★★★★★</span>
              <span className="font-semibold">Đánh Giá 4.9</span>
              <span className="text-blue-200/70">|</span>
              <span className="inline-flex items-center gap-2 font-semibold">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                50K+ Lượt Tải
              </span>
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
              className="absolute -inset-5 rounded-[2.5rem] border border-white/20 opacity-40"
              animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -inset-10 rounded-[3rem] border border-white/15 opacity-25"
              animate={{ opacity: [0.12, 0.28, 0.12], scale: [0.98, 1.03, 0.98] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/35 bg-white/18 p-3 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85)] backdrop-blur">
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=900&auto=format&fit=crop"
                alt="ArenaS Mobile App"
                className="h-[420px] w-full rounded-[1.6rem] object-cover object-center"
              />

              <motion.div
                className="absolute bottom-7 left-6 right-6 rounded-2xl border border-white/30 bg-white/20 p-4 backdrop-blur-md"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-sm font-semibold text-blue-100">⚡ Đặt Sân Tiếp Theo</p>
                <p className="mt-1 text-3xl font-black leading-none text-white">Champions Arena</p>
                <p className="mt-1 text-base text-blue-100">Hôm nay, 18:00 · Cách 1.2 km</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};
