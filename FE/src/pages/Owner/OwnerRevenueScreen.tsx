import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';
import { getOwnerRevenue, type OwnerRevenueResponse } from '../../Axios/Axios';

export const OwnerRevenueScreen: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('ownerSidebarCollapsed') === '1');
  const [revenueData, setRevenueData] = useState<OwnerRevenueResponse | null>(null);

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const data = await getOwnerRevenue();
        setRevenueData(data);
      } catch (error) {
        console.error("Lỗi khi lấy doanh thu:", error);
      }
    };
    fetchRevenue();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return (amount / 1000).toLocaleString('vi-VN') + 'Kđ';
    }
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const cards = revenueData ? [
    { label: 'Doanh thu hôm nay', value: formatCurrency(revenueData.today), trend: `${revenueData.todayTrend >= 0 ? '+' : ''}${revenueData.todayTrend}%` },
    { label: 'Doanh thu tuần', value: formatCurrency(revenueData.week), trend: `${revenueData.weekTrend >= 0 ? '+' : ''}${revenueData.weekTrend}%` },
    { label: 'Doanh thu tháng', value: formatCurrency(revenueData.month), trend: `${revenueData.monthTrend >= 0 ? '+' : ''}${revenueData.monthTrend}%` },
  ] : [
    { label: 'Doanh thu hôm nay', value: '...', trend: '...' },
    { label: 'Doanh thu tuần', value: '...', trend: '...', },
    { label: 'Doanh thu tháng', value: '...', trend: '...' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.1),transparent_28%)]" />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-columns] xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="revenue"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
            <header className="border-b border-white/10 pb-4">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-3xl">Doanh Thu</h1>
              <p className="mt-1 text-sm text-slate-400">Theo dõi tổng quan doanh thu theo ngày, tuần, tháng.</p>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <motion.article
                  key={card.label}
                  whileHover={{ y: -3 }}
                  className="rounded-3xl border border-white/10 bg-[#081734]/85 p-5 shadow-[0_20px_45px_-30px_rgba(2,6,23,0.9)]"
                >
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-2 text-4xl font-black tracking-tight text-white sm:text-3xl">{card.value}</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-300">{card.trend} so với kỳ trước</p>
                </motion.article>
              ))}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#081734]/85 p-6">
              <h2 className="text-2xl font-black text-white">Biểu đồ đang cập nhật</h2>
              <p className="mt-2 text-slate-300">
                Màn hình doanh thu chi tiết đã sẵn sàng route. Bạn có thể nối dữ liệu thật từ API để hiển thị biểu đồ theo thời gian.
              </p>
            </section>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
