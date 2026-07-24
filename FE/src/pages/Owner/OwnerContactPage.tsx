import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { submitOwnerApplication } from '../../Axios/Axios';

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

// ─── Static data ─────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18M8 14h2M12 14h2M16 14h2" />
      </svg>
    ),
    title: 'Quản Lý Lịch Đặt',
    desc: 'Tất cả lượt đặt trực tuyến và trực tiếp hiển thị trong một lịch duy nhất. Cập nhật tức thì, không bao giờ xảy ra xung đột khung giờ.',
    accent: '#00F5FF',
    bg: 'rgba(0,245,255,0.08)',
    border: 'rgba(0,245,255,0.2)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20h16M7 16v-5M12 16V8M17 16v-8" />
      </svg>
    ),
    title: 'Báo Cáo Doanh Thu',
    desc: 'Biểu đồ trực quan theo ngày/tuần/tháng. Biết chính xác sân nào đang sinh lời và khung giờ nào hot nhất trong ngày.',
    accent: '#CCFF00',
    bg: 'rgba(204,255,0,0.08)',
    border: 'rgba(204,255,0,0.2)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Phê Duyệt Nhanh',
    desc: 'Hồ sơ sân được xét duyệt trong vòng 24 giờ làm việc. Đội ngũ hỗ trợ tận tình từ khi đăng ký đến khi vận hành ổn định.',
    accent: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Tiếp Cận Hàng Nghìn Khách',
    desc: 'Hệ thống giới thiệu thông minh đưa sân của bạn đến đúng người đang tìm kiếm trong khu vực — mà không tốn chi phí quảng cáo.',
    accent: '#F472B6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.2)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </svg>
    ),
    title: 'Thanh Toán Tự Động',
    desc: 'Tiền từ mỗi lượt đặt được chuyển về tài khoản theo chu kỳ minh bạch. Không cần nhắc nợ, không mất công đối soát.',
    accent: '#34D399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" />
      </svg>
    ),
    title: 'Xây Dựng Uy Tín',
    desc: 'Hệ thống đánh giá xác thực từ người dùng thực giúp sân bạn nổi bật. Rating cao đồng nghĩa với nhiều lượt đặt hơn mỗi ngày.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Điền Thông Tin Liên Hệ',
    desc: 'Gửi form đăng ký bên dưới. Đội ngũ ArenaS sẽ liên hệ lại trong vòng 2 giờ làm việc để tư vấn chi tiết.',
  },
  {
    num: '02',
    title: 'Xác Minh & Tư Vấn',
    desc: 'Nhân viên tư vấn sẽ hướng dẫn bổ sung hồ sơ, giải đáp thắc mắc và đề xuất gói phù hợp nhất với quy mô sân.',
  },
  {
    num: '03',
    title: 'Kích Hoạt & Vận Hành',
    desc: 'Tài khoản được kích hoạt, sân xuất hiện trên nền tảng và bắt đầu nhận lượt đặt ngay trong ngày đầu tiên.',
  },
];

const FAQS = [
  {
    q: 'Chi phí tham gia hệ thống ArenaS là bao nhiêu?',
    a: 'ArenaS cung cấp nhiều gói linh hoạt từ miễn phí đến cao cấp. Gói cơ bản không mất phí đăng ký — chỉ thu phí hoa hồng nhỏ theo mỗi giao dịch thành công.',
  },
  {
    q: 'Tôi cần chuẩn bị những gì để đăng ký?',
    a: 'Bạn cần: ảnh sân thực tế, thông tin giá thuê các khung giờ, số điện thoại liên hệ và tài khoản ngân hàng để nhận thanh toán. Không cần hồ sơ pháp lý phức tạp.',
  },
  {
    q: 'Mất bao lâu để sân tôi xuất hiện trên ứng dụng?',
    a: 'Thông thường 24 giờ kể từ khi hồ sơ được duyệt. Trong giờ làm việc, nhiều trường hợp được phê duyệt và kích hoạt trong vòng vài tiếng.',
  },
  {
    q: 'ArenaS hỗ trợ bao nhiêu môn thể thao?',
    a: 'Hiện tại ArenaS hỗ trợ bóng đá, cầu lông, tennis, bóng rổ, pickleball và bóng chuyền. Danh sách đang được mở rộng thêm theo nhu cầu thị trường.',
  },
  {
    q: 'Nếu có sự cố kỹ thuật thì liên hệ ai?',
    a: 'Đội ngũ hỗ trợ kỹ thuật trực tuyến 8h–22h mỗi ngày qua hotline và chat trong ứng dụng. Với gói Pro trở lên, có hỗ trợ ưu tiên 24/7.',
  },
];

