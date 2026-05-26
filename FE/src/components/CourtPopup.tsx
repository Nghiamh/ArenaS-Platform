import React from 'react';
import { Popup } from 'react-map-gl';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Court } from '../hooks/useCourtSearch';

type CourtPopupProps = {
	court: Court;
	onClose: () => void;
	onDirections: (court: Court) => void;
	variant?: 'map' | 'centered';
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);

const formatDistance = (distance?: number) => {
	if (distance === undefined) {
		return null;
	}

	const km = distance / 1000;
	return `${km.toFixed(1)} km`;
};

export const CourtPopup: React.FC<CourtPopupProps> = ({
	court,
	onClose,
	onDirections,
	variant = 'map',
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const fromMatch = (location.state as any)?.fromMatch;

	const distanceLabel = formatDistance(court.distance_m);
	const card = (
		<div className="w-[300px] rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
			<div className="flex items-start justify-between">
				<div>
					<h3 className="text-lg font-bold text-slate-900">{court.name}</h3>
					<p className="mt-1 text-sm text-slate-500">{court.location}</p>
				</div>
				<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-400">
					{court.status === 'closed' ? 'Tạm đóng' : 'Đang mở'}
				</span>
			</div>

			<div className="mt-3 flex flex-wrap gap-2">
				{court.sports.map((sport) => (
					<span
						key={sport}
						className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
					>
						{sport}
					</span>
				))}
			</div>

			<div className="mt-3 flex items-center justify-between text-sm">
				<p className="font-semibold text-slate-700">
					{formatCurrency(court.price_per_hour)} đ/giờ
				</p>
				<p className="font-semibold text-amber-500">⭐ {court.avg_rating.toFixed(1)}</p>
			</div>

			{distanceLabel && (
				<p className="mt-2 text-xs font-semibold text-emerald-600">{distanceLabel} từ bạn</p>
			)}

			<div className="mt-4 grid gap-2">
				<button
					type="button"
					onClick={() => navigate(`/courts/${court.id}`, { state: { court, fromMatch } })}
					className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
				>
					Xem chi tiết
				</button>
				<button
					type="button"
					onClick={() => onDirections(court)}
					className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
				>
					Chỉ đường
				</button>
			</div>
		</div>
	);

	if (variant === 'centered') {
		return (
			<div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
				<div className="pointer-events-auto relative">
					<button
						type="button"
						onClick={onClose}
						className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow"
					>
						×
					</button>
					{card}
				</div>
			</div>
		);
	}

	if (!court.coordinates) {
		return null;
	}

	return (
		<Popup
			longitude={court.coordinates.longitude}
			latitude={court.coordinates.latitude}
			anchor="top"
			closeOnClick={false}
			onClose={onClose}
			className="court-popup"
			offset={16}
		>
			{card}
		</Popup>
	);
};
