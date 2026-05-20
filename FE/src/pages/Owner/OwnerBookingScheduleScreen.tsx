import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerBookingScheduleBoard } from './OwnerBookingScheduleBoard';
import { getOwnerCourts, getOwnerBookings, type OwnerCourt, type OwnerBooking } from '../../Axios/Axios';

type BookingViewMode = 'day' | 'week' | 'list';

const VIEW_TABS: { key: BookingViewMode; label: string }[] = [
  { key: 'day',  label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'list', label: 'Danh sách' },
];

export const OwnerBookingScheduleScreen: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem('ownerSidebarCollapsed') === '1'
  );
  
  const [viewMode, setViewMode] = useState<BookingViewMode>('day');
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [searchQuery, setSearchQuery] = useState('');

  const [courtsData, setCourtsData] = useState<OwnerCourt[]>([]);
  const [bookingsData, setBookingsData] = useState<OwnerBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<OwnerBooking[]>([]);
  
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);



  // Fetch schedule and bookings data based on selected date
  const fetchScheduleData = useCallback(async () => {
    try {
      let start = currentDate;
      let end = currentDate;

      if (viewMode === 'week') {
        const current = new Date(currentDate);
        const day = current.getDay();
        const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(current.setDate(diffToMonday));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        start = monday.toISOString().split('T')[0];
        end = sunday.toISOString().split('T')[0];
      } else if (viewMode === 'list') {
        const current = new Date(currentDate);
        const prev = new Date(current);
        prev.setDate(current.getDate() - 3);
        start = prev.toISOString().split('T')[0];
        
        const next = new Date(current);
        next.setDate(current.getDate() + 3);
        end = next.toISOString().split('T')[0];
      }

      const [courts, bks] = await Promise.all([
        getOwnerCourts(),
        getOwnerBookings({ startDate: start, endDate: end })
      ]);

      setCourtsData(courts);
      setBookingsData(bks);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu booking:', err);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // Apply filters and search
  useEffect(() => {
    let filtered = bookingsData;
    if (selectedFacility !== 'all') {
      filtered = filtered.filter(b => b.court_id === selectedFacility);
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.customer_name.toLowerCase().includes(q) || 
        (b.customer_phone && b.customer_phone.includes(q)) ||
        (b.note && b.note.toLowerCase().includes(q))
      );
    }
    setFilteredBookings(filtered);
  }, [bookingsData, selectedFacility, selectedStatus, searchQuery]);
  const filteredCourts = useMemo(() => {
    if (selectedFacility === 'all') return courtsData;
    return courtsData.filter(c => c.id === selectedFacility);
  }, [courtsData, selectedFacility]);
  // Dynamic values for STATS
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookingsData.filter(b => b.date === todayStr);

  const statsTodayCount = todayBookings.length;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const statsOngoingCount = todayBookings.filter(b => {
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return b.status === 'confirmed' && currentMinutes >= startMins && currentMinutes <= endMins;
  }).length;

  const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Format dynamic dates in Vietnamese
  const getVNDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    return `${d.getDate()} thg ${months[d.getMonth()]}, ${d.getFullYear()}`;
  };

  // Dynamically compute popular booking times (Popular Times)
  const popularTimesDistribution = useMemo(() => {
    const hoursCount = Array(24).fill(0);
    bookingsData.forEach(b => {
      const [sh] = b.start_time.split(':').map(Number);
      if (sh >= 7 && sh <= 22) {
        hoursCount[sh] += 1;
      }
    });
    const maxVal = Math.max(...hoursCount, 1);
    
    // Select specific sample times matching the chart mockup
    const targetHours = [7, 9, 11, 12, 14, 16, 17, 19, 21, 22];
    const peakVal = Math.max(...targetHours.map(h => hoursCount[h]));
    const peakHour = targetHours.find(h => hoursCount[h] === peakVal && peakVal > 0) || 12;

    return targetHours.map(h => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      height: Math.max(10, Math.round((hoursCount[h] / maxVal) * 100)),
      isPeak: h === peakHour
    }));
  }, [bookingsData]);

  // Dynamically compute live activity logs from bookings
  const liveLogs = useMemo(() => {
    if (bookingsData.length === 0) {
      return [
        { id: 1, type: 'info', title: 'Hệ thống sẵn sàng', desc: 'Đang kết nối cơ sở dữ liệu ArenaS', time: 'Vừa xong' }
      ];
    }

    const sorted = [...bookingsData]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3);

    return sorted.map((b, idx) => {
      const timeAgo = idx === 0 ? '2 phút trước' : idx === 1 ? '15 phút trước' : '45 phút trước';
      if (b.status === 'cancelled') {
        return {
          id: b._id,
          type: 'danger',
          title: 'Yêu cầu hủy sân',
          desc: `Hủy đặt: ${b.customer_name} · ${(b.total_price || 0).toLocaleString('vi-VN')}₫`,
          time: timeAgo
        };
      } else if (b.status === 'pending') {
        return {
          id: b._id,
          type: 'warning',
          title: 'Đơn đặt mới',
          desc: `Đặt lịch: ${b.customer_name} · Chờ thanh toán`,
          time: timeAgo
        };
      } else {
        return {
          id: b._id,
          type: 'success',
          title: 'Thanh toán thành công',
          desc: `Đã xác nhận: ${b.customer_name} · ${(b.total_price || 0).toLocaleString('vi-VN')}₫`,
          time: timeAgo
        };
      }
    });
  }, [bookingsData]);

  return (
    <div className="relative min-h-screen bg-[#080B11] text-slate-100 selection:bg-cyan-500/35 overflow-x-hidden font-sans">
      
      {/* Background glow effects matching mockup */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(circle at 10% 10%, rgba(0, 176, 116, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.06) 0%, transparent 35%),
            radial-gradient(circle at 50% 85%, rgba(99, 102, 241, 0.04) 0%, transparent 40%)
          `,
        }}
      />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        {/* Sidebar */}
        <OwnerSidebar
          activeKey="bookings"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />

        {/* Main Content shell */}
        <main className="arena-scroll min-h-screen px-4 py-6 md:px-8 lg:px-10 xl:max-h-screen xl:overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[1600px] space-y-7"
          >

            {/* ── Sleek Custom Topbar ── */}
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
              
              {/* Search Bar Widget */}
              <div className="relative flex items-center w-full max-w-sm">
                <span className="absolute left-4 text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm cơ sở, lịch đặt sân..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#0E1524] py-2.5 pl-11 pr-4 text-sm text-slate-200 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>

              {/* Navigation links & user controls */}
              <div className="flex items-center gap-5">
                <div className="hidden items-center gap-4 md:flex">
                  <button className="text-sm font-bold text-white border-b-2 border-cyan-400 pb-1 px-1">
                    Lịch Trình
                  </button>
                  <button className="text-sm font-semibold text-slate-500 hover:text-white pb-1 px-1 transition">
                    Báo Cáo
                  </button>
                </div>

                <div className="flex items-center gap-2.5 border-l border-white/[0.08] pl-5">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0E1524] text-slate-400 transition hover:border-white/20 hover:text-white"
                    aria-label="Thông báo"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  
                  {/* Styled date trigger */}
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                    <button className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0E1524] px-4 py-2 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white">
                      Lịch: {getVNDateLabel(currentDate)}
                    </button>
                  </div>


                </div>
              </div>
            </header>

            {/* ── Stat Cards (Redesigned matching reference exactly) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: TODAY'S BOOKINGS */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E1524]/60 p-5 shadow-[0_12px_36px_-15px_rgba(0,176,116,0.12)]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Lượt đặt hôm nay</p>
                    <p className="mt-3 text-4xl font-black text-white">{statsTodayCount}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-bold text-[#00B074] bg-[#00B074]/10 rounded-lg px-2 py-0.5">+12% so với hôm qua</span>
                </div>
                <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00B074] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Card 2: ACTIVE MATCHES */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E1524]/60 p-5 shadow-[0_12px_36px_-15px_rgba(6,182,212,0.12)]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sân đang hoạt động</p>
                    <p className="mt-3 text-4xl font-black text-white">{String(statsOngoingCount).padStart(2, '0')}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 rounded-lg px-2 py-0.5">Trận đang diễn ra</span>
                </div>
                <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              {/* Card 3: DAILY REVENUE */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E1524]/60 p-5 shadow-[0_12px_36px_-15px_rgba(99,102,241,0.12)]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Doanh thu hôm nay</p>
                    <p className="mt-3 text-4xl font-black text-white">{(todayRevenue).toLocaleString('vi-VN')}₫</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-semibold text-violet-400 bg-violet-400/10 rounded-lg px-2 py-0.5">Đạt mục tiêu</span>
                </div>
                <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

            </div>

            {/* ── Active Filter Bar & View tabs ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1524]/40 border border-white/[0.05] rounded-2xl p-3">
              {/* Select filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#0E1524] px-4 py-2 text-sm font-bold text-slate-300 hover:border-white/20 hover:text-white outline-none cursor-pointer"
                >
                  <option value="all">Tất cả cơ sở</option>
                  {courtsData.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#0E1524] px-4 py-2 text-sm font-bold text-slate-300 hover:border-white/20 hover:text-white outline-none cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="confirmed">Đã thanh toán</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Legends matching reference */}
              <div className="hidden items-center gap-4 text-xs font-semibold text-slate-400 md:flex">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00B074]" /> Đã thanh toán (Paid)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#E59E0B]" /> Chờ thanh toán (Pending)
                </span>
              </div>

              {/* Switch View tabs */}
              <div className="flex items-center overflow-hidden rounded-xl border border-white/[0.08] bg-[#0E1524] p-1">
                {VIEW_TABS.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setViewMode(tab.key)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                      viewMode === tab.key
                        ? 'bg-cyan-500 text-[#07162f] shadow-[0_4px_12px_rgba(6,182,212,0.3)]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── The Dynamic Schedule Board Wrapper ── */}
            <div className="relative z-10">
              <OwnerBookingScheduleBoard
                viewMode={viewMode}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                courtsData={filteredCourts}
                bookingsData={filteredBookings}
                fetchScheduleData={fetchScheduleData}
              />
            </div>

            {/* ── Bottom Widget Grid (Popular Times & Live Logs) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              
              {/* Widget 1: Popular Times */}
              <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#0E1524]/40 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Khung Giờ Cao Điểm</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Dựa trên dữ liệu đơn đặt sân thực tế</p>
                  </div>
                  <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-400">
                    Cập nhật trực tiếp (Live)
                  </span>
                </div>

                {/* Popular Times CSS Chart */}
                <div className="flex h-56 items-end justify-between gap-2 border-b border-white/[0.06] pb-3 pt-6 px-2">
                  {popularTimesDistribution.map((t, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 group relative">
                      {t.isPeak && (
                        <span className="absolute -top-7 rounded-md bg-cyan-400 px-1.5 py-0.5 text-[9px] font-black text-[#07162f] animate-bounce shadow-md">
                          ĐỈNH ĐIỂM
                        </span>
                      )}
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          t.isPeak
                            ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-800 group-hover:bg-slate-700'
                        }`}
                        style={{ height: `${t.height}%` }}
                      />
                      {/* X label */}
                      <span className="mt-2 text-[10px] font-bold text-slate-600 group-hover:text-slate-400">{t.hour}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 2: Live Activity Logs */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0E1524]/40 p-6 shadow-sm">
                <div className="pb-6">
                  <h3 className="text-base font-bold text-white">Nhật Ký Hoạt Động</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Các giao dịch đặt sân mới nhất</p>
                </div>

                <div className="space-y-4">
                  {liveLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 border-b border-white/[0.04] pb-3.5 last:border-0 last:pb-0">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${
                        log.type === 'success'
                          ? 'bg-[#00B074]/10 text-[#00B074]'
                          : log.type === 'warning'
                          ? 'bg-[#E59E0B]/10 text-[#E59E0B]'
                          : 'bg-[#FF5C5C]/10 text-[#FF5C5C]'
                      }`}>
                        {log.type === 'success' ? '✓' : log.type === 'warning' ? '⏰' : '✕'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{log.title}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{log.desc}</p>
                        <span className="text-[10px] text-slate-600 block mt-1">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
};