const STATS = [
  { value: '500+', label: 'Sân đang hoạt động' },
  { value: '15,000+', label: 'Lượt đặt mỗi tháng' },
  { value: '4.8★', label: 'Đánh giá trung bình' },
  { value: '98%', label: 'Chủ sân hài lòng' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function OwnerContactPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', venueName: '', address: '',
    identityCard: '', bankAccount: '', sport: '', largeCourts: '', smallCourts: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const token = localStorage.getItem('accessToken')?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      setSubmitError('Bạn cần đăng nhập để gửi hồ sơ. Vui lòng đăng nhập hoặc tạo tài khoản trước.');
      return;
    }

    if (!form.name.trim() || !form.venueName.trim() || !form.address.trim() || !form.phone.trim() || !form.identityCard.trim()) {
      setSubmitError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      return;
    }

    setSubmitting(true);
    try {
      const sportDesc = form.sport ? `Môn thể thao: ${form.sport}.` : '';
      const msgDesc = form.message.trim() ? ` ${form.message.trim()}` : '';
      await submitOwnerApplication({
        contactName: form.name.trim(),
        businessName: form.venueName.trim(),
        businessAddress: form.address.trim(),
        phone: form.phone.trim(),
        identityCard: form.identityCard.trim(),
        bankAccount: form.bankAccount.trim() || undefined,
        description: `${sportDesc}${msgDesc}`.trim() || undefined,
        largeCourts: form.largeCourts ? Number(form.largeCourts) : undefined,
        smallCourts: form.smallCourts ? Number(form.smallCourts) : undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể gửi hồ sơ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative overflow-hidden bg-deep text-white min-h-screen selection:bg-accent-primary/30 font-inter">

      {/* ── Background decorations ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(circle at 10% 10%, rgba(var(--accent-primary-rgb),0.07) 0%, transparent 50%),
            radial-gradient(circle at 90% 20%, rgba(var(--accent-secondary-rgb),0.06) 0%, transparent 45%),
            radial-gradient(circle at 50% 80%, rgba(var(--accent-light-rgb),0.05) 0%, transparent 40%)
          `,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative z-10">

        {/* ══════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════ */}
        <section className="pt-20 pb-16 px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse" />
                Dành Cho Chủ Sân
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
            >
              Biến Sân Thể Thao Của Bạn&nbsp;
              <span className="bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                Thành Nguồn Thu Nhập Ổn Định
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg max-w-xl mx-auto"
            >
              Hàng nghìn chủ sân đang dùng ArenaS để lấp đầy lịch đặt mỗi ngày. Đăng ký hôm nay —
              đội ngũ chúng tôi sẽ liên hệ tư vấn trong vòng 2 giờ làm việc.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={scrollToForm}
                className="rounded-full px-7 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] bg-accent-primary text-deep"
              >
                Đăng Ký Ngay
              </button>
              <button
                onClick={() => navigate('/bang-gia')}
                className="rounded-full border border-accent-secondary/30 bg-accent-secondary/10 px-7 py-3 text-sm font-semibold text-accent-secondary transition-all duration-200 hover:bg-accent-secondary/20"
              >
                Xem Bảng Giá
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            STATS BAR
        ══════════════════════════════════════════════════════════════ */}
        <section className="px-6 pb-16">
          <motion.div
            className="mx-auto max-w-4xl rounded-[2rem] border border-white/8 bg-white/[0.03] p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-accent-primary sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-xs text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            BENEFITS GRID
        ══════════════════════════════════════════════════════════════ */}
        <section className="px-6 pb-20">
          <motion.div
            className="mx-auto max-w-5xl"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <h2
                className="text-2xl font-black tracking-tight sm:text-3xl"
              >
                Tại Sao Chủ Sân Chọn ArenaS?
              </h2>
              <p className="mt-3 text-sm text-white/50">
                Nền tảng được thiết kế chuyên biệt để tối ưu vận hành và tăng doanh thu cho chủ sân.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((b, i) => {
                const colorConfig = [
                  { text: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/20' },
                  { text: 'text-accent-secondary', bg: 'bg-accent-secondary/10', border: 'border-accent-secondary/20' },
                  { text: 'text-accent-light', bg: 'bg-accent-light/10', border: 'border-accent-light/20' }
                ][i % 3];
                return (
                  <motion.div
                    key={b.title}
                    variants={cardVariants}
                    className={`group rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] ${colorConfig.border} ${colorConfig.bg}`}
                  >
                    <div className={`mb-3 inline-flex rounded-xl p-2.5 ${colorConfig.bg} ${colorConfig.text}`}>
                      {b.icon}
                    </div>
                    <h3 className="mb-1.5 text-sm font-bold text-white">{b.title}</h3>
                    <p className="text-xs leading-relaxed text-white/55">{b.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════════════ */}
        <section className="px-6 pb-20">
          <motion.div
            className="mx-auto max-w-4xl"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <h2
                className="text-2xl font-black tracking-tight sm:text-3xl"
              >
                Quy Trình Đơn Giản, 3 Bước
              </h2>
              <p className="mt-3 text-sm text-white/50">Từ lúc đăng ký đến khi nhận lượt đặt đầu tiên — nhanh hơn bạn nghĩ.</p>
            </motion.div>

            <div className="relative grid gap-6 sm:grid-cols-3">
              {/* connector line desktop */}
              <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px sm:block bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />

              {STEPS.map((s, i) => {
                const colorConfig = [
                  { text: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/30' },
                  { text: 'text-accent-secondary', bg: 'bg-accent-secondary/10', border: 'border-accent-secondary/30' },
                  { text: 'text-accent-light', bg: 'bg-accent-light/10', border: 'border-accent-light/30' }
                ][i % 3];
                return (
                  <motion.div
                    key={s.num}
                    variants={cardVariants}
                    className="relative rounded-[2rem] border border-white/8 bg-[#101011] p-6 text-center"
                  >
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-xl font-black border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                    >
                      {s.num}
                    </div>
                    <h3 className="mb-2 text-sm font-bold text-white">{s.title}</h3>
                    <p className="text-xs leading-relaxed text-white/55">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CONTACT FORM
        ══════════════════════════════════════════════════════════════ */}
        <section className="px-6 pb-20" ref={formRef}>
          <div className="mx-auto max-w-2xl">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
            >
              <motion.div variants={fadeUp} className="mb-10 text-center">
                <h2
                  className="text-2xl font-black tracking-tight sm:text-3xl"
                >
                  Đăng Ký Hợp Tác
                </h2>
                <p className="mt-3 text-sm text-white/50">
                  Điền thông tin bên dưới — đội ngũ tư vấn sẽ liên hệ lại trong vòng 2 giờ làm việc.
                </p>
              </motion.div>

              <motion.div
                variants={cardVariants}
                className="rounded-[2.5rem] border border-white/8 bg-[#101011] p-8"
              >
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center gap-5 py-10 text-center"
                    >
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10 border-2 border-accent-primary/40"
                      >
                        <svg viewBox="0 0 24 24" className="h-9 w-9 text-accent-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">Đã Nhận Thông Tin!</h3>
                        <p className="mt-2 text-sm text-white/60">
                          Cảm ơn <span className="text-accent-primary font-semibold">{form.name || 'bạn'}</span> đã đăng ký.
                          Hồ sơ của bạn đã được gửi đến admin ArenaS để xét duyệt.{' '}
                          {form.phone ? (
                            <><br />Chúng tôi sẽ liên hệ qua số <span className="text-accent-secondary">{form.phone}</span> sớm nhất.</>
                          ) : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <button
                          onClick={() => navigate('/register')}
                          className="rounded-full px-6 py-2.5 text-sm font-bold transition-all hover:scale-[1.03] bg-accent-primary text-deep"
                        >
                          Tạo tài khoản ngay →
                        </button>
                        <button
                          onClick={() => { setSubmitted(false); setSubmitError(''); setForm({ name: '', phone: '', email: '', venueName: '', address: '', identityCard: '', bankAccount: '', sport: '', largeCourts: '', smallCourts: '', message: '' }); }}
                          className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm text-white/70 transition-all hover:bg-white/10"
                        >
                          Gửi lại
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      {/* Row 1: Họ tên + SĐT */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">
                            Họ và tên <span className="text-accent-primary">*</span>
                          </label>
                          <input name="name" value={form.name} onChange={handleChange} required placeholder="Nguyễn Văn A"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">
                            Số điện thoại <span className="text-accent-primary">*</span>
                          </label>
                          <input name="phone" value={form.phone} onChange={handleChange} required type="tel" placeholder="0909 123 456"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20" />
                        </div>
                      </div>

                      {/* Row 2: Email */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-white/70">Email</label>
                        <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="example@email.com"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20" />
                      </div>

                      {/* Row 3: Tên sân + Môn */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">
                            Tên sân / cơ sở <span className="text-accent-primary">*</span>
                          </label>
                          <input name="venueName" value={form.venueName} onChange={handleChange} required placeholder="Sân Bóng Thành Công"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">Môn thể thao</label>
                          <select name="sport" value={form.sport} onChange={handleChange}
                            className="w-full rounded-xl border border-white/10 bg-[#101011] px-4 py-2.5 text-sm text-white/80 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20">
                            <option value="">Chọn môn...</option>
                            <option value="Bóng đá">Bóng đá</option>
                            <option value="Cầu lông">Cầu lông</option>
                            <option value="Tennis">Tennis</option>
                            <option value="Bóng rổ">Bóng rổ</option>
                            <option value="Pickleball">Pickleball</option>
                            <option value="Bóng chuyền">Bóng chuyền</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Địa chỉ kinh doanh */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-white/70">
                          Địa chỉ kinh doanh <span className="text-accent-primary">*</span>
                        </label>
                        <input name="address" value={form.address} onChange={handleChange} required placeholder="123 Nguyễn Văn Linh, Q.7, TP.HCM"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20" />
                      </div>

                      {/* Row 5: CMND + Tài khoản NH */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">
                            CMND / CCCD <span className="text-accent-primary">*</span>
                          </label>
                          <input name="identityCard" value={form.identityCard} onChange={handleChange} required placeholder="079201234567"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">Số tài khoản ngân hàng</label>
                          <input name="bankAccount" value={form.bankAccount} onChange={handleChange} placeholder="Không bắt buộc"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20" />
                        </div>
                      </div>

                      {/* Row 6: Số lượng sân lớn + sân nhỏ */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">Số lượng sân lớn</label>
                          <input name="largeCourts" value={form.largeCourts} onChange={handleChange} type="number" min="0" placeholder="VD: 3"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-white/70">Số lượng sân nhỏ</label>
                          <input name="smallCourts" value={form.smallCourts} onChange={handleChange} type="number" min="0" placeholder="VD: 5"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20" />
                        </div>
                      </div>

                      {/* Row 7: Tin nhắn thêm */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-white/70">Tin nhắn thêm</label>
                        <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                          placeholder="Câu hỏi, yêu cầu cụ thể..."
                          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/20" />
                      </div>

                      {/* Error message */}
                      {submitError && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                          {submitError}
                          {submitError.includes('đăng nhập') && (
                            <div className="mt-2 flex gap-2">
                              <button type="button" onClick={() => navigate('/login')}
                                className="rounded-lg bg-accent-primary px-3 py-1 text-xs font-bold text-deep">
                                Đăng nhập
                              </button>
                              <button type="button" onClick={() => navigate('/register')}
                                className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
                                Tạo tài khoản
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 w-full rounded-full py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-accent-primary text-deep"
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Đang gửi...
                          </span>
                        ) : 'Gửi Đăng Ký'}
                      </button>

                      <p className="text-center text-[11px] text-white/30">
                        Thông tin của bạn được bảo mật tuyệt đối. Không spam, không chia sẻ bên thứ ba.
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Quick contact strip */}
              <motion.div
                variants={fadeUp}
                className="mt-6 flex flex-wrap items-center justify-center gap-4"
              >
                <a
                  href="tel:0337095968"
                  className="inline-flex items-center gap-2 rounded-full border border-accent-secondary/25 bg-accent-secondary/10 px-5 py-2 text-xs font-semibold text-accent-secondary transition-all hover:bg-accent-secondary/15"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Gọi ngay: 0337095968
                </a>
                <a
                  href="mailto:ArenaSport2605@gmail.com"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-white/60 transition-all hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                  ArenaSport2605@gmail.com
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════════ */}
        <section className="px-6 pb-20">
          <motion.div
            className="mx-auto max-w-2xl"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            <motion.div variants={fadeUp} className="mb-10 text-center">
              <h2
                className="text-2xl font-black tracking-tight sm:text-3xl"
              >
                Câu Hỏi Thường Gặp
              </h2>
            </motion.div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  className="overflow-hidden rounded-2xl border border-white/8 bg-[#101011]"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="text-sm font-semibold text-white">{faq.q}</span>
                    <span
                      className="flex-shrink-0 transition-transform duration-300 text-accent-primary"
                      style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300"
                    style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-white/55">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════════ */}
        <section className="px-6 pb-20">
          <motion.div
            className="mx-auto max-w-3xl rounded-[2.5rem] border border-accent-primary/20 p-10 text-center bg-gradient-to-br from-accent-primary/10 to-accent-secondary/5"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-2xl font-black tracking-tight sm:text-3xl"
            >
              Sẵn Sàng Bắt Đầu?
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Gia nhập cộng đồng 500+ chủ sân đang phát triển cùng ArenaS. Đăng ký miễn phí, không ràng buộc.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={scrollToForm}
                className="rounded-full px-8 py-3 text-sm font-bold transition-all hover:scale-[1.03] active:scale-[0.98] bg-accent-primary text-deep"
              >
                Đăng Ký Hợp Tác
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-semibold text-white/70 transition-all hover:bg-white/10"
              >
                Tạo Tài Khoản
              </button>
            </div>
          </motion.div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/8 py-8 text-center text-xs text-white/30">
          © 2026 ArenaS. All rights reserved.
        </footer>

      </div>
    </div>
  );
}
