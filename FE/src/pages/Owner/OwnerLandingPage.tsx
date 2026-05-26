import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getPricingPlans, type FEPlan } from '../../Axios/Axios';

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Static content ───────────────────────────────────────────────────────────

const STATS = [
  { value: '500+', label: 'Sân đang hoạt động' },
  { value: '15,000+', label: 'Lượt đặt mỗi tháng' },
  { value: '4.8★', label: 'Đánh giá trung bình' },
  { value: '98%', label: 'Chủ sân hài lòng' },
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
        <path d="M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2" />
      </svg>
    ),
    title: 'Lịch Đặt Thời Gian Thực',
    desc: 'Quản lý mọi lượt đặt sân từ online lẫn trực tiếp trong một giao diện duy nhất. Cập nhật tức thì, không bao giờ bỏ lỡ khách hàng.',
    gradient: 'from-blue-600/20 via-blue-500/8 to-transparent',
    border: 'border-blue-500/20 hover:border-blue-400/40',
    accent: 'text-blue-400',
    glow: 'shadow-[0_0_40px_-20px_rgba(59,130,246,0.5)]',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20h16M7 16v-5M12 16V8M17 16v-8" />
      </svg>
    ),
    title: 'Phân Tích Doanh Thu',
    desc: 'Biểu đồ trực quan, báo cáo chi tiết theo ngày/tuần/tháng. Biết chính xác sân nào đang sinh lời và khung giờ nào đang hot nhất.',
    gradient: 'from-emerald-600/20 via-emerald-500/8 to-transparent',
    border: 'border-emerald-500/20 hover:border-emerald-400/40',
    accent: 'text-emerald-400',
    glow: 'shadow-[0_0_40px_-20px_rgba(16,185,129,0.5)]',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        <path d="M12 5v14M3 12h18" />
      </svg>
    ),
    title: 'Quản Lý Đa Sân Con',
    desc: 'Tạo và cấu hình nhiều sân con với giá riêng, loại mặt sân, và lịch hoạt động độc lập. Hoàn hảo cho các cơ sở nhiều sân.',
    gradient: 'from-cyan-600/20 via-cyan-500/8 to-transparent',
    border: 'border-cyan-500/20 hover:border-cyan-400/40',
    accent: 'text-cyan-400',
    glow: 'shadow-[0_0_40px_-20px_rgba(6,182,212,0.5)]',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Thông Báo Tức Thì',
    desc: 'Nhận thông báo ngay khi có đặt sân mới, huỷ lịch hoặc phản hồi từ khách hàng. Luôn nắm bắt mọi biến động của sân.',
    gradient: 'from-amber-600/20 via-amber-500/8 to-transparent',
    border: 'border-amber-500/20 hover:border-amber-400/40',
    accent: 'text-amber-400',
    glow: 'shadow-[0_0_40px_-20px_rgba(245,158,11,0.5)]',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
    title: 'Khám Phá Bởi Khách Hàng',
    desc: 'Sân của bạn tự động xuất hiện trên trang tìm kiếm của người dùng ArenaS. Thu hút hàng nghìn khách hàng mới mỗi tháng không tốn chi phí quảng cáo.',
    gradient: 'from-violet-600/20 via-violet-500/8 to-transparent',
    border: 'border-violet-500/20 hover:border-violet-400/40',
    accent: 'text-violet-400',
    glow: 'shadow-[0_0_40px_-20px_rgba(139,92,246,0.5)]',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: 'Gói Dịch Vụ Linh Hoạt',
    desc: 'Bắt đầu miễn phí, nâng cấp khi cần. Mọi gói đều bao gồm hỗ trợ kỹ thuật và cập nhật tính năng mới liên tục.',
    gradient: 'from-pink-600/20 via-pink-500/8 to-transparent',
    border: 'border-pink-500/20 hover:border-pink-400/40',
    accent: 'text-pink-400',
    glow: 'shadow-[0_0_40px_-20px_rgba(236,72,153,0.5)]',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Đăng ký tài khoản',
    desc: 'Tạo tài khoản chủ sân miễn phí trong vòng 2 phút. Không cần thẻ tín dụng, không phí ẩn.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Thêm thông tin sân',
    desc: 'Điền tên sân, địa chỉ, ảnh, giờ mở cửa và bảng giá. Hệ thống hướng dẫn từng bước rõ ràng.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        <path d="M12 5v14M3 12h18" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Nhận đặt sân tự động',
    desc: 'Khách hàng tìm và đặt sân của bạn 24/7. Hệ thống xử lý tự động, bạn chỉ cần theo dõi và xác nhận.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    name: 'Nguyễn Văn An',
    role: 'Chủ sân bóng đá, Hà Nội',
    content:
      'Từ khi dùng ArenaS, tỷ lệ lấp đầy sân tôi tăng từ 60% lên 85%. Hệ thống lịch đặt tự động giúp tiết kiệm ít nhất 2 giờ mỗi ngày so với quản lý thủ công.',
    rating: 5,
    initial: 'A',
    color: 'bg-blue-600',
  },
  {
    name: 'Trần Thị Bình',
    role: 'Chủ sân cầu lông, TP.HCM',
    content:
      'Giao diện rất dễ dùng, báo cáo doanh thu chi tiết giúp tôi nắm rõ tình hình kinh doanh. Khách hàng cũng khen hệ thống đặt sân online tiện lợi.',
    rating: 5,
    initial: 'B',
    color: 'bg-emerald-600',
  },
  {
    name: 'Lê Minh Tuấn',
    role: 'Chủ sân tennis, Đà Nẵng',
    content:
      'ArenaS giúp tôi quản lý 3 cơ sở cùng lúc dễ dàng. Tính năng phân tích doanh thu theo từng sân thực sự hữu ích để ra quyết định kinh doanh.',
    rating: 5,
    initial: 'T',
    color: 'bg-violet-600',
  },
];

