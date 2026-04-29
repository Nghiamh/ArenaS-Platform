import React from 'react';
import { Marker } from 'react-map-gl';
import type { Court, CourtCoordinates } from '../hooks/useCourtSearch';

type CourtMarkerProps = {
	court: Court & { coordinates: CourtCoordinates };
	selectedCourt: Court | null;
	onSelect: (court: Court) => void;
};

const getSportColor = (sport?: string) => {
	const normalized = sport?.toLowerCase() ?? '';

	if (normalized.includes('bong da') || normalized.includes('football') || normalized.includes('soccer')) {
		return '#22c55e';
	}

	if (normalized.includes('cau long') || normalized.includes('badminton')) {
		return '#3b82f6';
	}

	if (normalized.includes('tennis')) {
		return '#eab308';
	}

	return '#f97316';
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);

export const CourtMarker: React.FC<CourtMarkerProps> = ({ court, selectedCourt, onSelect }) => {
	const isSelected = selectedCourt?.id === court.id;
	const color = getSportColor(court.sports[0]);
	const priceLabel = `${formatCurrency(court.price_per_hour)}đ`;

	return (
		<Marker longitude={court.coordinates.longitude} latitude={court.coordinates.latitude} anchor="bottom">
			<button
				type="button"
				onClick={() => onSelect(court)}
				className={`relative flex flex-col items-center gap-1 transition-transform ${
					isSelected ? 'scale-110' : 'scale-100'
				}`}
				aria-label={`Sân ${court.name}`}
			>
				<span
					className={`rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-slate-900 shadow ${
						isSelected ? 'ring-2 ring-emerald-400/70' : 'ring-1 ring-slate-200'
					}`}
				>
					{priceLabel}
				</span>
				<span
					className={`absolute top-6 h-9 w-9 rounded-full ${isSelected ? 'animate-ping' : ''}`}
					style={{ backgroundColor: color, opacity: 0.25 }}
				/>
				<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M16 2C9.4 2 4 7.2 4 13.8C4 23.8 16 38 16 38C16 38 28 23.8 28 13.8C28 7.2 22.6 2 16 2Z"
						fill={color}
						stroke="white"
						strokeWidth="2"
					/>
					<circle cx="16" cy="14" r="5" fill="white" />
				</svg>
			</button>
		</Marker>
	);
};
