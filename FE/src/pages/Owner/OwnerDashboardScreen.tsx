import React from 'react';
import { motion } from 'framer-motion';

type StatCard = {
  title: string;
  value: string;
  change: string;
  icon: string;
  gradient: string;
};

type RevenuePoint = {
  month: string;
  value: number;
};

type TopField = {
  rank: number;
  name: string;
  bookings: number;
  fillRate: number;
  revenue: string;
  rating: number;
};

type RecentBooking = {
  customer: string;
  field: string;
  time: string;
  price: string;
  status: 'Đã xác nhận' | 'Chờ thanh toán' | 'Đã hoàn tất';
};

const statCards: StatCard[] = [
  {
    title: 'Doanh Thu Tháng Này',
    value: '28.450Kđ',
    change: '+12.5% so với tháng trước',
    icon: '$',
    gradient: 'from-blue-600/30 via-blue-500/15 to-transparent',
  },
  {
    title: 'Lượt Đặt Tuần Này',
    value: '94',
    change: '+8.2% so với tuần trước',
    icon: '🗓',
    gradient: 'from-cyan-500/30 via-sky-500/15 to-transparent',
  },
  {
    title: 'Tỷ Lệ Lấp Đầy',
    value: '78%',
    change: '+5.1% so với tháng trước',
    icon: '⚡',
    gradient: 'from-amber-500/30 via-orange-500/15 to-transparent',
  },
  {
    title: 'Đánh Giá Trung Bình',
    value: '4.8',
    change: '+0.2 so với tháng trước',
    icon: '☆',
    gradient: 'from-violet-500/30 via-indigo-500/15 to-transparent',
  },
];

const revenueSeries: RevenuePoint[] = [
  { month: 'Th10', value: 18 },
  { month: 'Th11', value: 22 },
  { month: 'Th12', value: 31 },
  { month: 'Th1', value: 25 },
  { month: 'Th2', value: 19 },
  { month: 'Th3', value: 28 },
];

const topFields: TopField[] = [
  {
    rank: 1,
    name: 'Champions Arena',
    bookings: 42,
    fillRate: 87,
    revenue: '12.600Kđ',
    rating: 4.9,
  },
  {
    rank: 2,
    name: 'Elite Football',
    bookings: 31,
    fillRate: 72,
    revenue: '9.300Kđ',
    rating: 4.7,
  },
  {
    rank: 3,
    name: 'Victory Stadium',
    bookings: 21,
    fillRate: 56,
    revenue: '6.550Kđ',
    rating: 4.6,
  },
];

const recentBookings: RecentBooking[] = [
  {
    customer: 'Nguyễn Văn An',
    field: 'Champions Arena',
    time: 'Hôm nay - 18:00',
    price: '900Kđ',
    status: 'Đã xác nhận',
  },
  {
    customer: 'Trần Minh Quân',
    field: 'Elite Football',
    time: 'Hôm nay - 20:00',
    price: '750Kđ',
    status: 'Chờ thanh toán',
  },
  {
    customer: 'Hoàng Gia Bảo',
    field: 'Victory Stadium',
    time: 'Ngày mai - 16:00',
    price: '850Kđ',
    status: 'Đã hoàn tất',
  },
];

