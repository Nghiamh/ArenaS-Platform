import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';

type CourtStatus = 'Đang mở' | 'Tạm đóng';

type MiniCourt = {
  id: number;
  name: string;
  players: string;
  surface: string;
  price: string;
  status: CourtStatus;
};

type Facility = {
  id: number;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviews: number;
  bookings: number;
  monthlyRevenue: string;
  status: CourtStatus;
  openCount: string;
  amenities: string[];
  miniCourts: MiniCourt[];
};

const facilities: Facility[] = [
  {
    id: 1,
    name: 'Champions Arena',
    address: 'Q. Bình Thạnh, TP. HCM',
    image:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 187,
    bookings: 412,
    monthlyRevenue: '12.6trđ/tháng',
    status: 'Đang mở',
    openCount: '3/3 mở',
    amenities: ['Bãi Đỗ Xe', 'Phòng Tắm', 'Căn Tin', 'Phòng Thay Đồ'],
    miniCourts: [
      { id: 1, name: 'Sân A', players: '7 Người', surface: 'Cỏ Nhân Tạo', price: '450K/h', status: 'Đang mở' },
      { id: 2, name: 'Sân B', players: '7 Người', surface: 'Cỏ Nhân Tạo', price: '450K/h', status: 'Đang mở' },
      { id: 3, name: 'Sân C', players: '5 Người', surface: 'Cỏ Nhân Tạo', price: '320K/h', status: 'Đang mở' },
    ],
  },
  {
    id: 2,
    name: 'Elite Football Complex',
    address: 'Q. 7, TP. HCM',
    image:
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop',
    rating: 4.7,
    reviews: 142,
    bookings: 308,
    monthlyRevenue: '9.3trđ/tháng',
    status: 'Đang mở',
    openCount: '2/3 mở',
    amenities: ['Bãi Đỗ Xe', 'Phòng Tắm', 'Căn Tin'],
    miniCourts: [
      { id: 1, name: 'Sân 1', players: '7 Người', surface: 'Cỏ Nhân Tạo', price: '450K/h', status: 'Đang mở' },
      { id: 2, name: 'Sân 2', players: '5 Người', surface: 'Cỏ Nhân Tạo', price: '330K/h', status: 'Đang mở' },
      { id: 3, name: 'Sân 3', players: '7 Người', surface: 'Cỏ Nhân Tạo', price: '450K/h', status: 'Tạm đóng' },
    ],
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.1, staggerChildren: 0.08 },
  },
};

const statusBadgeClass: Record<CourtStatus, string> = {
  'Đang mở': 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
  'Tạm đóng': 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-300/25',
};

const StatusDot: React.FC<{ status: CourtStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass[status]}`}
  >
    <span className={`h-2 w-2 rounded-full ${status === 'Đang mở' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
    {status}
  </span>
);

