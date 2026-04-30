import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getPublicCourts, type PublicCourt } from '../../Axios/Axios';

type LocationState = {
	court?: PublicCourt;
};

type TimeSlot = {
	time: string;
	available: boolean;
};

const defaultCourtImage =
	'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600&auto=format&fit=crop';

const timeSlots: TimeSlot[] = [
	{ time: '06:00', available: false },
	{ time: '07:00', available: false },
	{ time: '08:00', available: true },
	{ time: '09:00', available: true },
	{ time: '10:00', available: true },
	{ time: '11:00', available: false },
	{ time: '12:00', available: false },
	{ time: '13:00', available: true },
	{ time: '14:00', available: true },
	{ time: '15:00', available: false },
	{ time: '16:00', available: true },
	{ time: '17:00', available: true },
	{ time: '18:00', available: true },
	{ time: '19:00', available: true },
	{ time: '20:00', available: false },
	{ time: '21:00', available: true },
];

const sampleReviews = [
	{
		id: '1',
		name: 'Tram Minh N.',
		rating: 5,
		content: 'San dep, co to, nhan vien nhiet tinh. Se quay lai!',
	},
	{
		id: '2',
		name: 'Le Quoc H.',
		rating: 4,
		content: 'Gia hop ly, vi tri thuan tien. Bai xe rong.',
	},
	{
		id: '3',
		name: 'Ngoc Anh T.',
		rating: 5,
		content: 'Dich vu tot, phong thay do sach se, co may lanh.',
	},
];

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);

const getStatusLabel = (status?: PublicCourt['status']) =>
	status === 'closed' ? 'Tam dong' : 'Dang mo';

