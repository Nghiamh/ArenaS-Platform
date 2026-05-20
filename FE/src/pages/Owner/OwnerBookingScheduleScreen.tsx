import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerBookingScheduleBoard } from './OwnerBookingScheduleBoard';
import { getOwnerCourts, getOwnerBookings, type OwnerCourt, type OwnerBooking } from '../../Axios/Axios';

type BookingViewMode = 'day' | 'week' | 'list';

const VIEW_TABS: { key: BookingViewMode; label: string }[] = [
  { key: 'day',  label: '📅 Ngày' },
  { key: 'week', label: '📆 Tuần' },
  { key: 'list', label: '📋 Danh sách' },
];

export const OwnerBookingScheduleScreen: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem('ownerSidebarCollapsed') === '1'
  );
  
  const [viewMode, setViewMode] = useState<BookingViewMode>('day');
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ownerName, setOwnerName] = useState('Chủ sân');

  const [courtsData, setCourtsData] = useState<OwnerCourt[]>([]);
  const [bookingsData, setBookingsData] = useState<OwnerBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<OwnerBooking[]>([]);
  
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  // Load owner's name
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const u = JSON.parse(userStr);
        setOwnerName(u.name || u.userName || 'Chủ sân');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch schedule and bookings data based on currently selected date and mode
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
        // For list view, show bookings for +/- 3 days around currentDate for a broader list
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

  // Apply filters
  useEffect(() => {
    let filtered = bookingsData;
    if (selectedFacility !== 'all') {
      filtered = filtered.filter(b => b.court_id === selectedFacility);
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }
    setFilteredBookings(filtered);
  }, [bookingsData, selectedFacility, selectedStatus]);

  // Format header dates
  const formatVNHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dayName}, ${dd}/${mm}/${d.getFullYear()}`;
  };

  // ── Dynamic stats calculations ──
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
  const revenueValue = todayRevenue >= 1000000 
    ? `${(todayRevenue / 1000000).toFixed(1)}` 
    : `${(todayRevenue / 1000).toFixed(0)}`;
  const revenueUnit = todayRevenue >= 1000000 ? 'M₫' : 'K₫';

  const totalSubCourts = courtsData.reduce((sum, c) => sum + (c.sub_courts?.length || 0), 0);
  const totalSlotsAvailableToday = totalSubCourts * 32; // 16 hours open = 32 half-hour slots
  const totalSlotsBookedToday = todayBookings.reduce((sum, b) => {
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    const diffHours = (eh + em/60) - (sh + sm/60);
    return sum + diffHours * 2;
  }, 0);
  const occupancyRate = totalSlotsAvailableToday > 0 
    ? Math.min(100, Math.round((totalSlotsBookedToday / totalSlotsAvailableToday) * 100))
    : 0;

  const stats = [
    { label: 'Lượt đặt hôm nay', value: String(statsTodayCount), unit: '',    color: '#3b82f6', glow: 'rgba(59,130,246,0.25)' },
    { label: 'Đang diễn ra',     value: String(statsOngoingCount), unit: '',    color: '#10b981', glow: 'rgba(16,185,129,0.25)' },
    { label: 'Doanh thu hôm nay',value: revenueValue, unit: revenueUnit, color: '#8b5cf6', glow: 'rgba(139,92,246,0.25)' },
    { label: 'Tỉ lệ kín sân',   value: String(occupancyRate),   unit: '%',   color: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  ];

  return (
    <div className="relative min-h-screen bg-[#020B1F] text-slate-100" style={{ overflow: 'hidden' }}>
      {/* Background glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 15% 15%, rgba(37,99,235,0.14) 0%, transparent 35%),
            radial-gradient(circle at 85% 8%,  rgba(14,165,233,0.08) 0%, transparent 30%),
            radial-gradient(circle at 50% 90%, rgba(139,92,246,0.06) 0%, transparent 40%)
          `,
        }}
      />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="bookings"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[1600px] space-y-6"
          >

            {/* ── Page header ── */}
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Lịch Đặt Sân</h1>
                <p className="mt-1 text-sm text-slate-500">Xin chào, {ownerName} 👋 · {formatVNHeader(currentDate)}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-lg transition hover:border-white/20 hover:bg-white/[0.08]"
                  aria-label="Thông báo"
                >
                  🔔
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 font-black text-white" style={{ boxShadow: '0 10px 24px -10px rgba(99,102,241,0.7)' }}>
                  {ownerName.substring(0, 1).toUpperCase()}
                </div>
              </div>
            </header>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                  style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 16px 30px -20px ${s.glow}` }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6, borderRadius: '2px 2px 0 0' }} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {s.value}<span className="ml-0.5 text-base font-bold" style={{ color: s.color }}>{s.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#07162f] px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-white outline-none cursor-pointer"
                >
                  <option value="all">Tất cả cơ sở</option>
                  {courtsData.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#07162f] px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:text-white outline-none cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* View tabs */}
              <div className="flex items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                {VIEW_TABS.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setViewMode(tab.key)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                      viewMode === tab.key
                        ? 'bg-blue-600 text-white shadow-[0_6px_18px_-8px_rgba(37,99,235,0.9)]'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Board ── */}
            <OwnerBookingScheduleBoard
              viewMode={viewMode}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              courtsData={courtsData}
              bookingsData={filteredBookings}
              fetchScheduleData={fetchScheduleData}
            />

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-4 text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-wider">Nguồn đặt:</span>
              <span className="flex items-center gap-1.5">📱 Qua App</span>
              <span className="flex items-center gap-1.5">📞 Điện thoại</span>
              <span className="flex items-center gap-1.5">🚶 Đến trực tiếp</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Sân hoạt động
                <span className="ml-2 h-2 w-2 rounded-full bg-slate-600" /> Đóng cửa
              </span>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
};
