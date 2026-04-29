import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, type MapRef, Source } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCourtSearch, type Court } from '../hooks/useCourtSearch';
import { CourtMarker } from './CourtMarker';
import { CourtPopup } from './CourtPopup';
import { DirectionsPanel } from './DirectionsPanel';
import { SearchBar } from './SearchBar';
import { UserMarker } from './UserMarker';

type MapBounds = {
	minLng: number;
	minLat: number;
	maxLng: number;
	maxLat: number;
};

type RouteFeature = {
	type: 'Feature';
	geometry: {
		type: 'LineString';
		coordinates: number[][];
	};
	properties: Record<string, never>;
};

const DEFAULT_CENTER = {
	longitude: 105.8542,
	latitude: 21.0285,
	zoom: 13,
};

const MIN_SEARCH_ZOOM = 12;
const mapStyle = 'mapbox://styles/mapbox/streets-v12';

export const CourtMap: React.FC = () => {
	const mapRef = useRef<MapRef | null>(null);
	const hasCenteredRef = useRef(false);
	const lastBoundsRef = useRef<MapBounds | null>(null);

	const [activeSport, setActiveSport] = useState<string | undefined>(undefined);
	const [routeFeature, setRouteFeature] = useState<RouteFeature | null>(null);
	const [directionsCourt, setDirectionsCourt] = useState<Court | null>(null);
	const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
	const [isLocating, setIsLocating] = useState(false);

	const {
		courts,
		loading,
		error,
		userLocation,
		selectedCourt,
		initLocation,
		fetchNearbyCourts,
		fetchCourtsByArea,
		selectCourt,
		setManualLocation,
	} = useCourtSearch();

	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
	const isMapboxReady = Boolean(mapboxToken);

	useEffect(() => {
		initLocation();
	}, [initLocation]);

	useEffect(() => {
		if (userLocation) {
			setIsLocating(false);
		}
	}, [userLocation]);

	useEffect(() => {
		if (!userLocation || !mapRef.current || hasCenteredRef.current) {
			return;
		}

		hasCenteredRef.current = true;
		mapRef.current.flyTo({
			center: [userLocation.longitude, userLocation.latitude],
			zoom: DEFAULT_CENTER.zoom,
			duration: 800,
		});
	}, [userLocation]);

	const courtsWithCoordinates = useMemo(
		() => courts.filter((court) => court.coordinates !== null) as Array<Court & { coordinates: NonNullable<Court['coordinates']> }>,
		[courts],
	);

	const handleMoveEnd = useCallback(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}

		if (map.getZoom() < MIN_SEARCH_ZOOM) {
			return;
		}

		const bounds = map.getBounds();
		const nextBounds = {
			minLng: bounds.getWest(),
			minLat: bounds.getSouth(),
			maxLng: bounds.getEast(),
			maxLat: bounds.getNorth(),
		};

		lastBoundsRef.current = nextBounds;
		void fetchCourtsByArea(
			nextBounds.minLng,
			nextBounds.minLat,
			nextBounds.maxLng,
			nextBounds.maxLat,
			activeSport,
		);
	}, [activeSport, fetchCourtsByArea]);

	const handleBoundsSelected = useCallback(
		(bounds: MapBounds) => {
			lastBoundsRef.current = bounds;
			void fetchCourtsByArea(
				bounds.minLng,
				bounds.minLat,
				bounds.maxLng,
				bounds.maxLat,
				activeSport,
			);
		},
		[activeSport, fetchCourtsByArea],
	);

	const handleSportSelected = useCallback(
		(nextSport?: string) => {
			setActiveSport(nextSport);

			if (lastBoundsRef.current) {
				const bounds = lastBoundsRef.current;
				void fetchCourtsByArea(
					bounds.minLng,
					bounds.minLat,
					bounds.maxLng,
					bounds.maxLat,
					nextSport,
				);
				return;
			}

			if (userLocation) {
				void fetchNearbyCourts(userLocation.latitude, userLocation.longitude, undefined, nextSport);
			}
		},
		[fetchCourtsByArea, fetchNearbyCourts, userLocation],
	);

	const handleDirections = useCallback((court: Court) => {
		setDirectionsCourt(court);
		setIsDirectionsOpen(true);
	}, []);

	const handleLocationResolved = useCallback(
		(latitude: number, longitude: number) => {
			setManualLocation(latitude, longitude);
		},
		[setManualLocation],
	);

	const handleUseMyLocation = useCallback(() => {
		setIsLocating(true);
		initLocation();
	}, [initLocation]);

	const handleCloseDirections = useCallback(() => {
		setIsDirectionsOpen(false);
		setDirectionsCourt(null);
		setRouteFeature(null);
	}, []);

	const emptyState = !loading && !error && courtsWithCoordinates.length === 0;

	return (
		<div className="relative h-full min-h-[680px] w-full">
			<Map
				ref={mapRef}
				initialViewState={DEFAULT_CENTER}
				mapboxAccessToken={mapboxToken}
				mapStyle={mapStyle}
				onMoveEnd={handleMoveEnd}
				reuseMaps
			>
				{routeFeature && (
					<Source id="court-route" type="geojson" data={routeFeature}>
						<Layer
							id="court-route-line"
							type="line"
							paint={{
								'line-color': '#2563eb',
								'line-width': 4,
								'line-opacity': 0.85,
							}}
						/>
					</Source>
				)}

				{userLocation && (
					<UserMarker latitude={userLocation.latitude} longitude={userLocation.longitude} />
				)}

				{courtsWithCoordinates.map((court) => (
					<CourtMarker
						key={court.id}
						court={court}
						selectedCourt={selectedCourt}
						onSelect={selectCourt}
					/>
				))}

			</Map>

			<SearchBar
				mapRef={mapRef}
				mapboxToken={mapboxToken}
				activeSport={activeSport}
				courtCount={courts.length}
				loading={loading}
				isLocating={isLocating}
				onUseMyLocation={handleUseMyLocation}
				onLocationResolved={handleLocationResolved}
				onBoundsSelected={handleBoundsSelected}
				onSportSelected={handleSportSelected}
			/>

			{selectedCourt && (
				<CourtPopup
					court={selectedCourt}
					variant="centered"
					onClose={() => selectCourt(null)}
					onDirections={handleDirections}
				/>
			)}

			{loading && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/30">
					<div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
				</div>
			)}

			{error && (
				<div className="absolute bottom-4 left-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">
					{error}
				</div>
			)}

			{emptyState && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm font-semibold text-slate-100">
					<div className="rounded-2xl bg-slate-900/70 px-4 py-3">
						Không tìm thấy sân nào trong khu vực này
					</div>
				</div>
			)}

			{!isMapboxReady && (
				<div className="absolute inset-0 flex items-center justify-center text-center text-sm font-semibold text-slate-100">
					<div className="rounded-2xl bg-slate-900/70 px-4 py-3">
						Thiếu Mapbox token để hiển thị bản đồ
					</div>
				</div>
			)}

			<DirectionsPanel
				open={isDirectionsOpen}
				court={directionsCourt}
				userLocation={userLocation}
				mapboxToken={mapboxToken}
				onClose={handleCloseDirections}
				onRouteChange={setRouteFeature}
			/>
		</div>
	);
};
