import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';

type PriceFeature = {
  label: string;
  included: boolean;
};

type PricePlan = {
  tag?: string;
  tagTone?: 'blue' | 'violet' | 'gold';
  iconTone?: 'slate' | 'blue' | 'gold' | 'violet';
  iconName: 'startup' | 'basic' | 'pro' | 'enterprise';
  name: string;
  subtitle: string;
  monthlyPrice: string;
  monthlyPeriod: string;
  monthlyNote?: string;
  yearlyPrice: string;
  yearlyPeriod: string;
  yearlyNote?: string;
  cta: string;
  secondaryCta?: string;
  accent: string;
  features: PriceFeature[];
  highlight?: boolean;
};

type CompareRow = {
  section: string;
  label: string;
  values: [string, string, string, string];
};

type FaqItem = {
  question: string;
  answer: string;
};

const gridVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const featureVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      delay: index * 0.03,
    },
  }),
};

const iconBaseClass = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl';

const iconToneClass: Record<NonNullable<PricePlan['iconTone']>, string> = {
  slate: 'bg-slate-700/25 text-slate-200',
  blue: 'bg-blue-500/15 text-blue-300',
  gold: 'bg-amber-500/15 text-amber-200',
  violet: 'bg-violet-500/15 text-violet-300',
};

const planIcons: Record<PricePlan['iconName'], React.ReactNode> = {
  startup: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c3.5 2 5.5 5.2 5.5 8.7 0 4.1-2.8 7.7-5.5 9.3-2.7-1.6-5.5-5.2-5.5-9.3C6.5 8.2 8.5 5 12 3Z" />
      <path d="M12 12v6" />
      <path d="M9.5 14.5 12 12l2.5 2.5" />
    </svg>
  ),
  basic: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="16" rx="2.2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  ),
  pro: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 14.6 8l4.9.7-3.5 3.4.8 4.9-4.8-2.6-4.8 2.6.8-4.9L4.5 8.7 9.4 8 12 3.5Z" />
      <path d="M12 12.2v4" />
    </svg>
  ),
  enterprise: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5 13.8 9l4.5 1.8-4.5 1.7L12 17l-1.8-4.5L5.7 10.8 10.2 9 12 4.5Z" />
      <path d="M19 6v3" />
      <path d="M19 12v3" />
      <path d="M19 18v0" />
    </svg>
  ),
};

