import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';
import { getOwnerCourts, getOwnerBookings, getOwnerRevenue, type OwnerCourt, type OwnerBooking, type OwnerRevenueResponse } from '../../Axios/Axios';

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



type RecentBooking = {
  customer: string;
  field: string;
  time: string;
  price: string;
  status: 'Đã xác nhận' | 'Chờ thanh toán' | 'Đã hoàn tất';
};



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

const buildLinePath = (points: RevenuePoint[], maxValue: number): string => {
  if (points.length === 0) return '';
  const width = 680;
  const height = 260;
  // Make the chart scale dynamically, ensure max is at least 1 to avoid divide by zero
  const max = Math.max(maxValue * 1.2, 10);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('ownerSidebarCollapsed') === '1');
  const [courts, setCourts] = useState<OwnerCourt[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [revenueData, setRevenueData] = useState<OwnerRevenueResponse | null>(null);

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cts, bks, rev] = await Promise.all([
          getOwnerCourts(),
          getOwnerBookings(), // Lấy toàn bộ lịch đặt để phân tích
          getOwnerRevenue()
        ]);
        setCourts(cts);
        setBookings(bks);
        setRevenueData(rev);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tổng quan:", error);
      }
    };
    fetchData();
  }, []);

  // 1. Tính toán Thống kê tổng quan (StatCards)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyBookingsCount = bookings.filter(b => new Date(b.date) >= startOfWeek).length;
  const avgRating = courts.length > 0
    ? (courts.reduce((sum, c) => sum + (c.avg_rating || 0), 0) / courts.length).toFixed(1)
    : '0.0';

  const statCards: StatCard[] = [
    {
      title: 'Doanh Thu Tháng Này',
      value: revenueData ? `${revenueData.month.toLocaleString('vi-VN')}` : '...',
      change: revenueData ? `${revenueData.monthTrend >= 0 ? '+' : ''}${revenueData.monthTrend}% so với kỳ trước` : '...',
      icon: '$',
      gradient: 'from-blue-600/30 via-blue-500/15 to-transparent',
    },
    {
      title: 'Lượt Đặt Tuần Này',
      value: weeklyBookingsCount.toString(),
      change: 'Cập nhật trực tiếp',
      icon: '🗓',
      gradient: 'from-cyan-500/30 via-sky-500/15 to-transparent',
    },
    {
      title: 'Tỷ Lệ Lấp Đầy',
      value: courts.length > 0 ? 'Phân tích từ lịch' : '...', // Bạn có thể tính logic thật
      change: 'Cập nhật trực tiếp',
      icon: '⚡',
      gradient: 'from-amber-500/30 via-orange-500/15 to-transparent',
    },
    {
      title: 'Đánh Giá Trung Bình',
      value: avgRating,
      change: 'Điểm trung bình các sân',
      icon: '☆',
      gradient: 'from-violet-500/30 via-indigo-500/15 to-transparent',
    },
  ];

  // 2. Tính toán Doanh thu 6 tháng qua (Chỉ tính các booking đã thanh toán)
  const revenueSeries = useMemo(() => {
    const series: RevenuePoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `Th${d.getMonth() + 1}`;

      const monthBookings = bookings.filter(b => {
        const bd = new Date(b.date);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear() && (b.status === 'confirmed' || b.status === 'completed');
      });
      const rev = monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      series.push({ month: monthStr, value: rev }); // Giá trị thực tế
    }
    return series;
  }, [bookings]);

  const maxSeriesValue = Math.max(...revenueSeries.map(r => r.value), 10);
  const path = buildLinePath(revenueSeries, maxSeriesValue);

  // 3. Xếp hạng Sân nổi bật
  const topFields = useMemo(() => {
    const stats: Record<string, { bookings: number, revenue: number }> = {};
    bookings.forEach(b => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        if (!stats[b.court_id]) stats[b.court_id] = { bookings: 0, revenue: 0 };
        stats[b.court_id].bookings += 1;
        stats[b.court_id].revenue += b.total_price || 0;
      }
    });

    const arr = Object.keys(stats).map(courtId => {
      const court = courts.find(c => c.id === courtId);
      return {
        id: courtId,
        name: court?.name || 'Sân không xác định',
        bookings: stats[courtId].bookings,
        revenue: stats[courtId].revenue,
        rating: court?.avg_rating || 0,
        fillRate: Math.min(100, Math.round((stats[courtId].bookings / (10 * 30)) * 100)) // Ước tính fill rate
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 3); // Lấy top 3

    return arr.map((f, i) => ({
      rank: i + 1,
      name: f.name,
      bookings: f.bookings,
      fillRate: f.fillRate,
      revenue: (f.revenue).toLocaleString('vi-VN') + '₫',
      rating: f.rating
    }));
  }, [bookings, courts]);

  // 4. Lượt đặt gần đây
  const recentBookingsList = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5) // Lấy 5 lượt mới nhất
      .map(b => {
        const court = courts.find(c => c.id === b.court_id);
        let statusText: RecentBooking['status'] = 'Chờ thanh toán';
        if (b.status === 'confirmed') statusText = 'Đã xác nhận';
        if (b.status === 'completed') statusText = 'Đã hoàn tất';

        return {
          customer: b.customer_name,
          field: court?.name || 'Sân không rõ',
          time: `${b.date.split('-').reverse().join('/')} - ${b.start_time}`,
          price: (b.total_price || 0).toLocaleString('vi-VN') + '₫',
          status: statusText
        };
      });
  }, [bookings, courts]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(37,99,235,0.2),transparent_34%),radial-gradient(circle_at_75%_0%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:linear-gradient(rgba(71,85,105,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.2)_1px,transparent_1px)] [background-size:70px_70px]" />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-columns] xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="overview"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            <motion.header variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Tổng Quan</h1>
                <p className="mt-1 text-sm text-slate-400">Dữ liệu thực tế trực tiếp từ hệ thống ArenaS</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
                  🔔
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
                      const max = Math.max(maxSeriesValue * 1.2, 10);
                      const y = 260 - (point.value / max) * 260;

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
                    {recentBookingsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Chưa có lượt đặt sân nào.</td>
                      </tr>
                    ) : (
                      recentBookingsList.map((booking, index) => (
                        <motion.tr
                          key={`${booking.customer}-${booking.time}-${index}`}
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
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass[booking.status] || 'bg-slate-500/20 text-slate-300'}`}>
                              {booking.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
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