const CourtDetailPage: React.FC = () => {
	const { courtId } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const locationState = location.state as LocationState | null;

	const [court, setCourt] = useState<PublicCourt | null>(locationState?.court ?? null);
	const [loading, setLoading] = useState(!locationState?.court);
	const [error, setError] = useState<string | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>('09:00');
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [selectedDuration, setSelectedDuration] = useState<number>(2);
	const [showBookingConfirm, setShowBookingConfirm] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const loadCourt = async () => {
			if (!courtId || court) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const courts = await getPublicCourts();
				const found = courts.find((item) => item.id === courtId) ?? null;

				if (!cancelled) {
					setCourt(found);
					setError(found ? null : 'Khong tim thay san nay.');
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Khong the tai thong tin san.');
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void loadCourt();
		return () => {
			cancelled = true;
		};
	}, [court, courtId]);

	const galleryImages = useMemo(() => {
		const rawImages = court?.images?.filter((image) => image?.trim().length) ?? [];
		const unique = Array.from(new Set(rawImages));
		const padded = unique.length ? unique : [defaultCourtImage];
		while (padded.length < 3) {
			padded.push(padded[0]);
		}
		return padded.slice(0, 3);
	}, [court]);

	const pricePerHour = Number.isFinite(court?.price_per_hour) ? court?.price_per_hour ?? 0 : 0;
	const ratingValue = Number.isFinite(court?.avg_rating) ? court?.avg_rating ?? 0 : 0;
	const bookingDuration = selectedTime ? selectedDuration : 0;
	const totalPrice = pricePerHour * bookingDuration;
	const sports = court?.sports?.length ? court.sports : ['San 5v5'];

	return (
		<div className="relative min-h-screen overflow-hidden bg-[#070a12] text-slate-100">
			<style>
				{`
				@keyframes detailFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
				@keyframes glowPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
				`}
			</style>
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(56,189,248,0.16),transparent_40%),radial-gradient(circle_at_60%_90%,rgba(14,165,233,0.14),transparent_40%)]" />
			<div className="pointer-events-none absolute inset-0 opacity-40 bg-grid-pattern" />

			<div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-10 motion-safe:animate-[detailFade_0.6s_ease-out] sm:px-6 lg:px-8">
				<div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-emerald-300/80">
					<button
						onClick={() => navigate(-1)}
						className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 transition hover:border-emerald-300/60"
						type="button"
					>
						Quay lai
					</button>
					<span>Tim san</span>
					<span className="text-slate-500">/</span>
					<span className="text-white">Chi tiet san</span>
				</div>

				{loading && (
					<div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
						Dang tai thong tin san...
					</div>
				)}

				{!loading && error && (
					<div className="mt-8 rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 text-rose-200">
						{error}
					</div>
				)}

				{!loading && !error && court && (
					<div className="mt-8 space-y-6">
						{/* HERO + BOOKING CONSOLIDATED CARD */}
						<section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_32px_80px_-46px_rgba(0,0,0,0.9)] backdrop-blur">
							<div className="space-y-4">
								{/* Gallery + Owner + Sports */}
								<div className="grid gap-4 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]">
									<div className="space-y-3">
										{/* Main Image - Larger & Taller */}
										<div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
											<img src={galleryImages[0]} alt={court.name} className="h-full w-full object-cover" />
											<div className="absolute inset-0 bg-gradient-to-t from-[#05070f]/70 via-transparent to-transparent" />
										</div>
										{/* Thumbnails */}
										<div className="flex gap-2 overflow-x-auto pb-1">
											{galleryImages.map((image, index) => (
												<div
													key={`${image}-${index}`}
													className="relative h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30"
												>
													<img src={image} alt={`${court.name} ${index + 1}`} className="h-full w-full object-cover" />
													{index === 2 && (
														<div className="absolute inset-0 grid place-items-center bg-black/55 text-[10px] font-semibold text-white">
															+3
														</div>
													)}
												</div>
											))}
										</div>
										{/* Owner Name + Sports Tags Below Image */}
										<div className="space-y-2">
											<p className="text-xs text-slate-400">Chu san: Nguyen Van A</p>
											<div className="flex flex-wrap items-center gap-2">
												{sports.map((sport) => (
													<span
														key={sport}
														className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-100"
													>
														{sport}
													</span>
												))}
											</div>
										</div>
									</div>

									{/* Right Column: Court Info + Booking */}
									<div className="space-y-3">
										{/* Header: Court Name + Location */}
										<div className="space-y-1">
											<h1 className="text-[20px] font-bold leading-tight text-white">{court.name}</h1>
											<p className="text-xs font-semibold text-emerald-200/80">TP HCM · Quan 9 · Quan 9 Football Hub</p>
										</div>

										{/* Price Card */}
										<div className="rounded-xl border border-white/10 bg-white/5 p-3">
											<p className="text-xs text-slate-300">Gia thue</p>
											<p className="mt-1 text-base font-semibold text-white">
												{formatCurrency(pricePerHour)}d<span className="text-xs font-medium text-slate-400"> / gio</span>
											</p>
										</div>

										{/* Rating + Status */}
										<div className="flex flex-wrap items-center gap-2">
											<span className="rounded-full border border-amber-300/35 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-200 whitespace-nowrap">
												★ {ratingValue.toFixed(1)} · 38 danh gia
											</span>
											<span
												className={`rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${court.status === 'closed'
														? 'border-slate-400/40 bg-slate-500/10 text-slate-200'
														: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
													}`}
											>
												{getStatusLabel(court.status)}
											</span>
										</div>

										{/* Hours + Count */}
										<div className="grid gap-2 grid-cols-2">
											<div className="rounded-lg border border-white/10 bg-white/5 p-2">
												<p className="flex items-center gap-1 text-xs text-slate-300">
													<svg viewBox="0 0 24 24" className="h-3 w-3 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="2">
														<circle cx="12" cy="12" r="9" />
														<path d="M12 7v5l3 3" />
													</svg>
													Gio mo cua
												</p>
												<p className="mt-1 text-xs font-semibold text-white">06:00 - 22:00</p>
											</div>
											<div className="rounded-lg border border-white/10 bg-white/5 p-2">
												<p className="text-xs text-slate-300">So san</p>
												<p className="mt-1 text-xs font-semibold text-white">4 san</p>
											</div>
										</div>

										{/* Booking Controls */}
										<div className="space-y-2 pt-2">
											<div className="space-y-1">
												<label className="text-xs font-semibold text-slate-300">Chon ngay</label>
												<input
													type="date"
													value={selectedDate}
													onChange={(event) => setSelectedDate(event.target.value)}
													className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/60"
												/>
											</div>

											<div className="space-y-1">
												<label className="text-xs font-semibold text-slate-300">Chon khung gio</label>
												<div className="grid grid-cols-4 gap-1">
													{timeSlots.map((slot) => {
														const isSelected = selectedTime === slot.time;
														return (
															<button
																key={slot.time}
																type="button"
																disabled={!slot.available}
																onClick={() => setSelectedTime(slot.time)}
																className={`rounded-lg px-1 py-1 text-[11px] font-semibold transition ${slot.available
																		? isSelected
																			? 'border border-emerald-400/70 bg-emerald-500/20 text-emerald-100'
																			: 'border border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/40'
																		: 'border border-white/5 bg-white/5 text-slate-500 line-through'
																	}`}
															>
																{slot.time}
															</button>
														);
													})}
												</div>
											</div>

											<div className="space-y-2">
												<label className="text-xs font-semibold text-slate-300">Chon so gio</label>
												<div className="flex flex-wrap gap-2">
													{[1, 2, 3, 4].map((duration) => (
														<button
															key={duration}
															type="button"
															className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${selectedDuration === duration
																	? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100'
																	: 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/40'
																}`}
															onClick={() => setSelectedDuration(duration)}
														>
															{duration} gio
														</button>
													))}
												</div>
											</div>

											<div className="rounded-lg border border-white/10 bg-white/5 p-3">
												<div className="flex items-center justify-between text-xs text-slate-200 mb-1">
													<span>{formatCurrency(pricePerHour)}d x {bookingDuration} gio</span>
													<span className="font-semibold">{formatCurrency(totalPrice)}d</span>
												</div>

												<div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs font-semibold text-white">
													<span>Tong cong</span>
													<span>{formatCurrency(totalPrice)}d</span>
												</div>
											</div>

											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => setShowBookingConfirm(true)}
													className="flex-1 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-[0_18px_40px_-26px_rgba(16,185,129,0.9)] transition hover:brightness-110"
												>
													Dat san ngay
												</button>
												<button
													type="button"
													onClick={() => {
														navigate('/tim-san', {
															state: {
																selectedVenueId: courtId,
																directionsCourt: court,
																sport: court?.sports?.[0]
															}
														});
													}}
													className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
												>
													Chi duong
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</section>

						{/* REVIEWS SECTION - ONLY */}
						<section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
							<h2 className="text-lg font-semibold text-white">Danh gia</h2>
							<div className="mt-4 space-y-3">
								{sampleReviews.map((review) => (
									<div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-[11px] font-semibold text-white">
													{review.name.split(' ').map((item) => item[0]).join('').slice(0, 2)}
												</span>
												<p className="text-xs font-semibold text-white">{review.name}</p>
											</div>
											<p className="text-xs font-semibold text-amber-300">{'★'.repeat(review.rating)}</p>
										</div>
										<p className="mt-2 text-xs text-slate-300">{review.content}</p>
									</div>
								))}
							</div>
						</section>

						<div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-xs text-slate-300">
							<p className="font-semibold text-white">Luu y nhanh</p>
							<p className="mt-1">
								Xac nhan dat san sau 5 phut. Huy mien phi truoc 3 gio bat dau.
							</p>
						</div>
					</div>
				)}
			</div>

			{/* BOOKING CONFIRMATION MODAL */}
			{showBookingConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0f1a] shadow-2xl">
						<div className="border-b border-white/10 p-5">
							<h2 className="text-lg font-bold text-white">Xac nhan dat san</h2>
						</div>

						<div className="space-y-3 p-5">
							<div className="space-y-1">
								<p className="text-xs text-slate-400">San</p>
								<p className="font-semibold text-white">{court?.name}</p>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<p className="text-xs text-slate-400">Ngay</p>
									<p className="text-sm font-semibold text-white">{selectedDate || 'Chua chon'}</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-slate-400">Gio bat dau</p>
									<p className="text-sm font-semibold text-white">{selectedTime}</p>
								</div>
							</div>

							<div className="rounded-lg border border-white/10 bg-white/5 p-3">
								<div className="flex items-center justify-between text-sm mb-2">
									<span className="text-slate-300">{formatCurrency(pricePerHour)}d x {bookingDuration} gio</span>
									<span className="font-semibold text-white">{formatCurrency(totalPrice)}d</span>
								</div>
								<div className="flex items-center justify-between text-sm mb-2">
									<span className="text-slate-300">Phi dich vu</span>
									<span className="font-semibold text-white">32.000d</span>
								</div>
								<div className="border-t border-white/10 pt-2 flex items-center justify-between text-sm font-bold">
									<span className="text-white">Tong cong</span>
									<span className="text-emerald-300">{formatCurrency(totalPrice + 32000)}d</span>
								</div>
							</div>
						</div>

						<div className="border-t border-white/10 flex gap-2 p-5">
							<button
								type="button"
								onClick={() => setShowBookingConfirm(false)}
								className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
							>
								Huy
							</button>
							<button
								type="button"
								onClick={() => {
									setShowBookingConfirm(false);
									// TODO: Call backend booking API
									alert('Dat san thanh cong!');
								}}
								className="flex-1 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:brightness-110"
							>
								Xac nhan
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CourtDetailPage;