const plans: PricePlan[] = [
  {
    name: 'Khởi Nghiệp',
    subtitle: 'Dành cho chủ sân mới bắt đầu, muốn trải nghiệm nền tảng.',
    monthlyPrice: '0đ',
    monthlyPeriod: 'Mãi mãi miễn phí',
    yearlyPrice: '0đ',
    yearlyPeriod: 'Mãi mãi miễn phí',
    cta: 'Bắt Đầu Miễn Phí',
    accent: 'from-slate-600 to-slate-800',
    iconName: 'startup',
    iconTone: 'slate',
    features: [
      { label: '1 cơ sở', included: true },
      { label: '2 sân nhỏ', included: true },
      { label: '30 lượt đặt / tháng', included: true },
      { label: 'Lịch đặt sân cơ bản', included: true },
      { label: 'Báo cáo doanh thu đơn giản', included: true },
      { label: 'Hỗ trợ cộng đồng', included: true },
      { label: 'Không tích hợp thanh toán online', included: false },
      { label: 'Không có phân tích nâng cao', included: false },
      { label: 'Không có AI Matchmaking', included: false },
    ],
  },
  {
    name: 'Cơ Bản',
    subtitle: 'Phù hợp cho cơ sở thể thao nhỏ đang phát triển.',
    monthlyPrice: '299.000',
    monthlyPeriod: '/Tháng',
    monthlyNote: 'hoặc 249.000 /Tháng khi trả năm',
    yearlyPrice: '249.000',
    yearlyPeriod: '/Tháng khi trả năm',
    yearlyNote: 'Tiết kiệm khoảng 17% so với thanh toán theo tháng',
    cta: 'Mua Ngay',
    secondaryCta: 'Dùng Thử 14 Ngày',
    accent: 'from-blue-600 to-cyan-500',
    iconName: 'basic',
    iconTone: 'blue',
    features: [
      { label: '1 cơ sở', included: true },
      { label: '5 sân nhỏ', included: true },
      { label: 'Không giới hạn lượt đặt', included: true },
      { label: 'Quản lý lịch nâng cao', included: true },
      { label: 'Báo cáo doanh thu chi tiết', included: true },
      { label: 'Thanh toán online (MoMo, Banking)', included: true },
      { label: 'Hỗ trợ qua email', included: true },
      { label: 'Không có AI Matchmaking', included: false },
      { label: 'Không có gợi ý giá thông minh', included: false },
    ],
  },
  {
    tag: 'PHỔ BIẾN NHẤT',
    tagTone: 'gold',
    name: 'Chuyên Nghiệp',
    subtitle: 'Giải pháp toàn diện cho cơ sở thể thao chuyên nghiệp.',
    monthlyPrice: '699.000',
    monthlyPeriod: '/Tháng',
    monthlyNote: 'hoặc 579.000 /Tháng khi trả năm',
    yearlyPrice: '579.000',
    yearlyPeriod: '/Tháng khi trả năm',
    yearlyNote: 'Tiết kiệm khoảng 17% so với thanh toán theo tháng',
    cta: 'Mua Ngay',
    secondaryCta: 'Dùng Thử 14 Ngày',
    accent: 'from-blue-500 via-blue-600 to-indigo-500',
    iconName: 'pro',
    iconTone: 'gold',
    highlight: true,
    features: [
      { label: '3 cơ sở', included: true },
      { label: '15 sân nhỏ', included: true },
      { label: 'Không giới hạn lượt đặt', included: true },
      { label: 'AI Matchmaking & Ghép đội tự động', included: true },
      { label: 'Gợi ý giá thông minh theo AI', included: true },
      { label: 'Phân tích & dự báo doanh thu', included: true },
      { label: 'Chiến dịch khuyến mãi & mã giảm giá', included: true },
      { label: 'Tích điểm CourtPoints cho khách', included: true },
      { label: 'Hỗ trợ ưu tiên 24/7', included: true },
      { label: 'Tích hợp API', included: true },
    ],
  },
  {
    tag: 'TÙY CHỈNH',
    tagTone: 'violet',
    name: 'Doanh Nghiệp',
    subtitle: 'Cho hệ thống sân thể thao lớn và tập đoàn quản lý nhiều cơ sở.',
    monthlyPrice: 'Liên Hệ',
    monthlyPeriod: 'Tư vấn miễn phí',
    yearlyPrice: 'Liên Hệ',
    yearlyPeriod: 'Tư vấn miễn phí',
    cta: 'Liên Hệ Tư Vấn',
    accent: 'from-violet-600 to-fuchsia-500',
    iconName: 'enterprise',
    iconTone: 'violet',
    features: [
      { label: 'Không giới hạn cơ sở & sân nhỏ', included: true },
      { label: 'Tất cả tính năng Chuyên Nghiệp', included: true },
      { label: 'Onboarding & đào tạo tận nơi', included: true },
      { label: 'SLA đảm bảo 99.9% uptime', included: true },
      { label: 'Tích hợp hệ thống tùy chỉnh', included: true },
      { label: 'Quản lý tài khoản chuyên dụng', included: true },
      { label: 'Báo cáo thương hiệu trắng (White-label)', included: true },
      { label: 'Hỗ trợ qua hotline riêng', included: true },
    ],
  },
];