const FacilityCard: React.FC<{ facility: Facility; index: number }> = ({ facility, index }) => {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.article
      variants={itemVariants}
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#081734]/85 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.75)]"
    >
      <div className="grid gap-0 lg:grid-cols-[230px_minmax(0,1fr)]">
        <div className="relative min-h-[166px] overflow-hidden">
          <img src={facility.image} alt={facility.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#040c20]/15 via-[#040c20]/45 to-[#040c20]/80 lg:bg-gradient-to-r" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-300 ring-1 ring-emerald-400/35">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Mở
          </span>
        </div>

        <div className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-4xl font-black tracking-tight text-white sm:text-3xl">{facility.name}</h3>
              <p className="mt-2 text-sm text-slate-400">📍 {facility.address}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <p className="font-bold text-amber-300">★ {facility.rating} <span className="font-medium text-slate-500">({facility.reviews})</span></p>
                <p className="font-semibold text-slate-300">{facility.bookings} lượt đặt</p>
                <p className="font-semibold text-blue-300">{facility.monthlyRevenue}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusDot status={facility.status} />
              <button className="rounded-full border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:border-blue-300/45 hover:text-blue-200">✎</button>
              <button className="rounded-full border border-rose-400/35 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20">🗑</button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {facility.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full bg-white/5 px-3 py-1 text-sm font-medium text-slate-300 ring-1 ring-white/10">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#07152f]/85">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03] lg:px-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-slate-400">◈</span>
            <p className="text-lg font-bold text-white">Sân nhỏ</p>
            <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-sm font-semibold text-blue-200">{facility.openCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500">+ Thêm sân nhỏ</button>
            <span className={`text-slate-400 transition ${expanded ? 'rotate-180' : ''}`}>⌃</span>
          </div>
        </button>

        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="overflow-x-auto border-t border-white/10">
            <table className="min-w-full text-left">
              <thead className="bg-white/[0.02] text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Tên sân</th>
                  <th className="px-6 py-4">Số người</th>
                  <th className="px-6 py-4">Mặt sân</th>
                  <th className="px-6 py-4">Giá/Giờ</th>
                  <th className="px-6 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {facility.miniCourts.map((court) => (
                  <tr key={`${facility.id}-${court.id}`} className="border-t border-white/5 text-slate-200">
                    <td className="px-6 py-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/25 text-sm font-bold text-blue-200">{court.id}</span>
                      <span className="ml-3 text-2xl font-bold text-white sm:text-xl">{court.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-200">{court.players}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{court.surface}</td>
                    <td className="px-6 py-4 text-xl font-black text-white sm:text-lg">{court.price}</td>
                    <td className="px-6 py-4">
                      <StatusDot status={court.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.article>
  );
};

export const OwnerManageCourtScreen: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');

  const filteredFacilities = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return facilities;
    }

    return facilities.filter(
      (facility) =>
        facility.name.toLowerCase().includes(keyword) || facility.address.toLowerCase().includes(keyword)
    );
  }, [searchValue]);

  const totalFacilities = facilities.length;
  const openMiniCourts = facilities.reduce((sum, item) => {
    const open = item.miniCourts.filter((court) => court.status === 'Đang mở').length;
    return sum + open;
  }, 0);
  const totalMiniCourts = facilities.reduce((sum, item) => sum + item.miniCourts.length, 0);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(37,99,235,0.17),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.1),transparent_28%)]" />

      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
        <OwnerSidebar activeKey="courts" />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full space-y-5">
          <motion.header variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-3xl">Quản Lý Sân</h1>
              <p className="mt-1 text-sm text-slate-400">Xin chào, Minh Tuấn - Thứ Hai, 02/03/2026</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
                🔔
              </button>
            </div>
          </motion.header>

          <motion.section variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#081734]/80 px-5 py-3">
                <p className="text-sm font-semibold text-slate-400">🏟 {totalFacilities} cơ sở</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#081734]/80 px-5 py-3">
                <p className="text-sm font-semibold text-slate-400">🧱 {openMiniCourts} / {totalMiniCourts} sân đang mở</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#081734]/80 px-4 py-2">
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Tìm cơ sở..."
                  className="w-44 border-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none sm:w-56"
                />
              </div>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-lg font-bold text-white shadow-[0_16px_35px_-18px_rgba(59,130,246,0.95)] transition hover:bg-blue-500 sm:text-base"
              >
                + Thêm Cơ Sở
              </motion.button>
            </div>
          </motion.section>

          <motion.section variants={containerVariants} className="space-y-4">
            {filteredFacilities.length === 0 ? (
              <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 bg-[#081734]/75 px-6 py-12 text-center">
                <p className="text-lg font-semibold text-slate-300">Không tìm thấy cơ sở phù hợp.</p>
              </motion.div>
            ) : (
              filteredFacilities.map((facility, index) => (
                <FacilityCard key={facility.id} facility={facility} index={index} />
              ))
            )}
          </motion.section>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
