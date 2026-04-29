import React from 'react';
import { Marker } from 'react-map-gl';

type UserMarkerProps = {
	latitude: number;
	longitude: number;
};

export const UserMarker: React.FC<UserMarkerProps> = ({ latitude, longitude }) => (
	<Marker longitude={longitude} latitude={latitude} anchor="bottom">
		<div className="relative flex flex-col items-center">
			<span className="absolute top-3 h-10 w-10 animate-ping rounded-full bg-emerald-400/35" />
			<div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_12px_26px_-14px_rgba(16,185,129,0.9)]">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<circle cx="12" cy="7" r="3" />
					<path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
					<path d="M12 13v3" />
				</svg>
			</div>
			<span className="mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow">
				Bạn đang ở đây
			</span>
		</div>
	</Marker>
);