const compareRows: CompareRow[] = [
  { section: 'QUẢN LÝ CƠ SỞ', label: 'Số cơ sở tối đa', values: ['1', '1', '3', 'Không giới hạn'] },
  { section: 'QUẢN LÝ CƠ SỞ', label: 'Số sân nhỏ / cơ sở', values: ['2', '5', '15', 'Không giới hạn'] },
  { section: 'QUẢN LÝ CƠ SỞ', label: 'Quản lý khung giờ sân', values: ['×', '✓', '✓', '✓'] },
  { section: 'ĐẶT SÂN & LỊCH', label: 'Lượt đặt / tháng', values: ['30 lượt', 'Không giới hạn', 'Không giới hạn', 'Không giới hạn'] },
  { section: 'ĐẶT SÂN & LỊCH', label: 'Đặt sân online 24/7', values: ['×', '✓', '✓', '✓'] },
  { section: 'ĐẶT SÂN & LỊCH', label: 'Xác nhận qua SMS/Email', values: ['×', '✓', '✓', '✓'] },
  { section: 'THANH TOÁN', label: 'Thanh toán tại sân', values: ['✓', '✓', '✓', '✓'] },
  { section: 'THANH TOÁN', label: 'MoMo / VNPay / Banking', values: ['×', '✓', '✓', '✓'] },
  { section: 'THANH TOÁN', label: 'Phí giao dịch', values: ['—', '1.5%', '1.0%', 'Thương lượng'] },
  { section: 'PHÂN TÍCH & BÁO CÁO', label: 'Báo cáo doanh thu cơ bản', values: ['✓', '✓', '✓', '✓'] },
  { section: 'PHÂN TÍCH & BÁO CÁO', label: 'AI dự báo & gợi ý giá', values: ['×', '×', '✓', '✓'] },
  { section: 'MARKETING & KHÁCH HÀNG', label: 'Mã giảm giá & khuyến mãi', values: ['×', '×', '✓', '✓'] },
  { section: 'MARKETING & KHÁCH HÀNG', label: 'AI Matchmaking', values: ['×', '×', '✓', '✓'] },
  { section: 'HỖ TRỢ', label: 'Chat trực tiếp', values: ['×', '✓', '✓', '✓'] },
  { section: 'HỖ TRỢ', label: 'Onboarding tận nơi', values: ['×', '×', '×', '✓'] },
];

const stats = [
  { value: '2.000+', label: 'Cơ sở đang dùng ArenaS', tone: 'from-blue-500 to-cyan-400' },
  { value: '98%', label: 'Chủ sân hài lòng', tone: 'from-emerald-500 to-teal-400' },
  { value: '40%', label: 'Tăng doanh thu trung bình', tone: 'from-violet-500 to-fuchsia-400' },
  { value: '24/7', label: 'Hỗ trợ kỹ thuật', tone: 'from-amber-500 to-orange-400' },
];

const faqs: FaqItem[] = [
  {
    question: 'Phí giao dịch được tính như thế nào?',
    answer:
      'Gói Khởi Nghiệp không có phí nền tảng. Các gói trả phí có mức phí giao dịch theo từng phương thức thanh toán và có thể được tối ưu khi ký hợp đồng dài hạn.',
  },
  {
    question: 'Tôi có thể nâng cấp hoặc hạ gói bất kỳ lúc nào không?',
    answer:
      'Có. Bạn có thể nâng cấp ngay khi cần thêm cơ sở, sân hoặc tính năng nâng cao. Việc hạ gói sẽ được áp dụng ở chu kỳ tiếp theo để không làm gián đoạn dữ liệu.',
  },
  {
    question: 'Có dùng thử miễn phí không?',
    answer:
      'Hai gói Cơ Bản và Chuyên Nghiệp đều có 14 ngày dùng thử. Trong thời gian này bạn có thể kiểm tra luồng đặt sân, báo cáo và các tính năng quản lý chính.',
  },
  {
    question: 'Doanh nghiệp lớn có thể tùy biến theo hệ thống riêng không?',
    answer:
      'Có. Gói Doanh Nghiệp hỗ trợ white-label, onboarding tận nơi, tích hợp API và cấu hình theo quy trình vận hành của đơn vị.',
  },
  {
    question: 'Dữ liệu của cơ sở có được an toàn không?',
    answer:
      'Dữ liệu được bảo vệ bằng các lớp truy cập riêng cho từng vai trò, cùng cơ chế sao lưu và kiểm soát quyền để đảm bảo an toàn vận hành.',
  },
];

