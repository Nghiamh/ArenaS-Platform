import React, { useEffect, useState } from 'react';
import type { Court, CourtCoordinates } from '../hooks/useCourtSearch';

type RouteFeature = {
	type: 'Feature';
	geometry: {
		type: 'LineString';
		coordinates: number[][];
	};
	properties: Record<string, never>;
};

type TransportMode = 'driving' | 'cycling' | 'walking';

type RouteResult = {
	distance: number;
	duration: number;
	feature: RouteFeature;
};

const transportOptions: Array<{ mode: TransportMode; label: string; name: string }> = [
	{ mode: 'driving', label: '🚗', name: 'Ô tô' },
	{ mode: 'cycling', label: '🏍', name: 'Xe máy' },
	{ mode: 'walking', label: '🚶', name: 'Đi bộ' },
];

type DirectionsPanelProps = {
	open: boolean;
	court: Court | null;
	userLocation: CourtCoordinates | null;
	mapboxToken?: string;
	onClose: () => void;
	onRouteChange: (route: RouteFeature | null) => void;
};

const formatDistance = (distance: number) => `${(distance / 1000).toFixed(1)} km`;
const formatDuration = (duration: number) => `${Math.round(duration / 60)} phút`;

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
	open,
	court,
	userLocation,
	mapboxToken,
	onClose,
	onRouteChange,
}) => {
	const [transportMode, setTransportMode] = useState<TransportMode>('driving');
	const [routesByMode, setRoutesByMode] = useState<Record<TransportMode, RouteResult | null>>({
		driving: null,
		cycling: null,
		walking: null,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!open) {
			onRouteChange(null);
			setRoutesByMode({ driving: null, cycling: null, walking: null });
			setError('');
			return;
		}

		if (!court?.coordinates || !userLocation) {
			setError('Không có đủ dữ liệu vị trí để chỉ đường.');
			onRouteChange(null);
			return;
		}

		if (!mapboxToken) {
			setError('Thiếu Mapbox token để chỉ đường.');
			onRouteChange(null);
			return;
		}

		let isMounted = true;
		const controller = new AbortController();

		const fetchRouteForMode = async (mode: TransportMode): Promise<RouteResult | null> => {
			const response = await fetch(
				`https://api.mapbox.com/directions/v5/mapbox/${mode}/` +
					`${userLocation.longitude},${userLocation.latitude};` +
					`${court.coordinates?.longitude},${court.coordinates?.latitude}` +
					`?geometries=geojson&language=vi&access_token=${mapboxToken}`,
				{ signal: controller.signal },
			);

			const data = (await response.json().catch(() => null)) as
				| {
						routes?: Array<{
							distance: number;
							duration: number;
							geometry: { coordinates: number[][] };
						}>;
					}
				| null;

			const route = data?.routes?.[0];

			if (!response.ok || !route) {
				return null;
			}

			const feature: RouteFeature = {
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: route.geometry.coordinates,
				},
				properties: {},
			};

			return {
				distance: route.distance,
				duration: route.duration,
				feature,
			};
		};

		const fetchAllRoutes = async () => {
			setLoading(true);
			setError('');

			const results = await Promise.allSettled(
				transportOptions.map((option) => fetchRouteForMode(option.mode)),
			);

			if (!isMounted) {
				return;
			}

			const nextRoutes: Record<TransportMode, RouteResult | null> = {
				driving: null,
				cycling: null,
				walking: null,
			};

			results.forEach((result, index) => {
				const mode = transportOptions[index].mode;
				if (result.status === 'fulfilled') {
					nextRoutes[mode] = result.value;
				}
			});

			setRoutesByMode(nextRoutes);
			const selectedRoute = nextRoutes[transportMode];
			onRouteChange(selectedRoute?.feature ?? null);

			if (!selectedRoute) {
				setError('Không thể lấy chỉ đường phù hợp.');
			}

			setLoading(false);
		};

		void fetchAllRoutes();

		return () => {
			isMounted = false;
			controller.abort();
		};
	}, [court, mapboxToken, onRouteChange, open, transportMode, userLocation]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const selectedRoute = routesByMode[transportMode];
		onRouteChange(selectedRoute?.feature ?? null);
	}, [open, onRouteChange, routesByMode, transportMode]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed bottom-0 left-0 right-0 z-30 w-full translate-y-0 rounded-t-3xl border-t border-slate-200 bg-white/95 p-5 shadow-[0_-20px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-semibold text-slate-500">Chỉ đường đến</p>
					<p className="text-lg font-bold text-slate-900">{court?.name ?? 'Sân thể thao'}</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600"
				>
					Đóng
				</button>
			</div>

			<div className="mt-4 flex items-center gap-2">
				{transportOptions.map((option) => (
					<button
						key={option.mode}
						type="button"
						onClick={() => setTransportMode(option.mode)}
						className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
							transportMode === option.mode
								? 'bg-slate-900 text-white'
								: 'bg-slate-100 text-slate-600'
						}`}
					>
						{option.label}
					</button>
				))}
			</div>

			<div className="mt-4 grid gap-2 text-sm text-slate-700">
				{loading && <p>Đang tải chỉ đường...</p>}
				{error && <p className="text-rose-500">{error}</p>}
				{!loading && (
					<div className="grid gap-2 sm:grid-cols-3">
						{transportOptions.map((option) => {
							const route = routesByMode[option.mode];

							return (
								<div
									key={option.mode}
									className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${
										transportMode === option.mode
											? 'border-slate-900 bg-slate-900 text-white'
											: 'border-slate-200 bg-white text-slate-600'
									}`}
								>
									<p className="text-[11px] uppercase tracking-wide text-inherit">{option.name}</p>
									{route ? (
										<p className="mt-1 text-sm font-bold text-inherit">
											{formatDuration(route.duration)}
											<span className="ml-2 text-[11px] font-semibold">
												{formatDistance(route.distance)}
											</span>
										</p>
									) : (
										<p className="mt-1 text-[11px] text-inherit">Chưa có dữ liệu</p>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};
