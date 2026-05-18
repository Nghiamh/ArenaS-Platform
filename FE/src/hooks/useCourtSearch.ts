import { useCallback, useState } from 'react';

export interface CourtCoordinates {
	latitude: number;
	longitude: number;
}

export interface Court {
	id: string;
	name: string;
	sports: string[];
	price_per_hour: number;
	location: string;
	coordinates: CourtCoordinates | null;
	amenities: string[];
	images: string[];
	avg_rating: number;
	status: 'available' | 'open' | 'closed';
	distance_m?: number;
}

interface CourtResponse {
	message: string;
	total: number;
	courts: Court[];
}

const DEFAULT_LOCATION: CourtCoordinates = { latitude: 21.0285, longitude: 105.8542 };
const FALLBACK_LOCATION: CourtCoordinates = { latitude: 10.8231, longitude: 106.6297 };
const DEFAULT_RADIUS = 5000;

const VIETNAM_BOUNDS = {
	minLat: 8,
	maxLat: 23.5,
	minLng: 102,
	maxLng: 110.5,
};

const isWithinVietnam = (latitude: number, longitude: number) =>
	latitude >= VIETNAM_BOUNDS.minLat &&
	latitude <= VIETNAM_BOUNDS.maxLat &&
	longitude >= VIETNAM_BOUNDS.minLng &&
	longitude <= VIETNAM_BOUNDS.maxLng;

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ??
	import.meta.env.VITE_API_URL ??
	'http://localhost:5000/api';

const buildApiUrl = (path: string, params: Record<string, string | number | undefined>) => {
	const base = API_BASE_URL.replace(/\/$/, '');
	const url = new URL(`${base}${path}`);

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			url.searchParams.set(key, String(value));
		}
	});

	return url.toString();
};

const requestCourts = async (path: string, params: Record<string, string | number | undefined>) => {
	const url = buildApiUrl(path, params);
	const response = await fetch(url, { method: 'GET' });
	const payload = (await response.json().catch(() => null)) as CourtResponse | null;

	if (!response.ok) {
		const message = payload?.message ?? 'Không thể tải danh sách sân.';
		throw new Error(message);
	}

	if (!payload) {
		throw new Error('Không thể tải danh sách sân.');
	}

	return payload;
};

export const useCourtSearch = () => {
	const [courts, setCourts] = useState<Court[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [userLocation, setUserLocation] = useState<CourtCoordinates | null>(null);
	const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

	const fetchNearbyCourts = useCallback(
		async (lat: number, lng: number, radius = DEFAULT_RADIUS, sport?: string) => {
			setLoading(true);
			setError(null);

			try {
				const payload = await requestCourts('/courts/nearby', {
					lat,
					lng,
					radius,
					sport,
				});
				setCourts(payload.courts);
				setSelectedCourt(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Không thể tải danh sách sân.');
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const fetchCourtsByArea = useCallback(
		async (minLng: number, minLat: number, maxLng: number, maxLat: number, sport?: string) => {
			setLoading(true);
			setError(null);

			try {
				const payload = await requestCourts('/courts/search', {
					minLng,
					minLat,
					maxLng,
					maxLat,
					sport,
				});
				setCourts(payload.courts);
				setSelectedCourt(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Không thể tải danh sách sân.');
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const initLocation = useCallback(() => {
		setError(null);

		if (!navigator.geolocation) {
			setUserLocation(DEFAULT_LOCATION);
			void fetchNearbyCourts(
				DEFAULT_LOCATION.latitude,
				DEFAULT_LOCATION.longitude,
				DEFAULT_RADIUS,
			);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const nextLocation = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				};

				if (!isWithinVietnam(nextLocation.latitude, nextLocation.longitude)) {
					setError('Không xác định được vị trí tại Việt Nam, chuyển về TP.HCM.');
					setUserLocation(FALLBACK_LOCATION);
					void fetchNearbyCourts(
						FALLBACK_LOCATION.latitude,
						FALLBACK_LOCATION.longitude,
						DEFAULT_RADIUS,
					);
					return;
				}

				setUserLocation(nextLocation);
				void fetchNearbyCourts(nextLocation.latitude, nextLocation.longitude, DEFAULT_RADIUS);
			},
			() => {
				setError('Không lấy được vị trí hiện tại, hiển thị khu vực mặc định.');
				setUserLocation(DEFAULT_LOCATION);
				void fetchNearbyCourts(
					DEFAULT_LOCATION.latitude,
					DEFAULT_LOCATION.longitude,
					DEFAULT_RADIUS,
				);
			},
			{ enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 },
		);
	}, [fetchNearbyCourts]);

	const selectCourt = useCallback((court: Court | null) => {
		setSelectedCourt(court);
	}, []);

	const setManualLocation = useCallback((latitude: number, longitude: number) => {
		setUserLocation({ latitude, longitude });
	}, []);

	return {
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
	};
};