const planTagClass: Record<NonNullable<PricePlan['tagTone']>, string> = {
  blue: 'border-blue-400/60 bg-blue-500/20 text-blue-100',
  violet: 'border-violet-400/60 bg-violet-500/20 text-violet-100',
  gold: 'border-amber-300/70 bg-amber-400/20 text-amber-100',
};

export const PriceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const isYearly = billingCycle === 'yearly';
  const savingsLabelClass = isYearly ? 'text-emerald-200' : 'text-emerald-100';

  return (
    <div className="relative overflow-hidden bg-[#071024] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.16),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.1),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />

      <section className="relative px-4 pb-8 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">
              Bảng giá dịch vụ
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Chọn Gói Phù Hợp Phát Triển Cơ Sở
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Từ chủ sân mới bắt đầu đến hệ thống chuỗi thể thao, ArenaS có gói giải pháp phù hợp với quy mô và ngân sách của bạn.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-4 rounded-full border border-white/10 bg-[#09122b]/90 px-4 py-3 shadow-[0_18px_50px_-24px_rgba(37,99,235,0.45)] backdrop-blur-md sm:px-5">
              <span className={`text-sm font-semibold transition-colors ${isYearly ? 'text-slate-400' : 'text-slate-100'}`}>
                Thanh Toán Tháng
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle((current) => (current === 'monthly' ? 'yearly' : 'monthly'))}
                className={`relative h-11 w-28 shrink-0 overflow-hidden rounded-full border transition-colors duration-300 ${
                  isYearly ? 'border-blue-200/70 bg-blue-500' : 'border-slate-400/50 bg-slate-700/85'
                }`}
                aria-label="Chuyển đổi giữa thanh toán tháng và năm"
              >
                <span
                  className={`absolute left-1 top-1 h-9 w-9 rounded-full bg-white shadow-[0_4px_12px_-6px_rgba(15,23,42,0.65)] transition-transform duration-300 will-change-transform ${
                    isYearly ? 'translate-x-[64px]' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold transition-colors ${isYearly ? 'text-slate-100' : 'text-slate-400'}`}>
                Thanh Toán Năm
              </span>
              <span className={`rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-extrabold tracking-wide ${savingsLabelClass}`}>
                Tiết kiệm 17%
              </span>
            </div>
          </div>

          <motion.div
            className="mt-10 grid gap-5 xl:grid-cols-4 lg:grid-cols-2"
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
          >
            {plans.map((plan) => {
              const isPopular = Boolean(plan.highlight);
              const tagTone = plan.tagTone ?? 'blue';
              const iconTone = plan.iconTone ?? 'blue';
              const isEnterprisePrice = plan.monthlyPrice === 'Liên Hệ';
              const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const displayPeriod = isYearly ? plan.yearlyPeriod : plan.monthlyPeriod;
              const displayNote = isYearly ? plan.yearlyNote : plan.monthlyNote;

              return (
                <motion.article
                  key={plan.name}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.015 }}
                  whileTap={{ scale: 0.992 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }}
                  className={`relative overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,rgba(8,15,33,0.98),rgba(4,9,20,0.98))] p-5 shadow-[0_22px_70px_-30px_rgba(2,8,23,0.82)] transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/20 sm:p-6 ${
                    isPopular ? 'border-blue-300/95 ring-2 ring-blue-400/45 shadow-[0_34px_110px_-34px_rgba(37,99,235,0.52)] scale-[1.01]' : 'border-white/10'
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${plan.accent} ${
                      isPopular ? 'opacity-100' : 'opacity-75'
                    }`}
                  />

                  {plan.tag && (
                    <div className="mb-5 flex justify-center">
                      <span className={`rounded-full border px-4 py-1 text-xs font-extrabold tracking-[0.18em] ${planTagClass[tagTone]}`}>
                        {plan.tag}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`${iconBaseClass} ${iconToneClass[iconTone]}`}>
                      {planIcons[plan.iconName]}
                    </div>
                    <div>
                      <h2 className="text-[1.65rem] font-bold leading-tight tracking-tight text-white">
                        {plan.name}
                      </h2>
                      <p className="mt-1 max-w-[16ch] text-sm leading-6 text-slate-400 sm:max-w-none">
                        {plan.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`font-black tracking-tight text-white ${isEnterprisePrice ? 'text-3xl leading-none sm:text-4xl' : 'text-3xl leading-none sm:text-[2.6rem]'}`}>
                        {displayPrice}
                      </span>
                      <span className={`whitespace-nowrap font-medium text-slate-300 ${isEnterprisePrice ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
                        {displayPeriod}
                      </span>
                    </div>
                    {displayNote && <p className="mt-1 text-sm text-emerald-200">{displayNote}</p>}
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (plan.cta === 'Mua Ngay') {
                          // Tính toán giá gốc (trước giảm giá) nếu thanh toán năm
                          const numericMonthly = parseInt(plan.monthlyPrice.replace(/\./g, '')) || 0;
                          const originalYearly = (numericMonthly * 12).toLocaleString('vi-VN').replace(/,/g, '.');
                          const finalPrice = isYearly 
                            ? (parseInt(plan.yearlyPrice.replace(/\./g, '')) * 12).toLocaleString('vi-VN').replace(/,/g, '.')
                            : plan.monthlyPrice;
                          
                          navigate('/checkout', {
                            state: {
                              plan: {
                                name: plan.name,
                                price: finalPrice,
                                period: isYearly ? '/ năm' : '/ tháng',
                                originalPrice: isYearly ? originalYearly : null,
                              }
                            }
                          });
                        } else {
                          // Xử lý logic cho các nút khác
                        }
                      }}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm font-bold tracking-wide transition-colors duration-300 ${
                        isPopular
                          ? 'border-blue-300/40 bg-blue-500 text-white shadow-[0_16px_40px_-18px_rgba(37,99,235,0.95)] hover:bg-blue-400'
                          : isEnterprisePrice
                            ? 'border-violet-300/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/30 hover:border-violet-300/70'
                            : 'border-blue-500/50 bg-blue-500/10 text-blue-300 hover:border-blue-400/80 hover:bg-blue-500/20 hover:text-blue-200'
                      }`}
                    >
                      {plan.cta}
                    </button>
                    {plan.secondaryCta && (
                      <button
                        type="button"
                        className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm font-bold tracking-wide text-white transition-colors duration-300 hover:border-white/20 hover:bg-white/10"
                      >
                        {plan.secondaryCta}
                      </button>
                    )}
                  </div>

                  <div className="mt-7 space-y-3">
                    {plan.features.map((feature, index) => (
                      <motion.div
                        key={feature.label}
                        custom={index}
                        variants={featureVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        className={`flex items-start gap-3 text-sm ${feature.included ? 'text-slate-100' : 'text-slate-500'}`}
                      >
                        <span
                          className={`mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                            feature.included ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-500'
                          }`}
                        >
                          {feature.included ? '✓' : '×'}
                        </span>
                        <span className={feature.included ? 'leading-6' : 'leading-6 line-through decoration-slate-600/70'}>
                          {feature.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(6,12,30,0.94),rgba(8,15,34,0.96))] p-4 shadow-[0_30px_90px_-40px_rgba(2,8,23,0.95)] sm:p-6 lg:p-8">
          <div className="mb-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-300">So sánh chi tiết</span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Đầy đủ tính năng theo gói</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Xem chi tiết từng tính năng để chọn gói phù hợp nhất với mô hình vận hành của bạn.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/8">
            <div className="grid grid-cols-[1.7fr_repeat(4,minmax(110px,1fr))] bg-white/4 px-4 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
              <div>Tính năng</div>
              <div className="text-center text-slate-200">Khởi Nghiệp</div>
              <div className="text-center text-slate-200">Cơ Bản</div>
              <div className="text-center text-blue-300">Chuyên Nghiệp</div>
              <div className="text-center text-violet-300">Doanh Nghiệp</div>
            </div>

            <div className="divide-y divide-white/6 bg-[#071129]">
              {compareRows.map((row) => (
                <div key={`${row.section}-${row.label}`} className="grid grid-cols-[1.7fr_repeat(4,minmax(110px,1fr))] items-center px-4 py-3 text-sm sm:py-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-300/85">{row.section}</div>
                    <div className="mt-1 text-slate-200">{row.label}</div>
                  </div>
                  {row.values.map((value, index) => {
                    const positive = value === '✓';
                    const negative = value === '×';
                    return (
                      <div key={`${row.label}-${index}`} className="flex justify-center text-center text-sm font-semibold">
                        <span
                          className={`inline-flex min-h-8 items-center justify-center rounded-full px-3 py-1 ${
                            positive
                              ? 'bg-emerald-400/12 text-emerald-300'
                              : negative
                                ? 'bg-white/5 text-slate-500'
                                : 'bg-blue-500/10 text-slate-200'
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <div className={`inline-flex rounded-xl bg-gradient-to-r px-3 py-1 text-xs font-black tracking-[0.2em] text-white ${stat.tone}`}>
                  {stat.value}
                </div>
                <p className="mt-3 text-sm text-slate-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,14,31,0.96),rgba(6,12,28,0.98))] p-6 shadow-[0_30px_90px_-42px_rgba(2,8,23,0.9)] sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-300">FAQ</span>
            <h2 className="mt-3 text-3xl font-black text-white">Câu Hỏi Thường Gặp</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Những thắc mắc phổ biến trước khi khách hàng đăng ký dùng thử hoặc mua gói dài hạn.
            </p>

            <div className="mt-6 space-y-3">
              {faqs.map((faq, index) => {
                const open = openFaqIndex === index;
                return (
                  <button
                    key={faq.question}
                    type="button"
                    onClick={() => setOpenFaqIndex((current) => (current === index ? -1 : index))}
                    className="w-full rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-left transition hover:border-white/14 hover:bg-white/6"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-white sm:text-base">{faq.question}</span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-slate-900/60 text-slate-300 transition ${open ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </div>
                    <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] pt-3 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <p className="overflow-hidden text-sm leading-7 text-slate-300">{faq.answer}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                <div className="text-xl font-black leading-tight text-white sm:text-2xl">Chat Tự Động</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Nhận tư vấn tức thì 24/7 từ hệ thống hỗ trợ của ArenaS.</p>
                <div className="mt-3 text-sm font-semibold text-blue-300">Bắt đầu chat →</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                <div className="text-xl font-black leading-tight text-white sm:text-2xl">Gọi Tư Vấn</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Nói chuyện trực tiếp với chuyên gia để chọn gói phù hợp.</p>
                <div className="mt-3 text-sm font-semibold text-emerald-300">1900 0000 →</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                <div className="text-xl font-black leading-tight text-white sm:text-2xl">Demo Trực Tiếp</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Xem bản demo theo nhu cầu sân bóng, tennis hoặc cụm nhiều cơ sở.</p>
                <div className="mt-3 text-sm font-semibold text-violet-300">Đặt lịch demo →</div>
              </div>
            </div>

            <div className="flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[2rem] border border-blue-500/30 bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_35%,#4f46e5_100%)] p-6 shadow-[0_30px_90px_-40px_rgba(37,99,235,0.95)] sm:p-8">
              <div>
                <span className="inline-flex rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-blue-50">
                  Gói được yêu thích
                </span>
                <h3 className="mt-5 max-w-md text-3xl font-black leading-[1.05] text-white sm:text-5xl">
                  Miễn phí đến khi bạn sẵn sàng mở rộng
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-blue-50/90 sm:text-base">
                  Đăng ký miễn phí ngay hôm nay. Không cần thẻ tín dụng. Nâng cấp bất cứ lúc nào khi cần thêm tính năng.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-blue-700 transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Đăng Ký Miễn Phí →
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/16"
                >
                  Xem Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative px-4 pb-8 pt-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
        © 2026 ArenaS. Bảng giá được thiết kế riêng cho ArenaS.
      </footer>
    </div>
  );
};

export default PriceListPage;