// ─── Feature checklist icons ──────────────────────────────────────────────────

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 8 3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m4 4 8 8M12 4 4 12" strokeLinecap="round" />
  </svg>
);

// ─── Pricing card ─────────────────────────────────────────────────────────────

type PricingCardProps = {
  plan: FEPlan;
  billingCycle: 'monthly' | 'yearly';
  isPopular: boolean;
  onSelect: (plan: FEPlan) => void;
};

const FEATURE_LABELS: Record<keyof FEPlan['features'], string> = {
  max_locations: '',
  max_courts: '',
  max_bookings_per_month: '',
  online_booking: 'Đặt sân trực tuyến',
  ai_matchmaking: 'AI ghép đối thủ',
  api_integration: 'Tích hợp API',
  analytics_dashboard: 'Dashboard phân tích',
  priority_support: 'Hỗ trợ ưu tiên',
  custom_branding: 'Thương hiệu tuỳ chỉnh',
};

const PricingCard: React.FC<PricingCardProps> = ({ plan, billingCycle, isPopular, onSelect }) => {
  const price = billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.yearly;
  const monthlyEquiv = billingCycle === 'yearly' ? Math.round(plan.pricing.yearly / 12) : null;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      className={`relative flex flex-col overflow-hidden rounded-3xl border p-6 transition-all ${
        isPopular
          ? 'border-blue-400/50 bg-gradient-to-b from-[#0d2250]/90 to-[#071632]/90 shadow-[0_0_60px_-20px_rgba(59,130,246,0.5)]'
          : 'border-white/10 bg-[#071632]/80'
      }`}
    >
      {isPopular && (
        <div className="absolute right-0 top-0 overflow-hidden rounded-bl-2xl rounded-tr-3xl">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white">
            Phổ biến nhất
          </div>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-b ${isPopular ? 'from-blue-600/10 to-transparent' : 'from-white/[0.02] to-transparent'}`} />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">{plan.name}</p>
          <p className="mt-1 text-2xl font-black text-white">{plan.displayName}</p>
          <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
        </div>

        <div className="mb-6 border-b border-white/10 pb-6">
          {price === 0 ? (
            <p className="text-5xl font-black text-white">Miễn phí</p>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-black text-white">
                  {price.toLocaleString('vi-VN')}
                  <span className="text-2xl text-slate-400">₫</span>
                </p>
                <span className="mb-2 text-sm text-slate-400">
                  / {billingCycle === 'monthly' ? 'tháng' : 'năm'}
                </span>
              </div>
              {monthlyEquiv !== null && (
                <p className="mt-1 text-sm text-emerald-400">
                  ≈ {monthlyEquiv.toLocaleString('vi-VN')}₫/tháng — tiết kiệm 17%
                </p>
              )}
            </>
          )}
        </div>

        <ul className="mb-6 space-y-3 flex-1">
          <li className="flex items-center gap-2 text-sm text-slate-300">
            <CheckIcon />
            <span>{plan.features.max_locations === -1 ? 'Không giới hạn' : plan.features.max_locations} địa điểm</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-slate-300">
            <CheckIcon />
            <span>{plan.features.max_courts === -1 ? 'Không giới hạn' : plan.features.max_courts} sân con</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-slate-300">
            <CheckIcon />
            <span>
              {plan.features.max_bookings_per_month === -1
                ? 'Không giới hạn'
                : plan.features.max_bookings_per_month.toLocaleString('vi-VN')}{' '}
              đặt sân/tháng
            </span>
          </li>
          {(Object.keys(FEATURE_LABELS) as Array<keyof FEPlan['features']>)
            .filter((k) => FEATURE_LABELS[k])
            .map((key) => {
              const enabled = Boolean(plan.features[key]);
              return (
                <li key={key} className={`flex items-center gap-2 text-sm ${enabled ? 'text-slate-300' : 'text-slate-600'}`}>
                  {enabled ? <CheckIcon /> : <CloseIcon />}
                  <span>{FEATURE_LABELS[key]}</span>
                </li>
              );
            })}
        </ul>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(plan)}
          className={`w-full rounded-2xl py-3.5 text-sm font-bold transition ${
            isPopular
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_12px_30px_-14px_rgba(37,99,235,0.9)] hover:from-blue-500 hover:to-blue-400'
              : 'border border-white/15 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
          }`}
        >
          {price === 0 ? 'Bắt đầu miễn phí' : 'Chọn gói này'} →
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const OwnerLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<FEPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    getPricingPlans()
      .then((data) => setPlans(data.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const visiblePlans = plans.filter((p) => !p.isCustom);
  const popularPlanIndex = Math.floor(visiblePlans.length / 2);

  const handlePlanSelect = (_plan: FEPlan) => {
    const token = localStorage.getItem('accessToken')?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      navigate('/register');
    } else {
      navigate('/bang-gia');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">

      {/* ── Fixed background effects ─────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(37,99,235,0.18),transparent),radial-gradient(ellipse_60%_40%_at_80%_5%,rgba(14,165,233,0.1),transparent),radial-gradient(ellipse_60%_50%_at_50%_90%,rgba(59,130,246,0.06),transparent)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(71,85,105,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.2)_1px,transparent_1px)] [background-size:80px_80px]" />

      {/* ════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 pb-24 pt-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* ── Left content ─────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                  Dành cho Chủ Sân Thể Thao
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-5xl font-black leading-[1.1] tracking-tight text-white md:text-6xl lg:text-[4.5rem]"
              >
                Quản lý sân<br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  thông minh hơn
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="max-w-lg text-lg leading-relaxed text-slate-300">
                Nền tảng toàn diện giúp chủ sân thể thao tăng doanh thu, tối ưu lịch đặt và thu hút hàng nghìn khách hàng mới mỗi tháng — hoàn toàn tự động.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-base font-bold text-white shadow-[0_16px_40px_-18px_rgba(37,99,235,0.95)] transition hover:from-blue-500 hover:to-blue-400"
                >
                  Bắt đầu miễn phí →
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-bold text-slate-200 transition hover:border-white/25 hover:bg-white/10"
                >
                  Xem bảng giá
                </motion.button>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Gói miễn phí mãi mãi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Không cần thẻ tín dụng
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Thiết lập trong 5 phút
                </span>
              </motion.div>
            </motion.div>

            {/* ── Right: Dashboard mockup ───────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
              className="relative hidden lg:block"
            >
              {/* Ambient glow */}
              <div className="pointer-events-none absolute inset-0 -m-8 rounded-full bg-blue-600/8 blur-3xl" />

              {/* Main card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#071632]/90 p-6 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)]">
                <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-blue-600/12 blur-3xl" />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ArenaS Dashboard</p>
                      <p className="text-xl font-black text-white">Tổng Quan Hôm Nay</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">Trực tiếp</span>
                    </div>
                  </div>

                  {/* Mini stat cards */}
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Doanh Thu Hôm Nay', value: '2,400,000₫', change: '+18%', color: 'text-blue-300', grad: 'from-blue-600/15' },
                      { label: 'Lượt Đặt Hôm Nay', value: '12 lượt', change: '+4 so hôm qua', color: 'text-cyan-300', grad: 'from-cyan-600/15' },
                      { label: 'Tỷ Lệ Lấp Đầy', value: '78%', change: '+5% tuần này', color: 'text-amber-300', grad: 'from-amber-600/15' },
                      { label: 'Đánh Giá TB', value: '4.8 ★', change: '+0.2 tháng này', color: 'text-violet-300', grad: 'from-violet-600/15' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className={`relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br ${stat.grad} to-transparent p-3`}
                      >
                        <p className="text-xs text-slate-400">{stat.label}</p>
                        <p className={`mt-1 text-lg font-black ${stat.color}`}>{stat.value}</p>
                        <p className="mt-0.5 text-xs text-emerald-400">↗ {stat.change}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Mini chart */}
                  <div className="rounded-2xl border border-white/8 bg-[#061127]/90 p-4">
                    <p className="mb-3 text-xs font-semibold text-slate-400">Doanh Thu 6 Tháng Qua</p>
                    <svg viewBox="0 0 320 70" className="w-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroLineGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                        <linearGradient id="heroFillGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M 0 55 L 64 48 L 128 38 L 192 25 L 256 15 L 320 8"
                        fill="none"
                        stroke="url(#heroLineGrad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.8, delay: 0.6, ease: 'easeInOut' }}
                      />
                      <motion.path
                        d="M 0 55 L 64 48 L 128 38 L 192 25 L 256 15 L 320 8 L 320 70 L 0 70 Z"
                        fill="url(#heroFillGrad)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2, delay: 1 }}
                      />
                    </svg>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      {['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'].map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity }}
                className="absolute -right-8 top-6 rounded-2xl border border-emerald-500/20 bg-[#071632]/95 px-4 py-3 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-sm">📅</div>
                  <div>
                    <p className="text-xs font-semibold text-white">Đặt sân mới</p>
                    <p className="text-xs text-emerald-400">Sân A1 • 18:00–20:00</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity, delay: 1.2 }}
                className="absolute -left-8 bottom-16 rounded-2xl border border-blue-500/20 bg-[#071632]/95 px-4 py-3 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl"
              >
                <p className="text-xs text-slate-400">Doanh thu tháng này</p>
                <p className="text-2xl font-black text-blue-300">↗ +24%</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 pb-16 md:px-12 lg:px-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mx-auto max-w-7xl"
        >
          <div className="grid grid-cols-2 gap-4 overflow-hidden rounded-3xl border border-white/10 bg-[#071632]/60 p-8 backdrop-blur-xl lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center">
                {i > 0 && (
                  <div className="pointer-events-none absolute left-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-white/10 lg:block" />
                )}
                <p className="text-4xl font-black text-white md:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">
              Tính Năng
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Mọi thứ bạn cần để
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                vận hành sân chuyên nghiệp
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-slate-400">
              Từ lịch đặt tự động đến phân tích doanh thu, ArenaS cung cấp tất cả công cụ bạn cần trong một nền tảng duy nhất.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.01 }}
                className={`group relative overflow-hidden rounded-3xl border bg-[#071632]/80 p-6 transition-all duration-300 ${feature.border} ${feature.glow}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`} />
                <div className="relative z-10">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${feature.accent} ring-1 ring-white/10`}>
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">
              Quy Trình
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Bắt đầu trong{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                3 bước đơn giản
              </span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="relative grid gap-8 lg:grid-cols-3"
          >
            {/* Connector line */}
            <div className="pointer-events-none absolute left-0 right-0 top-[3.5rem] hidden h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent lg:block" />

            {STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/25 to-blue-500/10 text-blue-300 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]">
                    {step.icon}
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Bảng Giá
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Chọn gói phù hợp với{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                quy mô của bạn
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-slate-400">
              Bắt đầu miễn phí, nâng cấp bất cứ lúc nào. Tất cả gói đều bao gồm hỗ trợ kỹ thuật và cập nhật tính năng mới.
            </motion.p>

            {/* Billing cycle toggle */}
            <motion.div variants={fadeUp} className="mt-8 inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hằng tháng
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition ${
                  billingCycle === 'yearly'
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hằng năm
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">-17%</span>
              </button>
            </motion.div>
          </motion.div>

          {plansLoading ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl border border-white/10 bg-[#071632]/60" />
              ))}
            </div>
          ) : visiblePlans.length === 0 ? (
            <p className="text-center text-slate-400">Không thể tải thông tin gói dịch vụ. Vui lòng thử lại.</p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className={`grid gap-6 ${
                visiblePlans.length === 1
                  ? 'max-w-sm mx-auto'
                  : visiblePlans.length === 2
                  ? 'max-w-2xl mx-auto lg:grid-cols-2'
                  : 'lg:grid-cols-3'
              }`}
            >
              {visiblePlans.map((plan, index) => (
                <PricingCard
                  key={plan._id}
                  plan={plan}
                  billingCycle={billingCycle}
                  isPopular={index === popularPlanIndex && visiblePlans.length > 1}
                  onSelect={handlePlanSelect}
                />
              ))}
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center text-sm text-slate-500"
          >
            Cần gói doanh nghiệp với tính năng tùy chỉnh?{' '}
            <button className="font-semibold text-blue-400 hover:text-blue-300 transition">
              Liên hệ với chúng tôi →
            </button>
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="mb-14 text-center"
          >
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
              Phản Hồi
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Chủ sân nói gì về{' '}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">ArenaS</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="flex flex-col rounded-3xl border border-white/10 bg-[#071632]/80 p-6 transition-all hover:border-white/20"
              >
                <div className="mb-5 flex">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-300">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.color} text-sm font-bold text-white`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="relative overflow-hidden rounded-[2rem] border border-blue-500/25 bg-gradient-to-br from-[#0d1f4a] via-[#071632] to-[#0a1835] p-12 text-center shadow-[0_40px_80px_-30px_rgba(37,99,235,0.4)]"
          >
            {/* Decorative glows */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(71,85,105,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.3)_1px,transparent_1px)] [background-size:50px_50px]" />

            <div className="relative z-10">
              <motion.p variants={fadeUp} className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-300">
                Sẵn sàng bắt đầu?
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
                Đưa sân của bạn lên
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  tầm cao mới
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-lg text-slate-300">
                Tham gia cùng hàng trăm chủ sân đang dùng ArenaS để tăng doanh thu và thu hút khách hàng mới mỗi ngày.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-10 py-4 text-lg font-bold text-white shadow-[0_20px_50px_-20px_rgba(37,99,235,0.9)] transition hover:from-blue-500 hover:to-blue-400"
                >
                  Tạo tài khoản miễn phí →
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/login')}
                  className="rounded-2xl border border-white/20 bg-white/5 px-10 py-4 text-lg font-bold text-slate-200 transition hover:bg-white/10"
                >
                  Đăng nhập
                </motion.button>
              </motion.div>

              <motion.p variants={fadeUp} className="mt-6 text-sm text-slate-500">
                Miễn phí mãi mãi với gói Basic • Không cần thẻ tín dụng • Hủy bất cứ lúc nào
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
