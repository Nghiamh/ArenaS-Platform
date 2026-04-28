import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  createOwnerCourt,
  deleteOwnerCourt,
  getOwnerCourts,
  updateOwnerCourt,
  type OwnerCourt,
  type OwnerCourtPayload,
  type OwnerCourtStatus,
} from '../../Axios/Axios';
import { OwnerSidebar } from './OwnerSidebar';

type CourtFormState = {
  name: string;
  sportsText: string;
  pricePerHour: string;
  location: string;
  amenitiesText: string;
  imagesText: string;
  status: OwnerCourtStatus;
  latitude: string;
  longitude: string;
};

const defaultCourtImage = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop';

const courtStatusLabel: Record<OwnerCourtStatus, string> = {
  available: 'Đang mở',
  closed: 'Tạm đóng',
  open: 'Đang mở',
};

const statusBadgeClass: Record<OwnerCourtStatus, string> = {
  available: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
  closed: 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-300/25',
  open: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
};

const statusOptions: Array<{ value: OwnerCourtStatus; label: string }> = [
  { value: 'available', label: 'Đang mở' },
  { value: 'closed', label: 'Tạm đóng' },
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

const createEmptyCourtForm = (): CourtFormState => ({
  name: '',
  sportsText: 'Bóng đá 7 người',
  pricePerHour: '0',
  location: '',
  amenitiesText: '',
  imagesText: defaultCourtImage,
  status: 'available',
  latitude: '',
  longitude: '',
});

const toFormState = (court: OwnerCourt): CourtFormState => ({
  name: court.name,
  sportsText: court.sports.join(', '),
  pricePerHour: String(court.price_per_hour),
  location: court.location,
  amenitiesText: court.amenities.join(', '),
  imagesText: court.images.join(', '),
  status: court.status === 'open' ? 'available' : court.status,
  latitude: court.coordinates ? String(court.coordinates.latitude) : '',
  longitude: court.coordinates ? String(court.coordinates.longitude) : '',
});

const parseList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(value);

const CourtImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  const imageSrc = src?.trim() || defaultCourtImage;

  if (hasError) {
    return (
      <div className="flex h-full w-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_42%),linear-gradient(135deg,#0b1b3f_0%,#071124_55%,#0b1220_100%)] p-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left backdrop-blur-sm">
          <p className="text-sm font-black text-white">{alt}</p>
          <p className="mt-1 text-xs text-slate-300">Không có ảnh hiển thị</p>
        </div>
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className="h-full w-full object-cover" onError={() => setHasError(true)} />;
};

const buildPayload = (form: CourtFormState): OwnerCourtPayload => {
  const name = form.name.trim();
  const location = form.location.trim();
  const sports = parseList(form.sportsText);
  const pricePerHour = Number(form.pricePerHour);
  const amenities = parseList(form.amenitiesText);
  const images = parseList(form.imagesText);
  const hasLatitude = form.latitude.trim().length > 0;
  const hasLongitude = form.longitude.trim().length > 0;

  if (!name) {
    throw new Error('Vui lòng nhập tên sân.');
  }

  if (!location) {
    throw new Error('Vui lòng nhập địa chỉ sân.');
  }

  if (!sports.length) {
    throw new Error('Vui lòng nhập ít nhất một môn thể thao.');
  }

  if (!Number.isFinite(pricePerHour) || pricePerHour < 0) {
    throw new Error('Giá theo giờ không hợp lệ.');
  }

  if (hasLatitude !== hasLongitude) {
    throw new Error('Tọa độ phải có đủ vĩ độ và kinh độ.');
  }

  const coordinates =
    hasLatitude && hasLongitude
      ? {
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }
      : undefined;

  if (
    coordinates &&
    (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude))
  ) {
    throw new Error('Tọa độ không hợp lệ.');
  }

  return {
    name,
    sports,
    price_per_hour: pricePerHour,
    location,
    coordinates,
    amenities,
    images: images.length ? images : [defaultCourtImage],
    status: form.status,
  };
};

const StatusDot: React.FC<{ status: OwnerCourtStatus }> = ({ status }) => (
  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass[status]}`}>
    <span className={`h-2 w-2 rounded-full ${status === 'available' || status === 'open' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
    {courtStatusLabel[status]}
  </span>
);

const CourtCard: React.FC<{
  court: OwnerCourt;
  index: number;
  onEditCourt: (court: OwnerCourt) => void;
  onDeleteCourt: (court: OwnerCourt) => void;
  onToggleCourtStatus: (court: OwnerCourt) => void;
}> = ({ court, index, onEditCourt, onDeleteCourt, onToggleCourtStatus }) => {
  const primaryImage = court.images[0] ?? defaultCourtImage;
  const isOpen = court.status === 'available' || court.status === 'open';

  return (
    <motion.article
      variants={itemVariants}
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#081734]/85 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.75)]"
    >
      <div className="grid gap-0 lg:grid-cols-[230px_minmax(0,1fr)]">
        <div className="relative min-h-[166px] overflow-hidden bg-[#0a1730]">
          <CourtImage src={primaryImage} alt={court.name} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#040c20]/15 via-[#040c20]/45 to-[#040c20]/80 lg:bg-gradient-to-r" />
          <span
            className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${
              isOpen
                ? 'border-emerald-300/35 bg-emerald-500/20 text-emerald-300'
                : 'border-rose-300/35 bg-rose-500/20 text-rose-200'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            {isOpen ? 'Mở' : 'Tạm đóng'}
          </span>
        </div>

        <div className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-4xl font-black tracking-tight text-white sm:text-3xl">{court.name}</h3>
              <p className="mt-2 text-sm text-slate-400">📍 {court.location}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <p className="font-bold text-amber-300">★ {court.avg_rating.toFixed(1)}</p>
                <p className="font-semibold text-slate-300">{formatCurrency(court.price_per_hour)} đ/giờ</p>
                <p className="font-semibold text-blue-300">{court.images.length} ảnh</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggleCourtStatus(court)}
                className={`group inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm font-semibold transition ${
                  isOpen
                    ? 'border-emerald-300/65 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-300/35 bg-slate-500/15 text-slate-300'
                }`}
                aria-label="Bật tắt trạng thái sân"
              >
                <span
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                    isOpen ? 'bg-emerald-500/45' : 'bg-slate-500/45'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow transition ${
                      isOpen ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </span>
                <span>{courtStatusLabel[court.status]}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onEditCourt(court)}
                className="h-10 w-10 rounded-full border border-white/15 bg-white/5 text-slate-300 transition hover:border-blue-300/45 hover:text-blue-200"
                aria-label="Sửa sân"
              >
                ✎
              </motion.button>
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onDeleteCourt(court)}
                className="h-10 w-10 rounded-full border border-rose-400/35 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                aria-label="Xóa sân"
              >
                🗑
              </motion.button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {court.sports.map((sport) => (
              <span key={sport} className="rounded-full bg-white/5 px-3 py-1 text-sm font-medium text-slate-300 ring-1 ring-white/10">
                {sport}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {court.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full bg-white/5 px-3 py-1 text-sm font-medium text-slate-300 ring-1 ring-white/10">
                {amenity}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tọa độ</p>
              <p className="mt-1 font-medium text-white">
                {court.coordinates ? `${court.coordinates.latitude}, ${court.coordinates.longitude}` : 'Chưa có'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cập nhật</p>
              <p className="mt-1 font-medium text-white">
                {court.updatedAt ? new Date(court.updatedAt).toLocaleDateString('vi-VN') : 'Chưa rõ'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mã sân</p>
              <p className="mt-1 font-medium text-white">{index + 1}</p>
            </div>
          </div>

          <div className="mt-4">
            <StatusDot status={court.status} />
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export const OwnerManageCourtScreen: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('ownerSidebarCollapsed') === '1');
  const [courts, setCourts] = useState<OwnerCourt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [courtModal, setCourtModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; courtId?: string }>({
    isOpen: false,
    mode: 'create',
  });
  const [courtForm, setCourtForm] = useState<CourtFormState>(createEmptyCourtForm());
  const [deleteState, setDeleteState] = useState<
    | { isOpen: false }
    | { isOpen: true; courtId: string; name: string }
  >({ isOpen: false });

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    let isMounted = true;

    const loadCourts = async () => {
      setIsLoading(true);
      setPageError('');

      try {
        const data = await getOwnerCourts();
        if (isMounted) {
          setCourts(data);
        }
      } catch (error) {
        if (isMounted) {
          setPageError(error instanceof Error ? error.message : 'Không thể tải danh sách sân.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCourts();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCourts = async () => {
    try {
      const data = await getOwnerCourts();
      setCourts(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Không thể tải danh sách sân.');
    }
  };

  const filteredCourts = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return courts;
    }

    return courts.filter(
      (court) =>
        court.name.toLowerCase().includes(keyword) ||
        court.location.toLowerCase().includes(keyword) ||
        court.sports.some((sport) => sport.toLowerCase().includes(keyword)) ||
        court.amenities.some((amenity) => amenity.toLowerCase().includes(keyword))
    );
  }, [courts, searchValue]);

  const openCount = courts.filter((court) => court.status === 'available' || court.status === 'open').length;
  const closedCount = courts.length - openCount;

  const handleOpenCreateCourt = () => {
    setActionMessage('');
    setCourtForm(createEmptyCourtForm());
    setCourtModal({ isOpen: true, mode: 'create' });
  };

  const handleOpenEditCourt = (court: OwnerCourt) => {
    setActionMessage('');
    setCourtForm(toFormState(court));
    setCourtModal({ isOpen: true, mode: 'edit', courtId: court.id });
  };

  const handleSubmitCourt = async () => {
    setActionMessage('');

    let payload: OwnerCourtPayload;

    try {
      payload = buildPayload(courtForm);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Dữ liệu không hợp lệ.');
      return;
    }

    try {
      if (courtModal.mode === 'create') {
        await createOwnerCourt(payload);
      } else if (courtModal.courtId) {
        await updateOwnerCourt(courtModal.courtId, payload);
      }

      setCourtModal({ isOpen: false, mode: 'create' });
      await refreshCourts();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể lưu sân.');
    }
  };

  const handleToggleCourtStatus = async (court: OwnerCourt) => {
    const nextStatus: OwnerCourtStatus = court.status === 'closed' ? 'available' : 'closed';

    try {
      await updateOwnerCourt(court.id, {
        name: court.name,
        sports: court.sports,
        price_per_hour: court.price_per_hour,
        location: court.location,
        coordinates: court.coordinates ?? undefined,
        amenities: court.amenities,
        images: court.images,
        status: nextStatus,
      });
      await refreshCourts();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể đổi trạng thái sân.');
    }
  };

  const handleDeleteCourt = (court: OwnerCourt) => {
    setActionMessage('');
    setDeleteState({ isOpen: true, courtId: court.id, name: court.name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteState.isOpen) {
      return;
    }

    try {
      await deleteOwnerCourt(deleteState.courtId);
      setDeleteState({ isOpen: false });
      await refreshCourts();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể xóa sân.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(37,99,235,0.2),transparent_34%),radial-gradient(circle_at_75%_0%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:linear-gradient(rgba(71,85,105,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.2)_1px,transparent_1px)] [background-size:70px_70px]" />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-columns] lg:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar activeKey="courts" collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)} />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 lg:max-h-screen lg:overflow-y-auto">
          <section className="mx-auto w-full max-w-7xl space-y-6">
          <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur xl:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/70">Owner Court Console</p>
                <h1 className="mt-3 text-5xl font-black tracking-tight text-white sm:text-4xl">Quản Lý Sân</h1>

              </div>

              <button
                onClick={handleOpenCreateCourt}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-[0_16px_32px_-18px_rgba(59,130,246,0.9)] transition hover:brightness-110"
              >
                <span className="text-lg leading-none">＋</span>
                <span>Thêm sân</span>
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.7)] backdrop-blur lg:col-span-1">
                <span className="text-xl text-slate-400">⌕</span>
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                  placeholder="Tìm theo tên sân, địa chỉ, môn thể thao, tiện ích..."
                />
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300 backdrop-blur">
                Tổng sân: <span className="font-bold text-white">{courts.length}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300 backdrop-blur">
                Đang mở: <span className="font-bold text-emerald-300">{openCount}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300 backdrop-blur">
                Tạm đóng: <span className="font-bold text-slate-100">{closedCount}</span>
              </div>
            </div>

            {pageError ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {pageError}
              </div>
            ) : null}

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              {isLoading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-300">
                  Đang tải danh sách sân...
                </div>
              ) : filteredCourts.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-300">
                  Chưa có sân nào phù hợp với từ khóa tìm kiếm.
                </div>
              ) : (
                filteredCourts.map((court, index) => (
                  <CourtCard
                    key={court.id}
                    court={court}
                    index={index}
                    onEditCourt={handleOpenEditCourt}
                    onDeleteCourt={handleDeleteCourt}
                    onToggleCourtStatus={handleToggleCourtStatus}
                  />
                ))
              )}
            </motion.div>
          </div>
          </section>
        </main>
        </div>

        <AnimatePresence>
        {courtModal.isOpen ? (
          <motion.div
            variants={modalBackdropVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 flex items-center justify-center bg-[#020617]/75 px-4 py-8 backdrop-blur-sm"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalCardVariant}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#081734] p-3 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)] max-h-[86vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/70">
                    {courtModal.mode === 'create' ? 'Tạo sân' : 'Chỉnh sửa sân'}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">Thông tin sân</h2>
                </div>
                <button
                  onClick={() => setCourtModal({ isOpen: false, mode: 'create' })}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Tên sân</span>
                  <input
                    value={courtForm.name}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="Ví dụ: Sân bóng Champions Arena"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Môn thể thao</span>
                  <input
                    value={courtForm.sportsText}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, sportsText: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="Ví dụ: Bóng đá 7 người, Bóng đá 5 người"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-300">Giá / giờ</span>
                  <input
                    value={courtForm.pricePerHour}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, pricePerHour: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="Ví dụ: 450000"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-300">Địa chỉ</span>
                  <input
                    value={courtForm.location}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, location: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="Ví dụ: Q. Bình Thạnh, TP. HCM"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Tiện ích</span>
                  <input
                    value={courtForm.amenitiesText}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, amenitiesText: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="Bãi Đỗ Xe, Phòng Tắm, Căn Tin"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-300">Ảnh</span>
                  <input
                    value={courtForm.imagesText}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, imagesText: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="URL ảnh, URL ảnh khác"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-300">Vĩ độ</span>
                  <input
                    value={courtForm.latitude}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, latitude: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="10.762622"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-300">Kinh độ</span>
                  <input
                    value={courtForm.longitude}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, longitude: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    placeholder="106.660172"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-300">Trạng thái</span>
                  <select
                    value={courtForm.status}
                    onChange={(event) => setCourtForm((prev) => ({ ...prev, status: event.target.value as OwnerCourtStatus }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="mt-4 text-sm text-slate-400">Các danh sách như môn thể thao, tiện ích và ảnh nhập bằng dấu phẩy.</p>
              {actionMessage ? <div className="mt-4 text-sm text-rose-300">{actionMessage}</div> : null}

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setCourtModal({ isOpen: false, mode: 'create' })}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
                >
                  Hủy
                </button>
                <button
                  onClick={() => void handleSubmitCourt()}
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                >
                  Lưu sân
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {deleteState.isOpen ? (
          <motion.div
            variants={modalBackdropVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 flex items-center justify-center bg-[#020617]/75 px-4 py-8 backdrop-blur-sm"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalCardVariant}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081734] p-4 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)] max-h-[70vh] overflow-y-auto no-scrollbar"
            >
              <h2 className="text-2xl font-black text-white">Xóa sân</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Bạn có chắc muốn xóa <span className="font-semibold text-white">{deleteState.name}</span> không? Thao tác này không thể hoàn tác.
              </p>
              {actionMessage ? <div className="mt-4 text-sm text-rose-300">{actionMessage}</div> : null}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteState({ isOpen: false })}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
                >
                  Hủy
                </button>
                <button
                  onClick={() => void handleConfirmDelete()}
                  className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                >
                  Xóa ngay
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
