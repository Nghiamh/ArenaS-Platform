import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

type FacilityFormState = {
  name: string;
  address: string;
  image: string;
  monthlyRevenue: string;
  amenitiesText: string;
  status: CourtStatus;
};

type MiniCourtFormState = {
  name: string;
  players: string;
  surface: string;
  price: string;
  status: CourtStatus;
};

const initialFacilities: Facility[] = [
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
  {
    id: 3,
    name: 'Victory Stadium',
    address: 'Q. Thủ Đức, TP. HCM',
    image:
      'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 96,
    bookings: 229,
    monthlyRevenue: '8.1trđ/tháng',
    status: 'Đang mở',
    openCount: '2/3 mở',
    amenities: ['Bãi Đỗ Xe', 'Căn Tin', 'Phòng Thay Đồ'],
    miniCourts: [
      { id: 1, name: 'Sân X', players: '7 Người', surface: 'Cỏ Nhân Tạo', price: '430K/h', status: 'Đang mở' },
      { id: 2, name: 'Sân Y', players: '5 Người', surface: 'Cỏ Nhân Tạo', price: '300K/h', status: 'Đang mở' },
      { id: 3, name: 'Sân Z', players: '7 Người', surface: 'Cỏ Nhân Tạo', price: '430K/h', status: 'Tạm đóng' },
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

const modalBackdropVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalCardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
};

const toFormFacility = (facility: Facility): FacilityFormState => ({
  name: facility.name,
  address: facility.address,
  image: facility.image,
  monthlyRevenue: facility.monthlyRevenue,
  amenitiesText: facility.amenities.join(', '),
  status: facility.status,
});

const createEmptyFacilityForm = (): FacilityFormState => ({
  name: '',
  address: '',
  image:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
  monthlyRevenue: '0trđ/tháng',
  amenitiesText: '',
  status: 'Đang mở',
});

const toFormMiniCourt = (court: MiniCourt): MiniCourtFormState => ({
  name: court.name,
  players: court.players,
  surface: court.surface,
  price: court.price,
  status: court.status,
});

const createEmptyMiniCourtForm = (): MiniCourtFormState => ({
  name: '',
  players: '7 Người',
  surface: 'Cỏ Nhân Tạo',
  price: '450K/h',
  status: 'Đang mở',
});

const getOpenCountLabel = (courts: MiniCourt[]) => {
  const open = courts.filter((court) => court.status === 'Đang mở').length;
  return `${open}/${courts.length} mở`;
};

const StatusDot: React.FC<{ status: CourtStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass[status]}`}
  >
    <span className={`h-2 w-2 rounded-full ${status === 'Đang mở' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
    {status}
  </span>
);

const FacilityCard: React.FC<{
  facility: Facility;
  index: number;
  onEditFacility: (facility: Facility) => void;
  onDeleteFacility: (facility: Facility) => void;
  onToggleFacilityStatus: (facilityId: number) => void;
  onAddCourt: (facilityId: number) => void;
  onEditCourt: (facilityId: number, court: MiniCourt) => void;
  onDeleteCourt: (facilityId: number, court: MiniCourt) => void;
}> = ({
  facility,
  index,
  onEditFacility,
  onDeleteFacility,
  onToggleFacilityStatus,
  onAddCourt,
  onEditCourt,
  onDeleteCourt,
}) => {
  const [expanded, setExpanded] = useState(index === 0);
  const openCount = getOpenCountLabel(facility.miniCourts);

  return (
    <motion.article
      variants={itemVariants}
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#081734]/85 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.75)]"
    >
      <div className="grid gap-0 lg:grid-cols-[230px_minmax(0,1fr)]">
        <div className="relative min-h-[166px] overflow-hidden">
          <img src={facility.image} alt={facility.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#040c20]/15 via-[#040c20]/45 to-[#040c20]/80 lg:bg-gradient-to-r" />
          <span
            className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${
              facility.status === 'Đang mở'
                ? 'border-emerald-300/35 bg-emerald-500/20 text-emerald-300'
                : 'border-rose-300/35 bg-rose-500/20 text-rose-200'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${facility.status === 'Đang mở' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            {facility.status === 'Đang mở' ? 'Mở' : 'Tạm đóng'}
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
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggleFacilityStatus(facility.id)}
                className={`group inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm font-semibold transition ${
                  facility.status === 'Đang mở'
                    ? 'border-emerald-300/65 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-300/35 bg-slate-500/15 text-slate-300'
                }`}
                aria-label="Bật tắt trạng thái cơ sở"
              >
                <span
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                    facility.status === 'Đang mở' ? 'bg-emerald-500/45' : 'bg-slate-500/45'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow transition ${
                      facility.status === 'Đang mở' ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </span>
                <span>{facility.status}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onEditFacility(facility)}
                className="h-10 w-10 rounded-full border border-white/15 bg-white/5 text-slate-300 transition hover:border-blue-300/45 hover:text-blue-200"
                aria-label="Sửa cơ sở"
              >
                ✎
              </motion.button>
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onDeleteFacility(facility)}
                className="h-10 w-10 rounded-full border border-rose-400/35 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                aria-label="Xóa cơ sở"
              >
                🗑
              </motion.button>
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
        <div
          className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03] lg:px-6"
          onClick={() => setExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setExpanded((prev) => !prev);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-slate-400">◈</span>
            <p className="text-lg font-bold text-white">Sân nhỏ</p>
            <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-sm font-semibold text-blue-200">{openCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={(event) => {
                event.stopPropagation();
                onAddCourt(facility.id);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-[#0e7490] to-[#06b6d4] px-5 py-2.5 text-base font-bold text-cyan-50 shadow-[0_12px_28px_-16px_rgba(8,145,178,0.95)] transition hover:brightness-110 sm:text-sm"
            >
              <span className="text-lg leading-none">＋</span>
              <span>Thêm sân nhỏ</span>
            </motion.button>
            <span
              className={`inline-block pr-1 text-xl font-semibold text-slate-400 transition ${
                expanded ? 'rotate-90' : 'rotate-0'
              }`}
            >
              ›
            </span>
          </div>
        </div>

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
                  <tr key={`${facility.id}-${court.id}`} className="group border-t border-white/5 text-slate-200">
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
                      <div className="flex items-center gap-2">
                        <StatusDot status={court.status} />
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onEditCourt(facility.id, court)}
                          className="opacity-0 transition group-hover:opacity-100 rounded-lg border border-blue-300/35 bg-blue-500/10 px-2 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-500/20"
                        >
                          Sửa
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDeleteCourt(facility.id, court)}
                          className="opacity-0 transition group-hover:opacity-100 rounded-lg border border-rose-400/35 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
                        >
                          Xóa
                        </motion.button>
                      </div>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('ownerSidebarCollapsed') === '1');
  const [facilityList, setFacilityList] = useState<Facility[]>(initialFacilities);
  const [facilityModal, setFacilityModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; facilityId?: number }>({
    isOpen: false,
    mode: 'create',
  });
  const [miniCourtModal, setMiniCourtModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    facilityId?: number;
    courtId?: number;
  }>({
    isOpen: false,
    mode: 'create',
  });
  const [facilityForm, setFacilityForm] = useState<FacilityFormState>(createEmptyFacilityForm());
  const [miniCourtForm, setMiniCourtForm] = useState<MiniCourtFormState>(createEmptyMiniCourtForm());
  const [deleteState, setDeleteState] = useState<
    | { isOpen: false }
    | { isOpen: true; type: 'facility' | 'court'; facilityId: number; courtId?: number; name: string }
  >({ isOpen: false });

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const filteredFacilities = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return facilityList;
    }

    return facilityList.filter(
      (facility) =>
        facility.name.toLowerCase().includes(keyword) || facility.address.toLowerCase().includes(keyword)
    );
  }, [facilityList, searchValue]);

  const handleOpenCreateFacility = () => {
    setFacilityForm(createEmptyFacilityForm());
    setFacilityModal({ isOpen: true, mode: 'create' });
  };

  const handleOpenEditFacility = (facility: Facility) => {
    setFacilityForm(toFormFacility(facility));
    setFacilityModal({ isOpen: true, mode: 'edit', facilityId: facility.id });
  };

  const handleSubmitFacility = () => {
    if (!facilityForm.name.trim() || !facilityForm.address.trim()) {
      return;
    }

    if (facilityModal.mode === 'create') {
      setFacilityList((prev) => {
        const nextId = prev.length ? Math.max(...prev.map((item) => item.id)) + 1 : 1;
        const amenities = facilityForm.amenitiesText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        const nextItem: Facility = {
          id: nextId,
          name: facilityForm.name.trim(),
          address: facilityForm.address.trim(),
          image: facilityForm.image.trim(),
          rating: 0,
          reviews: 0,
          bookings: 0,
          monthlyRevenue: facilityForm.monthlyRevenue.trim(),
          status: facilityForm.status,
          openCount: '0/0 mở',
          amenities,
          miniCourts: [],
        };

        return [nextItem, ...prev];
      });
    } else if (facilityModal.facilityId) {
      setFacilityList((prev) =>
        prev.map((facility) => {
          if (facility.id !== facilityModal.facilityId) {
            return facility;
          }

          const amenities = facilityForm.amenitiesText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

          return {
            ...facility,
            name: facilityForm.name.trim(),
            address: facilityForm.address.trim(),
            image: facilityForm.image.trim(),
            monthlyRevenue: facilityForm.monthlyRevenue.trim(),
            status: facilityForm.status,
            amenities,
          };
        })
      );
    }

    setFacilityModal({ isOpen: false, mode: 'create' });
  };

  const handleOpenCreateMiniCourt = (facilityId: number) => {
    setMiniCourtForm(createEmptyMiniCourtForm());
    setMiniCourtModal({ isOpen: true, mode: 'create', facilityId });
  };

  const handleOpenEditMiniCourt = (facilityId: number, court: MiniCourt) => {
    setMiniCourtForm(toFormMiniCourt(court));
    setMiniCourtModal({ isOpen: true, mode: 'edit', facilityId, courtId: court.id });
  };

  const handleSubmitMiniCourt = () => {
    if (!miniCourtModal.facilityId || !miniCourtForm.name.trim()) {
      return;
    }

    setFacilityList((prev) =>
      prev.map((facility) => {
        if (facility.id !== miniCourtModal.facilityId) {
          return facility;
        }

        if (miniCourtModal.mode === 'create') {
          const nextId = facility.miniCourts.length
            ? Math.max(...facility.miniCourts.map((court) => court.id)) + 1
            : 1;

          const nextCourt: MiniCourt = {
            id: nextId,
            name: miniCourtForm.name.trim(),
            players: miniCourtForm.players.trim(),
            surface: miniCourtForm.surface.trim(),
            price: miniCourtForm.price.trim(),
            status: miniCourtForm.status,
          };

          return {
            ...facility,
            miniCourts: [...facility.miniCourts, nextCourt],
          };
        }

        return {
          ...facility,
          miniCourts: facility.miniCourts.map((court) =>
            court.id === miniCourtModal.courtId
              ? {
                  ...court,
                  name: miniCourtForm.name.trim(),
                  players: miniCourtForm.players.trim(),
                  surface: miniCourtForm.surface.trim(),
                  price: miniCourtForm.price.trim(),
                  status: miniCourtForm.status,
                }
              : court
          ),
        };
      })
    );

    setMiniCourtModal({ isOpen: false, mode: 'create' });
  };

  const handleAskDeleteFacility = (facility: Facility) => {
    setDeleteState({ isOpen: true, type: 'facility', facilityId: facility.id, name: facility.name });
  };

  const handleAskDeleteMiniCourt = (facilityId: number, court: MiniCourt) => {
    setDeleteState({ isOpen: true, type: 'court', facilityId, courtId: court.id, name: court.name });
  };

  const handleToggleFacilityStatus = (facilityId: number) => {
    setFacilityList((prev) =>
      prev.map((facility) =>
        facility.id !== facilityId
          ? facility
          : {
              ...facility,
              status: facility.status === 'Đang mở' ? 'Tạm đóng' : 'Đang mở',
            }
      )
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteState.isOpen) {
      return;
    }

    if (deleteState.type === 'facility') {
      setFacilityList((prev) => prev.filter((facility) => facility.id !== deleteState.facilityId));
    } else {
      setFacilityList((prev) =>
        prev.map((facility) =>
          facility.id !== deleteState.facilityId
            ? facility
            : {
                ...facility,
                miniCourts: facility.miniCourts.filter((court) => court.id !== deleteState.courtId),
              }
        )
      );
    }

    setDeleteState({ isOpen: false });
  };

  const totalFacilities = facilityList.length;
  const openMiniCourts = facilityList.reduce((sum, item) => {
    const open = item.miniCourts.filter((court) => court.status === 'Đang mở').length;
    return sum + open;
  }, 0);
  const totalMiniCourts = facilityList.reduce((sum, item) => sum + item.miniCourts.length, 0);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(37,99,235,0.17),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.1),transparent_28%)]" />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-columns] xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="courts"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

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
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleOpenCreateFacility}
                className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-3 text-lg font-bold text-white shadow-[0_16px_35px_-18px_rgba(59,130,246,0.95)] transition hover:brightness-110 sm:text-base"
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
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  index={index}
                  onEditFacility={handleOpenEditFacility}
                  onDeleteFacility={handleAskDeleteFacility}
                  onToggleFacilityStatus={handleToggleFacilityStatus}
                  onAddCourt={handleOpenCreateMiniCourt}
                  onEditCourt={handleOpenEditMiniCourt}
                  onDeleteCourt={handleAskDeleteMiniCourt}
                />
              ))
            )}
          </motion.section>
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {facilityModal.isOpen && (
          <motion.div
            variants={modalBackdropVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          >
            <motion.div
              variants={modalCardVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#081734] p-6"
            >
              <h3 className="text-2xl font-black text-white">
                {facilityModal.mode === 'create' ? 'Thêm Cơ Sở Mới' : 'Chỉnh Sửa Cơ Sở'}
              </h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Tên cơ sở</span>
                  <input
                    value={facilityForm.name}
                    onChange={(event) => setFacilityForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="Nhập tên cơ sở"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Địa chỉ</span>
                  <input
                    value={facilityForm.address}
                    onChange={(event) => setFacilityForm((prev) => ({ ...prev, address: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="Nhập địa chỉ"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">URL hình ảnh</span>
                  <input
                    value={facilityForm.image}
                    onChange={(event) => setFacilityForm((prev) => ({ ...prev, image: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="https://..."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Doanh thu tháng</span>
                  <input
                    value={facilityForm.monthlyRevenue}
                    onChange={(event) => setFacilityForm((prev) => ({ ...prev, monthlyRevenue: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="12.6trđ/tháng"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Trạng thái</span>
                  <select
                    value={facilityForm.status}
                    onChange={(event) =>
                      setFacilityForm((prev) => ({ ...prev, status: event.target.value as CourtStatus }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0b1e43] px-4 py-2.5 text-white focus:border-blue-300/60 focus:outline-none"
                  >
                    <option value="Đang mở">Đang mở</option>
                    <option value="Tạm đóng">Tạm đóng</option>
                  </select>
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Tiện ích (cách nhau bằng dấu phẩy)</span>
                  <input
                    value={facilityForm.amenitiesText}
                    onChange={(event) => setFacilityForm((prev) => ({ ...prev, amenitiesText: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="Bãi Đỗ Xe, Phòng Tắm, Căn Tin"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFacilityModal({ isOpen: false, mode: 'create' })}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitFacility}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 font-bold text-white transition hover:brightness-110"
                >
                  {facilityModal.mode === 'create' ? 'Tạo Cơ Sở' : 'Lưu Thay Đổi'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {miniCourtModal.isOpen && (
          <motion.div
            variants={modalBackdropVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          >
            <motion.div
              variants={modalCardVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#081734] p-6"
            >
              <h3 className="text-2xl font-black text-white">
                {miniCourtModal.mode === 'create' ? 'Thêm Sân Nhỏ' : 'Chỉnh Sửa Sân Nhỏ'}
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Tên sân</span>
                  <input
                    value={miniCourtForm.name}
                    onChange={(event) => setMiniCourtForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="Sân A"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Số người</span>
                  <input
                    value={miniCourtForm.players}
                    onChange={(event) => setMiniCourtForm((prev) => ({ ...prev, players: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="7 Người"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Giá / giờ</span>
                  <input
                    value={miniCourtForm.price}
                    onChange={(event) => setMiniCourtForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="450K/h"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Mặt sân</span>
                  <input
                    value={miniCourtForm.surface}
                    onChange={(event) => setMiniCourtForm((prev) => ({ ...prev, surface: event.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-300/60 focus:outline-none"
                    placeholder="Cỏ Nhân Tạo"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Trạng thái</span>
                  <select
                    value={miniCourtForm.status}
                    onChange={(event) =>
                      setMiniCourtForm((prev) => ({ ...prev, status: event.target.value as CourtStatus }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0b1e43] px-4 py-2.5 text-white focus:border-blue-300/60 focus:outline-none"
                  >
                    <option value="Đang mở">Đang mở</option>
                    <option value="Tạm đóng">Tạm đóng</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMiniCourtModal({ isOpen: false, mode: 'create' })}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitMiniCourt}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 font-bold text-white transition hover:brightness-110"
                >
                  {miniCourtModal.mode === 'create' ? 'Thêm Sân' : 'Lưu Sân'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteState.isOpen && (
          <motion.div
            variants={modalBackdropVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
          >
            <motion.div
              variants={modalCardVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="w-full max-w-md rounded-3xl border border-rose-400/20 bg-[#0b1832] p-6"
            >
              <h3 className="text-2xl font-black text-white">Xác nhận xóa</h3>
              <p className="mt-3 text-slate-300">
                Bạn có chắc muốn xóa <span className="font-bold text-white">{deleteState.name}</span> không? Hành động này không thể hoàn tác.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteState({ isOpen: false })}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 font-bold text-white transition hover:brightness-110"
                >
                  Xóa ngay
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
