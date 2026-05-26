import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import {
  getPricingPlans,
  getCurrentSubscriptionStatus,
  validateSubscriptionAction,
  ValidateSubscriptionActionResponse
} from '../../Axios/Axios';

type PriceFeature = {
  label: string;
  included: boolean;
};

type PricePlan = {
  id: string;
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
  sortOrder: number;
  isCustom: boolean;
  rawMonthlyPrice: number;
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
  slate: 'bg-white/5 text-slate-300',
  blue: 'bg-[#CCFF00]/10 text-[#CCFF00]',
  gold: 'bg-[#00F5FF]/10 text-[#00F5FF]',
  violet: 'bg-[#CCFF00]/20 text-[#CCFF00]',
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

const compareRows: CompareRow[] = [
  { section: 'QUẢN LÝ CƠ SỞ', label: 'Số cơ sở tối đa', values: ['1', '1', '5', 'Không giới hạn'] },
  { section: 'QUẢN LÝ CƠ SỞ', label: 'Số sân nhỏ / cơ sở', values: ['3', '10', '50', 'Không giới hạn'] },
  { section: 'QUẢN LÝ CƠ SỞ', label: 'Quản lý khung giờ sân', values: ['✓', '✓', '✓', '✓'] },
  { section: 'ĐẶT SÂN & LỊCH', label: 'Lượt đặt / tháng', values: ['50 lượt', '300 lượt', 'Không giới hạn', 'Không giới hạn'] },
  { section: 'ĐẶT SÂN & LỊCH', label: 'Đặt sân online 24/7', values: ['✓', '✓', '✓', '✓'] },
  { section: 'ĐẶT SÂN & LỊCH', label: 'Xác nhận qua SMS/Email', values: ['×', '✓', '✓', '✓'] },
  { section: 'THANH TOÁN', label: 'Thanh toán tại sân', values: ['✓', '✓', '✓', '✓'] },
  { section: 'THANH TOÁN', label: 'MoMo / VNPay / Banking', values: ['×', '✓', '✓', '✓'] },
  { section: 'THANH TOÁN', label: 'Phí giao dịch', values: ['—', '1.5%', '1.0%', 'Thương lượng'] },
  { section: 'PHÂN TÍCH & BÁO CÁO', label: 'Báo cáo doanh thu cơ bản', values: ['×', '✓', '✓', '✓'] },
  { section: 'PHÂN TÍCH & BÁO CÁO', label: 'AI dự báo & gợi ý giá', values: ['×', '×', '✓', '✓'] },
  { section: 'MARKETING & KHÁCH HÀNG', label: 'Mã giảm giá & khuyến mãi', values: ['×', '×', '✓', '✓'] },
  { section: 'MARKETING & KHÁCH HÀNG', label: 'AI Matchmaking', values: ['×', '×', '✓', '✓'] },
  { section: 'HỖ TRỢ', label: 'Chat trực tiếp', values: ['×', '✓', '✓', '✓'] },
  { section: 'HỖ TRỢ', label: 'Onboarding tận nơi', values: ['×', '×', '×', '✓'] },
];

const stats = [
  { value: '2.000+', label: 'Cơ sở đang dùng ArenaS', tone: 'from-[#00F5FF]/80 to-[#00F5FF]' },
  { value: '98%', label: 'Chủ sân hài lòng', tone: 'from-[#CCFF00]/80 to-[#CCFF00]' },
  { value: '40%', label: 'Tăng doanh thu trung bình', tone: 'from-[#00F5FF]/80 to-[#00F5FF]' },
  { value: '24/7', label: 'Hỗ trợ kỹ thuật', tone: 'from-[#CCFF00]/80 to-[#CCFF00]' },
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
      'Có. Bạn có thể nâng cấp ngay để mở khóa cơ sở, sân hoặc tính năng nâng cao. Chi phí sử dụng còn lại của gói cũ sẽ được quy đổi thành tín dụng giảm trừ trực tiếp vào hóa đơn nâng cấp gói mới.',
  },
  {
    question: 'Tại sao việc hạ gói tự động bị chặn?',
    answer:
      'Hạ gói có thể làm mất dữ liệu nếu số cơ sở hoặc sân hiện có của bạn vượt quá giới hạn của gói mới. Vì vậy, hệ thống yêu cầu bạn cắt giảm cơ sở/sân dư thừa trước hoặc liên hệ bộ phận hỗ trợ chăm sóc khách hàng để tránh rủi ro mất mát dữ liệu.',
  },
  {
    question: 'Doanh nghiệp lớn có thể tùy biến theo hệ thống riêng không?',
    answer:
      'Có. Gói Doanh Nghiệp hỗ trợ white-label, tích hợp API riêng, cấu hình tùy chỉnh theo quy mô cụm nhiều chi nhánh lớn và có nhân viên hỗ trợ onboarding kỹ thuật tận nơi.',
  },
];

