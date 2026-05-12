import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

interface StatCard {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface BookingItem {
  id: string;
  courtName: string;
  sportType: string;
  date: string;
  time: string;
  customer: string;
  revenue: number;
  status: 'completed' | 'pending' | 'cancelled';
}

const mockBookings: BookingItem[] = [
  {
    id: '001',
    courtName: 'Sân Bóng Đá A1',
    sportType: 'Bóng Đá',
    date: '2026-04-28',
    time: '18:00 - 20:00',
    customer: 'Nguyễn Văn A',
    revenue: 250000,
    status: 'completed',
  },
  {
    id: '002',
    courtName: 'Sân Cầu Lông B2',
    sportType: 'Cầu Lông',
    date: '2026-04-29',
    time: '19:00 - 21:00',
    customer: 'Trần Thị B',
    revenue: 180000,
    status: 'completed',
  },
  {
    id: '003',
    courtName: 'Sân Pickleball C1',
    sportType: 'Pickleball',
    date: '2026-04-30',
    time: '10:00 - 11:30',
    customer: 'Lê Văn C',
    revenue: 150000,
    status: 'pending',
  },
  {
    id: '004',
    courtName: 'Sân Bóng Đá A2',
    sportType: 'Bóng Đá',
    date: '2026-04-30',
    time: '20:00 - 22:00',
    customer: 'Phạm Minh D',
    revenue: 250000,
    status: 'pending',
  },
  {
    id: '005',
    courtName: 'Sân Cầu Lông B1',
    sportType: 'Cầu Lông',
    date: '2026-04-25',
    time: '17:00 - 19:00',
    customer: 'Vũ Anh E',
    revenue: 180000,
    status: 'cancelled',
  },
];

export const AdminDashboardPage: React.FC = () => {
  // Calculate statistics
  const stats = useMemo<StatCard[]>(() => {
    const totalBookings = mockBookings.length;
    const completedBookings = mockBookings.filter((b) => b.status === 'completed').length;
    const totalRevenue = mockBookings.reduce((sum, b) => sum + b.revenue, 0);
    const avgRevenue = Math.round(totalRevenue / totalBookings);

    return [
      {
        label: 'Tổng Booking',
        value: totalBookings,
        change: 12.5,
        icon: '📅',
        color: 'bg-blue-500/10 border-blue-500/30',
      },
      {
        label: 'Booking Hoàn Thành',
        value: completedBookings,
        change: 8.2,
        icon: '✅',
        color: 'bg-green-500/10 border-green-500/30',
      },
      {
        label: 'Tổng Doanh Thu',
        value: `${(totalRevenue / 1000000).toFixed(1)}M₫`,
        change: 15.3,
        icon: '💰',
        color: 'bg-emerald-500/10 border-emerald-500/30',
      },
      {
        label: 'Trung Bình Doanh Thu',
        value: `${(avgRevenue / 1000).toFixed(0)}K₫`,
        change: 5.1,
        icon: '📊',
        color: 'bg-purple-500/10 border-purple-500/30',
      },
    ];
  }, []);

  // Chart data for revenue
  const chartData = [
    { day: 'Thứ 2', revenue: 2.5 },
    { day: 'Thứ 3', revenue: 3.8 },
    { day: 'Thứ 4', revenue: 3.2 },
    { day: 'Thứ 5', revenue: 4.1 },
    { day: 'Thứ 6', revenue: 5.2 },
    { day: 'Thứ 7', revenue: 4.8 },
    { day: 'CN', revenue: 3.9 },
  ];

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: 'bg-green-500/20 text-green-300 border border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border border-red-500/30',
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getSportTypeColor = (sportType: string) => {
    const colors: Record<string, string> = {
      'Bóng Đá': 'text-blue-400',
      'Cầu Lông': 'text-yellow-400',
      Pickleball: 'text-pink-400',
    };
    return colors[sportType] || 'text-gray-400';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Quản Lý Sân Thể Thao
          </h1>
          <p className="mt-3 text-slate-400">
            Tổng quan hoạt động quản lý sân bóng đá, cầu lông, pickleball
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-lg border border-slate-700/50 ${stat.color} p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:shadow-lg hover:shadow-cyan-500/10`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  <p className="mt-2 text-xs text-emerald-400 font-semibold">
                    ↑ {stat.change}% vs tuần trước
                  </p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-sm p-6 hover:border-slate-600/50 transition-all duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Doanh Thu Hàng Tuần</h2>
              <p className="text-sm text-slate-400 mt-1">Tổng doanh thu theo ngày trong tuần</p>
            </div>

            <div className="flex items-end justify-between h-48 gap-2">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 gap-2">
                  <div className="relative w-full flex items-end justify-center">
                    <div
                      className="w-full max-w-12 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg transition-all hover:from-cyan-400 hover:to-blue-400 cursor-pointer group"
                      style={{
                        height: `${(item.revenue / maxRevenue) * 160}px`,
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.revenue}M₫
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 text-center">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-sm p-6 hover:border-slate-600/50 transition-all duration-300">
            <h2 className="text-xl font-bold mb-6">Thống Kê Loại Sân</h2>
            <div className="space-y-4">
              {[
                { sport: 'Bóng Đá', count: 12, color: 'bg-blue-500', percentage: 45 },
                { sport: 'Cầu Lông', count: 8, color: 'bg-yellow-500', percentage: 30 },
                { sport: 'Pickleball', count: 7, color: 'bg-pink-500', percentage: 25 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.sport}</span>
                    <span className="text-xs text-slate-400">{item.count} sân</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3">Tổng số sân: 27</p>
              <Link
                to="/admin/manage-stadiums"
                className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium transition-colors duration-200 hover:bg-blue-700"
              >
                Quản Lý Sân & Duyệt Sân
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-sm p-6 hover:border-slate-600/50 transition-all duration-300">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Booking Gần Đây</h2>
            <p className="text-sm text-slate-400 mt-1">Danh sách 5 booking mới nhất</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-300">Sân</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-300">Loại</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-300">Khách Hàng</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-300">Ngày & Giờ</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-300">Doanh Thu</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-300">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {mockBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-200"
                  >
                    <td className="px-4 py-4 font-medium">{booking.courtName}</td>
                    <td className="px-4 py-4">
                      <span className={`font-semibold ${getSportTypeColor(booking.sportType)}`}>
                        {booking.sportType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{booking.customer}</td>
                    <td className="px-4 py-4 text-slate-400">
                      <div className="text-xs">{booking.date}</div>
                      <div className="text-xs">{booking.time}</div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-400">
                      {booking.revenue.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {booking.status === 'completed'
                          ? 'Hoàn Thành'
                          : booking.status === 'pending'
                            ? 'Chờ Xác Nhận'
                            : 'Đã Hủy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Xem Tất Cả →
            </button>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-slate-700/30 hover:bg-slate-700/50 rounded text-xs font-medium transition-colors">
                ← Trước
              </button>
              <button className="px-3 py-1 bg-slate-700/30 hover:bg-slate-700/50 rounded text-xs font-medium transition-colors">
                Sau →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Quản Lý Sân & Duyệt Sân', icon: '🏟️', color: 'from-blue-600 to-cyan-700', to: '/admin/manage-stadiums' },
            { label: 'Quản Lý Booking', icon: '📋', color: 'from-green-600 to-green-700', to: '#' },
            { label: 'Quản Lý Người Dùng', icon: '👥', color: 'from-purple-600 to-purple-700' },
            { label: 'Báo Cáo Doanh Thu', icon: '📈', color: 'from-orange-600 to-orange-700' },
          ].map((action, idx) => (
            <Link
              key={idx}
              to={action.to ?? '#'}
              className={`rounded-lg bg-gradient-to-br ${action.color} p-6 text-center hover:shadow-lg hover:shadow-current/30 transition-all duration-300 transform hover:scale-105`}
            >
              <div className="text-4xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-sm">{action.label}</h3>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};
