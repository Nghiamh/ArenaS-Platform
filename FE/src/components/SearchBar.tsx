import React, { useMemo, useState } from 'react';
import type { MapRef } from 'react-map-gl';

type MapBounds = {
	minLng: number;
	minLat: number;
	maxLng: number;
	maxLat: number;
};

type SearchBarProps = {
	mapRef: React.RefObject<MapRef>;
	mapboxToken?: string;
	courtCount: number;
	loading: boolean;
	isLocating?: boolean;
	onUseMyLocation: () => void;
	onLocationResolved: (latitude: number, longitude: number) => void;
	onBoundsSelected: (bounds: MapBounds) => void;
};


const buildBoundsFromCenter = (lng: number, lat: number) => ({
	minLng: lng - 0.04,
	minLat: lat - 0.04,
	maxLng: lng + 0.04,
	maxLat: lat + 0.04,
});

export const SearchBar: React.FC<SearchBarProps> = ({
	mapRef,
	mapboxToken,
	courtCount,
	loading,
	isLocating,
	onUseMyLocation,
	onLocationResolved,
	onBoundsSelected,
}) => {
	const [query, setQuery] = useState('');
	const [error, setError] = useState('');
	const [isSearching, setIsSearching] = useState(false);

	const isTokenReady = Boolean(mapboxToken);
	const isLocationBusy = Boolean(isLocating);
	const displayedCount = useMemo(() => `${courtCount} sân`, [courtCount]);

	const handleSearch = async () => {
		const trimmedQuery = query.trim();

		if (!trimmedQuery) {
			setError('Vui lòng nhập khu vực cần tìm.');
			return;
		}

		if (!mapboxToken) {
			setError('Thiếu Mapbox token để tìm kiếm khu vực.');
			return;
		}

		setIsSearching(true);
		setError('');

		try {
			const response = await fetch(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
					trimmedQuery,
				)}.json?country=vn&language=vi&limit=1&access_token=${mapboxToken}`,
			);

			const data = (await response.json().catch(() => null)) as {
				features?: Array<{
					bbox?: [number, number, number, number];
					center?: [number, number];
				}>;
			} | null;

			const feature = data?.features?.[0];

			if (!feature) {
				setError('Không tìm thấy khu vực phù hợp.');
				return;
			}

			const bounds = feature.bbox
				? {
					minLng: feature.bbox[0],
					minLat: feature.bbox[1],
					maxLng: feature.bbox[2],
					maxLat: feature.bbox[3],
				}
				: buildBoundsFromCenter(feature.center?.[0] ?? 105.8542, feature.center?.[1] ?? 21.0285);

			const centerLng = feature.center?.[0] ?? (bounds.minLng + bounds.maxLng) / 2;
			const centerLat = feature.center?.[1] ?? (bounds.minLat + bounds.maxLat) / 2;

			if (mapRef.current) {
				mapRef.current.fitBounds(
					[
						[bounds.minLng, bounds.minLat],
						[bounds.maxLng, bounds.maxLat],
					],
					{ padding: 80, duration: 700 },
				);
			}

			onLocationResolved(centerLat, centerLng);

			onBoundsSelected(bounds);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể tìm kiếm khu vực.');
		} finally {
			setIsSearching(false);
		}
	};

	return (
		<div className="absolute left-4 top-4 z-10 w-[340px] max-w-[92vw] rounded-2xl bg-white p-4 shadow-xl">
			<div className="flex items-center justify-between">
				<p className="text-sm font-semibold text-slate-800">Tìm sân theo vị trí</p>
				<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-600">
					{displayedCount}
				</span>
			</div>

			<button
				type="button"
				onClick={() => {
					setError('');
					onUseMyLocation();
				}}
				className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={isLocationBusy}
			>
				{isLocationBusy ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
			</button>

			<div className="mt-3">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Hoặc nhập địa chỉ</p>
				<div className="mt-2 flex gap-2">
					<input
						type="text"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								void handleSearch();
							}
						}}
						placeholder="Nhập địa chỉ, quận/huyện..."
						className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
						disabled={!isTokenReady}
					/>
					<button
						type="button"
						onClick={() => void handleSearch()}
						className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
						disabled={!isTokenReady || isSearching}
					>
						{isSearching ? 'Đang tìm' : 'Tìm'}
					</button>
				</div>
			</div>

			{error && <p className="mt-2 text-xs font-semibold text-rose-500">{error}</p>}

			{loading && <p className="mt-3 text-xs font-semibold text-slate-500">Đang tải danh sách sân...</p>}
		</div>
	);
};