const menuItems = [
  { name: 'Tổng Quan', count: undefined },
  { name: 'Quản Lý Sân', count: 3 },
  { name: 'Doanh Thu', count: undefined },
  { name: 'Lịch Đặt Sân', count: 8 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const statusClass: Record<RecentBooking['status'], string> = {
  'Đã xác nhận': 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40',
  'Chờ thanh toán': 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40',
  'Đã hoàn tất': 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/40',
};

const buildLinePath = (points: RevenuePoint[]): string => {
  const width = 680;
  const height = 260;
  const max = 32;
  const min = 0;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.value - min) / (max - min)) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

export const OwnerDashboardScreen: React.FC = () => {
  const path = buildLinePath(revenueSeries);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(37,99,235,0.2),transparent_34%),radial-gradient(circle_at_75%_0%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:linear-gradient(rgba(71,85,105,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.2)_1px,transparent_1px)] [background-size:70px_70px]" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="arena-scroll relative border-b border-white/10 bg-gradient-to-b from-[#020A1B]/95 to-[#010819]/95 px-5 py-6 backdrop-blur-xl xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto xl:border-b-0 xl:border-r"
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-300/35 to-transparent" />

          <div className="flex h-full flex-col">
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-blue-200/15 bg-[#081734]/75 px-3 py-3 shadow-[0_18px_45px_-28px_rgba(59,130,246,0.65)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white shadow-[0_10px_30px_-16px_rgba(37,99,235,1)]">A</div>
              <div>
                <p className="text-[1.35rem] font-extrabold leading-none tracking-tight text-white">ArenaS</p>
                <p className="mt-1 text-xs font-medium text-blue-300">Dashboard Chủ Sân</p>
              </div>
            </div>

            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quản Lý</p>
            <nav className="space-y-2">
              {menuItems.map((item, index) => {
                const isActive = index === 0;
                return (
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    key={item.name}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                      isActive
                        ? 'border border-blue-200/65 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_12px_34px_-18px_rgba(59,130,246,0.95)]'
                        : 'border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold">{item.name}</span>
                    {typeof item.count === 'number' ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        {item.count}
                      </span>
                    ) : (
                      <span className="text-sm opacity-80 transition group-hover:translate-x-0.5">›</span>
                    )}
                  </motion.button>
                );
              })}
            </nav>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Hệ Thống</p>
              <div className="space-y-1 px-2 text-slate-300">
                <button className="block w-full rounded-lg px-2 py-2 text-left transition hover:bg-white/5">Về Trang Chủ</button>
                <button className="block w-full rounded-lg px-2 py-2 text-left transition hover:bg-white/5">Cài Đặt</button>
                <button className="block w-full rounded-lg px-2 py-2 text-left text-red-300 transition hover:bg-red-500/10">Đăng Xuất</button>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="rounded-2xl border border-white/10 bg-[#0A1B3E]/75 p-3 shadow-[0_20px_45px_-30px_rgba(2,6,23,1)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-black text-white">MT</div>
                  <div>
                    <p className="text-sm font-bold text-white">Minh Tuấn</p>
                    <p className="text-xs text-slate-300">minhtuan@arenas.vn</p>
                  </div>
                  <span className="ml-auto rounded-lg bg-blue-500/25 px-2 py-1 text-xs font-bold text-blue-200">Pro</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            <motion.header variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Tổng Quan</h1>
                <p className="mt-1 text-sm text-slate-400">Xin chào, Minh Tuấn - Thứ Hai, 02/03/2026</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
                  🔔
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-[0_12px_30px_-14px_rgba(37,99,235,0.9)]">
                  MT
                </button>
              </div>
            </motion.header>

            <motion.section variants={staggerContainer} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <motion.article
                  key={card.title}
                  variants={fadeUp}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#071632]/85 p-5 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.8)]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
                  <div className="relative z-10">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg text-blue-200">{card.icon}</div>
                    <p className="text-sm text-slate-300">{card.title}</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-white">{card.value}</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-300">↗ {card.change}</p>
                  </div>
                </motion.article>
              ))}
            </motion.section>

            <section className="grid gap-5 xl:grid-cols-[2.2fr_1.1fr]">
              <motion.article
                variants={fadeUp}
                className="rounded-3xl border border-white/10 bg-[#071632]/90 p-5 shadow-[0_26px_55px_-30px_rgba(0,0,0,0.8)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Doanh Thu 6 Tháng</h2>
                    <p className="mt-1 text-sm text-slate-400">Đơn vị: nghìn đồng (Kđ)</p>
                  </div>
                  <button className="text-sm font-semibold text-blue-300 transition hover:text-blue-200">Xem chi tiết →</button>
                </div>

                <div className="relative h-[320px] rounded-2xl border border-white/5 bg-[#061127] p-4">
                  <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(51,65,85,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.25)_1px,transparent_1px)] [background-size:18%_20%]" />

                  <svg viewBox="0 0 700 300" className="relative z-10 h-full w-full">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>

                    <motion.path
                      d={path}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0.3 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.4 }}
                    />

                    {revenueSeries.map((point, index) => {
                      const x = (index / (revenueSeries.length - 1)) * 680;
                      const y = 260 - (point.value / 32) * 260;

                      return (
                        <g key={point.month}>
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#1d4ed8"
                            stroke="#7dd3fc"
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.08, type: 'spring', stiffness: 160 }}
                          />
                          <text x={x} y={290} textAnchor="middle" fill="#7ea6d9" fontSize="18" fontWeight="600">
                            {point.month}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </motion.article>

              <motion.article variants={fadeUp} className="rounded-3xl border border-white/10 bg-[#071632]/90 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-3xl font-black tracking-tight text-white">Sân Nổi Bật</h2>
                  <button className="text-sm font-semibold text-blue-300 transition hover:text-blue-200">Quản lý →</button>
                </div>

                <div className="space-y-5">
                  {topFields.map((field, index) => (
                    <motion.div
                      key={field.name}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.11 }}
                      className="rounded-2xl border border-white/8 bg-[#081A3D]/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-sm font-bold text-amber-200">
                            {field.rank}
                          </span>
                          <p className="text-lg font-bold text-white">{field.name}</p>
                        </div>
                        <p className="text-sm text-slate-400">{field.bookings} lượt</p>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${field.fillRate}%` }}
                          transition={{ duration: 0.9, delay: 0.45 + index * 0.1 }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <p className="font-semibold text-blue-300">{field.revenue}</p>
                        <p className="font-semibold text-amber-300">★ {field.rating}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.article>
            </section>

            <motion.section variants={fadeUp} className="rounded-3xl border border-white/10 bg-[#071632]/90 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-3xl font-black tracking-tight text-white">Lượt Đặt Gần Đây</h2>
                <button className="text-sm font-semibold text-blue-300 transition hover:text-blue-200">Xem tất cả →</button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3 text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="px-4 py-2 font-semibold">Khách hàng</th>
                      <th className="px-4 py-2 font-semibold">Sân</th>
                      <th className="px-4 py-2 font-semibold">Khung giờ</th>
                      <th className="px-4 py-2 font-semibold">Giá trị</th>
                      <th className="px-4 py-2 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking, index) => (
                      <motion.tr
                        key={`${booking.customer}-${booking.time}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.08 }}
                        className="rounded-2xl bg-[#081A3A]/80 text-slate-100"
                      >
                        <td className="rounded-l-xl px-4 py-4 font-semibold">{booking.customer}</td>
                        <td className="px-4 py-4 text-slate-300">{booking.field}</td>
                        <td className="px-4 py-4 text-slate-300">{booking.time}</td>
                        <td className="px-4 py-4 font-bold text-blue-300">{booking.price}</td>
                        <td className="rounded-r-xl px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass[booking.status]}`}>
                            {booking.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