const planTagClass: Record<NonNullable<PricePlan['tagTone']>, string> = {
  blue: 'border-[#CCFF00]/30 bg-[#CCFF00]/10 text-[#CCFF00]',
  violet: 'border-[#CCFF00]/30 bg-[#CCFF00]/10 text-[#CCFF00]',
  gold: 'border-[#00F5FF]/30 bg-[#00F5FF]/10 text-[#00F5FF]',
};

export const PriceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const [plans, setPlans] = useState<PricePlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Validation state
  const [selectedPlanForValidation, setSelectedPlanForValidation] = useState<PricePlan | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateSubscriptionActionResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<'renew' | 'upgrade' | 'downgrade' | null>(null);

  const isYearly = billingCycle === 'yearly';


  // Current user access level
  const currentPlanSortOrder = currentSubscription?.planId?.sortOrder || 1;
  const currentPlanName = currentSubscription?.planId?.name || 'starter';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. Fetch plans
        const fetchedPlans = await getPricingPlans();

        // 2. Fetch current user subscription status (swallowing error if guest/unauthorized)
        let activeSub: any = null;
        try {
          activeSub = await getCurrentSubscriptionStatus();
        } catch (subErr) {
          console.warn('Could not fetch active subscription (guest or unauthorized user):', subErr);
        }

        setCurrentSubscription(activeSub);

        // 3. Map plans to UI structure
        const mappedPlans: PricePlan[] = fetchedPlans.map((plan) => {
          const nameSlug = (plan.name || '').toLowerCase();
          const isStarter = nameSlug === 'starter' || nameSlug.includes('khoi') || nameSlug === 'khởi_nghiệp';
          const isBasic = nameSlug === 'basic' || nameSlug.includes('co_ban') || nameSlug.includes('cơ_bản');
          const isPro = nameSlug === 'professional' || nameSlug === 'pro' || nameSlug.includes('chuyen') || nameSlug.includes('chuyên');
          const isEnterprise = nameSlug === 'enterprise' || nameSlug.includes('doanh');

          const displayName = plan.displayName || plan.name || 'Gói Dịch Vụ';
          const displayDescription = plan.description || 'Không có mô tả cho gói này.';
          const planPricing = plan.pricing || { monthly: 0, yearly: 0 };
          const planFeatures = (plan.features || {}) as any;

          // Price calculations
          let monthlyPrice = '';
          let monthlyPeriod = '/Tháng';
          let monthlyNote = undefined;
          let yearlyPrice = '';
          let yearlyPeriod = '/Tháng khi trả năm';
          let yearlyNote = undefined;

          if (isStarter) {
            monthlyPrice = '0đ';
            monthlyPeriod = 'Mãi mãi miễn phí';
            yearlyPrice = '0đ';
            yearlyPeriod = 'Mãi mãi miễn phí';
          } else if (plan.isCustom) {
            monthlyPrice = 'Liên Hệ';
            monthlyPeriod = 'Tư vấn miễn phí';
            yearlyPrice = 'Liên Hệ';
            yearlyPeriod = 'Tư vấn miễn phí';
            monthlyNote = 'Giải pháp cấu hình riêng';
            yearlyNote = 'Liên hệ để nhận báo giá chi tiết';
          } else {
            const yearlyMonthlyEquiv = Math.round(planPricing.monthly * 0.8);
            const yearlyTotal = yearlyMonthlyEquiv * 12;
            monthlyPrice = planPricing.monthly.toLocaleString('vi-VN') + 'đ';
            monthlyNote = `hoặc ${yearlyMonthlyEquiv.toLocaleString('vi-VN')}đ /Tháng khi trả năm`;
            yearlyPrice = yearlyMonthlyEquiv.toLocaleString('vi-VN') + 'đ';
            yearlyNote = `Tiết kiệm 20% (Thanh toán cả năm: ${yearlyTotal.toLocaleString('vi-VN')}đ)`;
          }

          // Icon Tone & Accent Gradients
          let iconName: 'startup' | 'basic' | 'pro' | 'enterprise' = 'startup';
          let iconTone: 'slate' | 'blue' | 'gold' | 'violet' = 'slate';
          let tag = undefined;
          let tagTone: 'blue' | 'violet' | 'gold' | undefined = undefined;
          let accent = 'from-slate-600 to-slate-800';

          if (isStarter) {
            iconName = 'startup';
            iconTone = 'slate';
            accent = 'from-white/20 to-white/5';
          } else if (isBasic) {
            iconName = 'basic';
            iconTone = 'blue';
            accent = 'from-[#CCFF00]/50 to-[#CCFF00]';
          } else if (isPro || nameSlug.includes('professional') || nameSlug.includes('pro')) {
            iconName = 'pro';
            iconTone = 'gold';
            accent = 'from-[#00F5FF]/50 to-[#00F5FF]';
            tag = 'PHỔ BIẾN NHẤT';
            tagTone = 'gold';
          } else if (isEnterprise || plan.isCustom) {
            iconName = 'enterprise';
            iconTone = 'violet';
            accent = 'from-[#CCFF00]/80 to-[#CCFF00]';
            tag = 'TÙY CHỈNH';
            tagTone = 'violet';
          }

          // Features layout configuration
          const features = [
            {
              label: planFeatures.max_locations === -1 || planFeatures.max_locations === undefined ? 'Không giới hạn cơ sở' : `${planFeatures.max_locations} cơ sở`,
              included: true
            },
            {
              label: planFeatures.max_courts === -1 || planFeatures.max_courts === undefined ? 'Không giới hạn sân nhỏ' : `${planFeatures.max_courts} sân nhỏ`,
              included: true
            },
            {
              label: planFeatures.max_bookings_per_month === -1 || planFeatures.max_bookings_per_month === undefined ? 'Không giới hạn lượt đặt' : `${planFeatures.max_bookings_per_month} lượt đặt / tháng`,
              included: true
            },
            {
              label: 'Đặt sân online 24/7',
              included: !!planFeatures.online_booking
            },
            {
              label: 'Báo cáo & Phân tích doanh thu',
              included: !!planFeatures.analytics_dashboard
            },
            {
              label: 'AI Matchmaking & Ghép đội tự động',
              included: !!planFeatures.ai_matchmaking
            },
            {
              label: 'Hỗ trợ tích hợp API',
              included: !!planFeatures.api_integration
            },
            {
              label: 'Tùy biến thương hiệu riêng (Custom Branding)',
              included: !!planFeatures.custom_branding
            },
            {
              label: 'Hỗ trợ kỹ thuật ưu tiên 24/7',
              included: !!planFeatures.priority_support
            }
          ];

          // Sort features (included first)
          const sortedFeatures = [...features].sort((a, b) => {
            if (a.included === b.included) return 0;
            return a.included ? -1 : 1;
          });

          return {
            id: plan._id.toString(),
            name: displayName,
            subtitle: displayDescription,
            monthlyPrice,
            monthlyPeriod,
            monthlyNote,
            yearlyPrice,
            yearlyPeriod,
            yearlyNote,
            cta: 'Mua Ngay',
            accent,
            iconName,
            iconTone,
            tag,
            tagTone,
            features: sortedFeatures,
            highlight: isPro || nameSlug.includes('professional') || nameSlug.includes('pro'),
            sortOrder: plan.sortOrder || 1,
            isCustom: !!plan.isCustom,
            rawMonthlyPrice: planPricing.monthly || 0
          };
        });

        setPlans(mappedPlans);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError('Không thể kết nối máy chủ để tải danh sách bảng giá. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Triggers the backend validation modal to show pro-rated invoices or warnings
   */
  const handlePlanActionClick = async (plan: PricePlan, actionType: 'renew' | 'upgrade' | 'downgrade') => {
    if (plan.isCustom) {
      alert('Hệ thống đã ghi nhận yêu cầu tư vấn gói Doanh nghiệp của bạn. Đội ngũ ArenaS sẽ liên hệ với bạn qua email/sân chơi đã đăng ký trong vòng 24 giờ tới.');
      return;
    }

    setValidating(true);
    setValidationError(null);
    setValidationResult(null);
    setSelectedPlanForValidation(plan);
    setSelectedActionType(actionType);

    try {
      const result = await validateSubscriptionAction(plan.id, billingCycle);
      setValidationResult(result);
    } catch (err: any) {
      setValidationError(err.message || 'Không thể xác thực giao dịch này.');
    } finally {
      setValidating(false);
    }
  };

  /**
   * Finalizes the order and redirects to checkout passing the pro-rated price
   */
  const handleProceedToCheckout = () => {
    if (!selectedPlanForValidation || !validationResult) return;

    const netAmountStr = validationResult.pricing.netAmount.toLocaleString('vi-VN') + 'đ';
    const originalPriceStr = validationResult.pricing.basePrice.toLocaleString('vi-VN') + 'đ';

    navigate('/checkout', {
      state: {
        plan: {
          id: selectedPlanForValidation.id,
          name: selectedPlanForValidation.name,
          price: netAmountStr,
          period: billingCycle === 'yearly' ? '/ năm' : '/ tháng',
          originalPrice: billingCycle === 'yearly' && validationResult.pricing.unusedCredit > 0 ? originalPriceStr : null,
          unusedCredit: validationResult.pricing.unusedCredit,
          billingCycle
        }
      }
    });

    // Close modal
    setSelectedPlanForValidation(null);
    setValidationResult(null);
  };

  // Expose formatted expiration date
  const formatEndDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="relative overflow-hidden bg-[#0A0A0B] text-white min-h-screen selection:bg-[#CCFF00]/30 font-inter">
      {/* Background radial gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(204,255,0,0.1),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(0,245,255,0.1),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(204,255,0,0.05),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />

      <section className="relative px-4 pb-8 pt-10 sm:px-6 lg:px-8 lg:pt-14 z-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-[#CCFF00]/30 bg-[#CCFF00]/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#CCFF00]">
              BẢNG GIÁ DỊCH VỤ - ARENAS
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Chọn Gói Phù Hợp Phát Triển Cơ Sở
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Hệ thống ArenaS hỗ trợ từ chủ sân mới bắt đầu đến hệ thống chuỗi thể thao chuyên nghiệp với giải pháp đồng bộ và tối ưu nhất.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-4 rounded-full border border-white/10 bg-[#101011]/90 px-4 py-3 shadow-[0_18px_50px_-24px_rgba(204,255,0,0.15)] backdrop-blur-md sm:px-5">
              <span className={`text-sm font-semibold transition-colors duration-200 ${isYearly ? 'text-slate-400' : 'text-slate-100'}`}>
                Thanh Toán Tháng
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle((current) => (current === 'monthly' ? 'yearly' : 'monthly'))}
                className={`relative h-11 w-28 shrink-0 overflow-hidden rounded-full border transition-colors duration-300 ${isYearly ? 'border-[#CCFF00] bg-[#CCFF00]' : 'border-slate-400/50 bg-[#1A1A1C]'
                  }`}
                aria-label="Chuyển đổi thanh toán"
              >
                <span
                  className={`absolute left-1 top-1 h-9 w-9 rounded-full bg-white shadow-[0_4px_12px_-6px_rgba(15,23,42,0.65)] transition-transform duration-300 will-change-transform ${isYearly ? 'translate-x-[64px]' : 'translate-x-0'
                    }`}
                />
              </button>
              <span className={`text-sm font-semibold transition-colors duration-200 ${isYearly ? 'text-slate-100' : 'text-slate-400'}`}>
                Thanh Toán Năm
              </span>
              <span className={`rounded-full border border-[#00F5FF]/30 bg-[#00F5FF]/10 px-3 py-1.5 text-[11px] font-extrabold tracking-widest uppercase text-[#00F5FF]`}>
                Tiết kiệm 20%
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <motion.div
            className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
            variants={gridVariants}
            initial="hidden"
            animate="show"
          >
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="mt-4 text-slate-400 font-semibold">Đang truy vấn dữ liệu gói cước và trạng thái tài khoản của bạn...</p>
              </div>
            ) : error ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl">⚠️</span>
                <p className="mt-4 text-rose-400 font-bold">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                >
                  Thử lại
                </button>
              </div>
            ) : plans.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl">📂</span>
                <p className="mt-4 text-slate-400 font-semibold">Hiện chưa có gói dịch vụ nào hoạt động.</p>
              </div>
            ) : (
              plans.map((plan) => {
                const tagTone = plan.tagTone ?? 'blue';
                const iconTone = plan.iconTone ?? 'blue';
                const isEnterprisePrice = plan.monthlyPrice === 'Liên Hệ';
                const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                const displayPeriod = isYearly ? plan.yearlyPeriod : plan.monthlyPeriod;
                const displayNote = isYearly ? plan.yearlyNote : plan.monthlyNote;

                // Technical status resolution
                const isCurrentPlan = plan.name.toLowerCase() === currentPlanName.toLowerCase() || plan.id === currentSubscription?.planId?._id;
                const isDowngrade = !plan.isCustom && plan.sortOrder < currentPlanSortOrder;

                // Dynamically resolve card style, borders, badges and hover states
                let borderStyle = 'border-white/10';
                let opacityStyle = 'opacity-100';
                let hoverAnimation: any = { y: -8, scale: 1.015 };

                if (isCurrentPlan) {
                  borderStyle = 'border-[#CCFF00]/80 ring-4 ring-[#CCFF00]/15 bg-[#101011] shadow-[0_0_50px_rgba(204,255,0,0.15)] scale-[1.025] lg:scale-[1.035]';
                  hoverAnimation = { y: -4, scale: 1.028 };
                } else if (isDowngrade) {
                  opacityStyle = 'opacity-60 hover:opacity-85';
                }

                return (
                  <motion.article
                    key={plan.name}
                    variants={cardVariants}
                    whileHover={hoverAnimation}
                    whileTap={{ scale: 0.992 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }}
                    className={`relative overflow-hidden rounded-[2.5rem] border bg-[#101011] p-5 shadow-[0_22px_70px_-30px_rgba(0,0,0,0.8)] transition-all duration-300 ${borderStyle} ${opacityStyle}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${plan.accent}`} />

                    {/* Active State layout flow badge & plan tags with spacer integration to secure equal-height grids */}
                    {isCurrentPlan ? (
                      <div className="mb-5 flex flex-wrap gap-2 items-center justify-between min-h-[26px]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-3.5 py-1 text-[10px] font-black tracking-widest text-[#CCFF00] uppercase shadow-[0_0_15px_rgba(204,255,0,0.15)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                          Đang kích hoạt
                        </span>
                        {plan.tag && (
                          <span className={`rounded-full border px-4 py-1 text-[10px] font-extrabold tracking-[0.18em] ${planTagClass[tagTone]}`}>
                            {plan.tag}
                          </span>
                        )}
                      </div>
                    ) : plan.tag ? (
                      <div className="mb-5 flex justify-start min-h-[26px]">
                        <span className={`rounded-full border px-4 py-1 text-[10px] font-extrabold tracking-[0.18em] ${planTagClass[tagTone]}`}>
                          {plan.tag}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-5 min-h-[26px]" />
                    )}

                    <div className="flex items-start gap-4 mt-2">
                      <div className={`${iconBaseClass} ${iconToneClass[iconTone]}`}>
                        {planIcons[plan.iconName]}
                      </div>
                      <div>
                        <h2 className="text-[1.5rem] font-extrabold leading-tight tracking-tight text-white">
                          {plan.name}
                        </h2>
                        <p className="mt-1 max-w-[16ch] text-xs leading-5 text-slate-400 sm:max-w-none">
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
                      {displayNote && <p className="mt-2 text-[11px] leading-5 text-emerald-300 font-semibold">{displayNote}</p>}
                    </div>

                    {/* Button Rendering Logic based on Subscription Matrix */}
                    <div className="mt-8 flex flex-col gap-3">
                      {isCurrentPlan ? (
                        <>
                          <button
                            type="button"
                            disabled
                            className="w-full rounded-2xl border border-slate-700 bg-slate-800/40 text-slate-400 py-3.5 text-sm font-extrabold tracking-wide cursor-not-allowed"
                          >
                            Gói hiện tại của bạn
                          </button>

                          {/* Expiry detail under button */}
                          <div className="text-center mt-1">
                            <span className="text-[11px] text-slate-400 block">
                              {currentSubscription?.isSimulated
                                ? 'Quyền truy cập: Vô thời hạn'
                                : `Hiệu lực đến: ${formatEndDate(currentSubscription?.endDate)}`}
                            </span>
                            {!currentSubscription?.isSimulated && (
                              <button
                                type="button"
                                onClick={() => handlePlanActionClick(plan, 'renew')}
                                className="text-xs text-blue-400 hover:text-blue-300 font-bold underline mt-1 block mx-auto transition-colors"
                              >
                                Gia hạn thêm
                              </button>
                            )}
                          </div>
                        </>
                      ) : isDowngrade ? (
                        <button
                          type="button"
                          onClick={() => handlePlanActionClick(plan, 'downgrade')}
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/40 hover:bg-slate-700/60 text-slate-300 hover:text-white py-3.5 text-xs font-black tracking-[0.12em] uppercase transition-all duration-200"
                        >
                          Hạ cấp gói cước
                        </button>
                      ) : plan.isCustom ? (
                        <button
                          type="button"
                          onClick={() => handlePlanActionClick(plan, 'upgrade')}
                          className={`w-full rounded-2xl bg-[#2A3317] border border-[#CCFF00]/30 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-[#0A0A0B] py-3.5 text-xs font-black tracking-[0.16em] uppercase transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.15)] hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transform hover:-translate-y-0.5`}
                        >
                          Liên Hệ Tư Vấn
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePlanActionClick(plan, 'upgrade')}
                          className={`w-full rounded-2xl bg-[#2A3317] border border-[#CCFF00]/30 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-[#0A0A0B] py-3.5 text-xs font-black tracking-[0.16em] uppercase transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.15)] hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transform hover:-translate-y-0.5`}
                        >
                          Nâng cấp ngay
                        </button>
                      )}
                    </div>

                    <div className="mt-8 space-y-3">
                      {plan.features.map((feature, index) => (
                        <motion.div
                          key={feature.label}
                          custom={index}
                          variants={featureVariants}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true, amount: 0.15 }}
                          className={`flex items-start gap-3 text-[13px] ${feature.included ? 'text-slate-200' : 'text-slate-500'}`}
                        >
                          <span
                            className={`mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${feature.included ? 'bg-[#CCFF00]/15 text-[#CCFF00]' : 'bg-white/5 text-slate-600'
                              }`}
                          >
                            {feature.included ? '✓' : '×'}
                          </span>
                          <span className={feature.included ? 'leading-5' : 'leading-5 line-through decoration-slate-700'}>
                            {feature.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.article>
                );
              })
            )}
          </motion.div>
        </div>
      </section>

      {/* Action Verification Invoice/Limit Drawer Modal */}
      <AnimatePresence>
        {selectedPlanForValidation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#101011] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-white backdrop-blur-2xl"
            >
              {/* Top decoration glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#00F5FF] to-transparent" />

              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h3 className="text-xl font-extrabold tracking-tight">
                  Xác Thực Giao Dịch Đăng Ký Gói
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanForValidation(null);
                    setValidationResult(null);
                  }}
                  className="rounded-full bg-white/5 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {validating ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <p className="mt-4 text-sm text-slate-300 font-semibold">
                    Đang đồng bộ cơ sở dữ liệu và kiểm tra giới hạn tài nguyên của bạn...
                  </p>
                </div>
              ) : validationError ? (
                <div className="py-8 text-center">
                  <span className="text-4xl">⚠️</span>
                  <p className="mt-4 text-rose-400 font-bold">{validationError}</p>
                  <button
                    type="button"
                    onClick={() => handlePlanActionClick(selectedPlanForValidation, selectedActionType || 'upgrade')}
                    className="mt-6 rounded-xl bg-[#2A3317] border border-[#CCFF00]/30 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-[#0A0A0B] px-5 py-2.5 text-sm font-semibold"
                  >
                    Thử lại
                  </button>
                </div>
              ) : validationResult ? (
                <div className="py-4">
                  {/* --- CASE C: DOWNGRADE (BLOCKED PATH) --- */}
                  {validationResult.action === 'downgrade' ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 flex gap-3 items-start">
                        <span className="text-rose-400 text-xl font-bold"></span>
                        <div>
                          <h4 className="text-sm font-extrabold text-rose-300 uppercase tracking-wider">
                            Chặn Hạ Cấp Tự Động
                          </h4>
                          <p className="text-xs text-slate-300 leading-5 mt-1">
                            {validationResult.warningMessage}
                          </p>
                        </div>
                      </div>

                      {/* Detail footprint violations if present */}
                      {validationResult.details && validationResult.details.violations.length > 0 && (
                        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Chi Tiết Vi Phạm Giới Hạn:
                          </h5>
                          <ul className="mt-2 space-y-2 text-xs text-rose-300">
                            {validationResult.details.violations.map((v, i) => (
                              <li key={i} className="flex gap-2 items-start">
                                <span>•</span>
                                <span>{v}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[11px] text-slate-400 mt-3 leading-5">
                            {validationResult.details.recommendations.join(' ')}
                          </p>
                        </div>
                      )}

                      {/* Deactivation list */}
                      {validationResult.details && validationResult.details.featureLosses.length > 0 && (
                        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Các Tính Năng Sẽ Bị Thu Hồi:
                          </h5>
                          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                            {validationResult.details.featureLosses.map((f, i) => (
                              <li key={i} className="flex gap-2 items-center text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-3 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanForValidation(null);
                            setValidationResult(null);
                          }}
                          className="w-full rounded-2xl bg-white/5 hover:bg-white/10 py-3.5 text-sm font-bold text-slate-200 transition-all"
                        >
                          Tôi đã hiểu & Quay lại
                        </button>
                        <a
                          href="mailto:support@arenas.vn?subject=Yêu%20cầu%20hạ%20cấp%20gói%20ArenaS"
                          className="w-full rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 py-3.5 text-center text-sm font-bold text-blue-300 transition-all flex items-center justify-center"
                        >
                          Liên hệ kỹ thuật
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* --- CASE A & B: UPGRADE / RENEW (PRO-RATED BILLING PATH) --- */
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 flex gap-3 items-center">
                        <span className="text-emerald-400 text-xl font-bold">✓</span>
                        <div>
                          <h4 className="text-sm font-extrabold text-emerald-300 uppercase tracking-wider">
                            Đủ điều kiện {validationResult.action === 'upgrade' ? 'Nâng Cấp' : 'Gia Hạn'}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                            {validationResult.message}
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Invoice Table */}
                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 space-y-3 font-mono text-sm">
                        <div className="flex justify-between text-slate-400 border-b border-white/5 pb-2">
                          <span>Chi tiết hóa đơn</span>
                          <span>Đơn vị: VND</span>
                        </div>

                        <div className="flex justify-between text-slate-200">
                          <span>Gói cước đăng ký:</span>
                          <span className="font-sans font-bold">{selectedPlanForValidation.name}</span>
                        </div>

                        <div className="flex justify-between text-slate-200">
                          <span>Chu kỳ đăng ký:</span>
                          <span className="font-sans text-xs bg-slate-800 px-2 py-0.5 rounded-md text-slate-300 uppercase tracking-widest">
                            {validationResult.billingCycle === 'yearly' ? 'Cả Năm' : 'Từng Tháng'}
                          </span>
                        </div>

                        <div className="flex justify-between text-slate-200">
                          <span>Giá gốc gói mới:</span>
                          <span>{validationResult.pricing.basePrice.toLocaleString('vi-VN')} đ</span>
                        </div>

                        {validationResult.pricing.unusedCredit > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Khấu trừ ngày chưa dùng ({validationResult.pricing.daysRemaining} ngày):</span>
                            <span>-{validationResult.pricing.unusedCredit.toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}

                        <div className="flex justify-between text-white border-t border-white/10 pt-3 text-base font-extrabold">
                          <span>Thành tiền thanh toán:</span>
                          <span className="text-blue-400">{validationResult.pricing.netAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>

                      {validationResult.pricing.unusedCredit > 0 && (
                        <p className="text-[11px] leading-5 text-slate-400">
                          💡 **Quy tắc khấu trừ**: Dựa trên số ngày chưa sử dụng còn lại ở chu kỳ thanh toán hiện tại của gói cũ. Chúng tôi sẽ khấu trừ trực tiếp giá trị quy đổi này sang gói mới giúp bảo toàn tối đa quyền lợi tài chính của bạn.
                        </p>
                      )}

                      <div className="flex gap-3 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanForValidation(null);
                            setValidationResult(null);
                          }}
                          className="w-full rounded-2xl bg-white/5 hover:bg-white/10 py-3.5 text-sm font-bold text-slate-300 transition-all"
                        >
                          Hủy giao dịch
                        </button>
                        <button
                          type="button"
                          onClick={handleProceedToCheckout}
                          className="w-full rounded-2xl border border-[#CCFF00]/30 bg-[#2A3317] hover:bg-[#CCFF00] hover:text-[#0A0A0B] text-[#CCFF00] py-3.5 text-sm font-extrabold shadow-[0_0_15px_rgba(204,255,0,0.15)] transition-all"
                        >
                          Xác Nhận & Thanh Toán
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plans Comparison section */}
      <section className="relative px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-white/8 bg-[#101011] p-4 shadow-[0_30px_90px_-40px_rgba(2,8,23,0.95)] sm:p-6 lg:p-8">
          <div className="mb-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[#CCFF00]">So sánh chi tiết</span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Đầy đủ tính năng theo gói</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Hãy so sánh chi tiết tính năng của từng gói cước để lựa chọn dịch vụ phù hợp nhất cho trung tâm thể thao của bạn.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/8">
            <div className="grid grid-cols-[1.7fr_repeat(4,minmax(110px,1fr))] bg-white/4 px-4 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
              <div>Tính năng</div>
              <div className="text-center text-slate-200">Khởi Nghiệp</div>
              <div className="text-center text-slate-200">Cơ Bản</div>
              <div className="text-center text-[#00F5FF]">Chuyên Nghiệp</div>
              <div className="text-center text-[#CCFF00]">Doanh Nghiệp</div>
            </div>

            <div className="divide-y divide-white/6 bg-white/5">
              {compareRows.map((row) => (
                <div key={`${row.section}-${row.label}`} className="grid grid-cols-[1.7fr_repeat(4,minmax(110px,1fr))] items-center px-4 py-3 text-sm sm:py-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#00F5FF]/85">{row.section}</div>
                    <div className="mt-1 text-slate-200">{row.label}</div>
                  </div>
                  {row.values.map((value, index) => {
                    const positive = value === '✓';
                    const negative = value === '×';
                    return (
                      <div key={`${row.label}-${index}`} className="flex justify-center text-center text-sm font-semibold">
                        <span
                          className={`inline-flex min-h-8 items-center justify-center rounded-full px-3 py-1 ${positive
                            ? 'bg-[#CCFF00]/15 text-[#CCFF00]'
                            : negative
                              ? 'bg-white/5 text-slate-500'
                              : 'bg-[#00F5FF]/10 text-[#00F5FF]'
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
                <div className={`inline-flex rounded-xl bg-gradient-to-r px-3 py-1 text-xs font-black tracking-[0.2em] text-[#0A0A0B] ${stat.tone}`}>
                  {stat.value}
                </div>
                <p className="mt-3 text-sm text-slate-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="relative px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2.5rem] border border-white/8 bg-[#101011] p-6 shadow-[0_30px_90px_-42px_rgba(2,8,23,0.9)] sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[#00F5FF]">FAQ</span>
            <h2 className="mt-3 text-3xl font-black text-white">Câu Hỏi Thường Gặp</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Tổng hợp những thắc mắc thường thấy từ các chủ sân khi đăng ký và giao dịch trên nền tảng quản lý ArenaS.
            </p>

            <div className="mt-6 space-y-3">
              {faqs.map((faq, index) => {
                const open = openFaqIndex === index;
                return (
                  <button
                    key={faq.question}
                    type="button"
                    onClick={() => setOpenFaqIndex((current) => (current === index ? -1 : index))}
                    className={`w-full rounded-2xl border bg-white/4 px-4 py-4 text-left transition hover:bg-white/6 ${open ? 'border-[#00F5FF]/30 shadow-[0_0_15px_rgba(0,245,255,0.05)]' : 'border-white/8 hover:border-white/14'}`}
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
              <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5 hover:border-[#00F5FF]/30 transition-all hover:bg-white/5 cursor-pointer">
                <div className="text-xl font-black leading-tight text-white sm:text-2xl">Chat Tự Động</div>
                <p className="mt-2 text-xs leading-6 text-slate-300">Nhận câu trả lời và tư vấn tức thì 24/7 từ chatbot thông minh.</p>
                <div className="mt-3 text-xs font-bold text-[#00F5FF] uppercase tracking-widest">Bắt đầu chat →</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5 hover:border-[#CCFF00]/30 transition-all hover:bg-white/5 cursor-pointer">
                <div className="text-xl font-black leading-tight text-white sm:text-2xl">Gọi Điện Thoại</div>
                <p className="mt-2 text-xs leading-6 text-slate-300">Nhận hỗ trợ giải quyết thắc mắc kỹ thuật từ các tổng đài viên trực tiếp.</p>
                <div className="mt-3 text-xs font-bold text-[#CCFF00] uppercase tracking-widest">1900 0000 →</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5 hover:border-[#00F5FF]/30 transition-all hover:bg-white/5 cursor-pointer">
                <div className="text-xl font-black leading-tight text-white sm:text-2xl">Demo Chi Tiết</div>
                <p className="mt-2 text-xs leading-6 text-slate-300">Đặt lịch hướng dẫn sử dụng phần mềm và báo cáo doanh thu trực quan.</p>
                <div className="mt-3 text-xs font-bold text-[#00F5FF] uppercase tracking-widest">Đặt lịch demo →</div>
              </div>
            </div>

            <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[2.5rem] border border-[#CCFF00]/30 bg-[#0A0A0B] p-6 shadow-[0_0_50px_rgba(204,255,0,0.2)] sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#CCFF00]/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <span className="inline-flex rounded-full border border-[#CCFF00]/30 bg-[#CCFF00]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#CCFF00]">
                  Gói được yêu thích
                </span>
                <h3 className="mt-5 max-w-md text-3xl font-black leading-[1.05] text-white sm:text-5xl">
                  Miễn phí đến khi bạn sẵn sàng mở rộng
                </h3>
                <p className="mt-4 max-w-xl text-xs sm:text-sm leading-6 text-slate-300">
                  Hãy đăng ký sử dụng thử nghiệm miễn phí ngay hôm nay mà không cần liên kết thẻ ngân hàng. Nâng cấp nhanh gọn khi phát triển thêm.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/auth/register')}
                  className="rounded-2xl bg-[#CCFF00] px-5 py-3.5 text-xs font-black text-[#0A0A0B] hover:brightness-110 shadow-[0_0_15px_rgba(204,255,0,0.2)] transition duration-300 ease-out hover:-translate-y-0.5"
                >
                  ĐĂNG KÝ MIỄN PHÍ →
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-xs font-black text-white hover:bg-white/16 transition duration-300 ease-out hover:-translate-y-0.5"
                >
                  XEM DEMO HỆ THỐNG
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative px-4 pb-8 pt-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        © 2026 ArenaS. All rights reserved. Giao diện thiết kế cao cấp đồng bộ hóa hệ thống.
      </footer>
    </div>
  );
};

export default PriceListPage;
