import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, type MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
	Search, X, MapPin, Clock, Swords, Trophy, MessageCircle,
	RotateCcw, Loader2, Zap, Target, Navigation,
} from 'lucide-react';
import {
	joinMatchmaking, cancelMatchmaking, getMatchmakingStatus,
	type MatchData, type MatchmakingTicket,
} from '../../Axios/matchmakingApi';
import { getPublicCourts, type PublicCourt } from '../../Axios/Axios';
import { useSocket } from '../../hooks/useSocket';
import './MatchmakingPage.css';

type MatchmakingState = 'IDLE' | 'WAITING' | 'MATCHED';

const SPORTS = [
	{ key: 'badminton', label: 'Cầu lông', emoji: '🏸' },
	{ key: 'football', label: 'Bóng đá', emoji: '⚽' },
	{ key: 'tennis', label: 'Tennis', emoji: '🎾' },
	{ key: 'pickleball', label: 'Pickleball', emoji: '🏓' },
];

const CONFETTI_COLORS = ['#3b82f6', '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export const MatchmakingPage: React.FC = () => {
	const navigate = useNavigate();
	const { onMatchFound, isConnected } = useSocket();
	const mapRef = useRef<MapRef | null>(null);

	const [currentUser, setCurrentUser] = useState<{ id: string; name?: string } | null>(null);
	const [selectedSport, setSelectedSport] = useState<string>('');
	const [selectedCourtId, setSelectedCourtId] = useState<string>('');
	const [selectedCourtName, setSelectedCourtName] = useState<string>('');
	const [courts, setCourts] = useState<PublicCourt[]>([]);
	const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
	const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');

	const [mmState, setMmState] = useState<MatchmakingState>('IDLE');
	const [ticket, setTicket] = useState<MatchmakingTicket | null>(null);
	const [matchData, setMatchData] = useState<MatchData | null>(null);
	const [waitSeconds, setWaitSeconds] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [initialLoading, setInitialLoading] = useState(true);
	const [resolvedMatchId, setResolvedMatchId] = useState<string>('');

	const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Load current user
	useEffect(() => {
		try {
			const stored = localStorage.getItem('currentUser');
			if (stored) {
				const parsed = JSON.parse(stored);
				setCurrentUser({ id: parsed.id ?? parsed._id, name: parsed.name });
			}
		} catch { /* ignore */ }
	}, []);

	// Redirect if not logged in
	useEffect(() => {
		const token = localStorage.getItem('accessToken')?.trim();
		if (!token || token === 'undefined' || token === 'null') {
			navigate('/login', { state: { toastMessage: 'Vui lòng đăng nhập để tìm đối thủ.' } });
		}
	}, [navigate]);

	// Get user location
	useEffect(() => {
		setLocationStatus('loading');
		if (!navigator.geolocation) {
			setUserLocation({ lng: 106.6297, lat: 10.8231 });
			setLocationStatus('error');
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude });
				setLocationStatus('success');
			},
			() => {
				setUserLocation({ lng: 106.6297, lat: 10.8231 });
				setLocationStatus('error');
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	}, []);

	// Load courts for selected sport
	useEffect(() => {
		if (!selectedSport) { setCourts([]); return; }
		getPublicCourts({ sport: selectedSport })
			.then((data) => setCourts(data))
			.catch(() => setCourts([]));
	}, [selectedSport]);

	// Check existing matchmaking status on mount
	useEffect(() => {
		getMatchmakingStatus()
			.then((res) => {
				if (res.status === 'WAITING' && res.ticket) {
					setMmState('WAITING');
					setTicket(res.ticket);
					setSelectedSport(res.ticket.sport);
					const created = new Date(res.ticket.createdAt ?? Date.now()).getTime();
					setWaitSeconds(Math.floor((Date.now() - created) / 1000));
				} else if (res.status === 'MATCHED' && res.ticket) {
					setMmState('MATCHED');
					setTicket(res.ticket);
					setSelectedSport(res.ticket.sport);
					// match_id can be a populated object or a string ID
					const mid = res.ticket.match_id;
					if (mid) {
						if (typeof mid === 'object') {
							setMatchData(mid as unknown as MatchData);
							const idStr = (mid as any)._id?.toString();
							if (idStr) setResolvedMatchId(idStr);
						} else {
							const idStr = String(mid);
							if (idStr && !idStr.includes('[object')) setResolvedMatchId(idStr);
						}
					}
				}
			})
			.catch(() => {})
			.finally(() => setInitialLoading(false));
	}, []);

	// Wait timer
	useEffect(() => {
		if (mmState === 'WAITING') {
			waitTimerRef.current = setInterval(() => {
				setWaitSeconds((prev) => {
					if (prev + 1 >= 1800) {
						setMmState('IDLE'); setTicket(null);
						setError('Đã hết thời gian tìm kiếm (30 phút). Vui lòng thử lại.');
						return 0;
					}
					return prev + 1;
				});
			}, 1000);
		} else if (waitTimerRef.current) {
			clearInterval(waitTimerRef.current);
			waitTimerRef.current = null;
		}
		return () => { if (waitTimerRef.current) clearInterval(waitTimerRef.current); };
	}, [mmState]);

	// Listen for match_found
	useEffect(() => {
		onMatchFound((payload) => {
			setMmState('MATCHED');
			setMatchData(payload.match as MatchData);
			setResolvedMatchId(String(payload.matchId));
			setWaitSeconds(0);
		});
	}, [onMatchFound]);

	// Courts with coordinates for map
	const courtsOnMap = useMemo(() =>
		courts.filter((c) =>
			c.coordinates &&
			c.sports.some((s) => s.toLowerCase() === selectedSport.toLowerCase())
		), [courts, selectedSport]);

	// Select court from map marker
	const handleSelectCourtOnMap = useCallback((court: PublicCourt) => {
		if (selectedCourtId === court.id) {
			setSelectedCourtId('');
			setSelectedCourtName('');
		} else {
			setSelectedCourtId(court.id);
			setSelectedCourtName(court.name);
		}
	}, [selectedCourtId]);

	// Handlers
	const handleJoin = useCallback(async () => {
		if (!selectedSport) { setError('Vui lòng chọn môn thể thao.'); return; }
		if (!userLocation) { setError('Đang lấy vị trí. Vui lòng đợi...'); return; }
		setError(''); setLoading(true);
		try {
			const res = await joinMatchmaking({
				sport: selectedSport, longitude: userLocation.lng, latitude: userLocation.lat,
				court_id: selectedCourtId || undefined,
			});
			setTicket(res.ticket); setMmState('WAITING'); setWaitSeconds(0);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
			setError(msg === 'already_in_queue' ? 'Bạn đang trong hàng đợi. Vui lòng huỷ trước.' : msg);
		} finally { setLoading(false); }
	}, [selectedSport, selectedCourtId, userLocation]);

	const handleCancel = useCallback(async () => {
		setLoading(true); setError('');
		try { await cancelMatchmaking(); setMmState('IDLE'); setTicket(null); setWaitSeconds(0); }
		catch (err: unknown) { setError(err instanceof Error ? err.message : 'Không thể huỷ.'); }
		finally { setLoading(false); }
	}, []);

	const handleGoToChat = useCallback(() => {
		if (resolvedMatchId) {
			navigate(`/chat/${resolvedMatchId}`);
		}
	}, [resolvedMatchId, navigate]);

	const handleReset = useCallback(() => {
		setMmState('IDLE'); setTicket(null); setMatchData(null); setResolvedMatchId(''); setWaitSeconds(0); setError('');
	}, []);

	const handleFlyToMe = useCallback(() => {
		if (userLocation && mapRef.current) {
			mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14, duration: 800 });
		}
	}, [userLocation]);

	const progressPct = Math.max(0, 100 - (waitSeconds / 1800) * 100);
	const opponent = matchData?.participants?.find((p) => p._id !== currentUser?.id);

	if (initialLoading) {
		return (
			<div className="mm-page">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
					<p className="text-slate-400 text-sm">Đang tải...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mm-page-wide bg-grid-pattern">
			{/* ── IDLE STATE ── */}
			{mmState === 'IDLE' && (
				<div className="mm-wide-container" style={{ animation: 'mm-fade-up 0.5s ease-out' }}>
					{/* Header */}
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-3">
							<Swords className="w-7 h-7 text-white" />
						</div>
						<h1 className="text-2xl font-bold text-white mb-1">Tìm Đối Thủ</h1>
						<p className="text-slate-400 text-sm">Chọn môn thể thao, chọn sân trên bản đồ và tìm đối thủ</p>
					</div>

					{/* Socket + Location status bar */}
					<div className="flex items-center justify-between mb-5 text-xs">
						<div className="flex items-center gap-2">
							<span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
							<span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
								{isConnected ? 'Real-time' : 'Đang kết nối...'}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<MapPin className="w-3 h-3 text-slate-500" />
							{locationStatus === 'loading' && <span className="text-slate-500">Đang lấy GPS...</span>}
							{locationStatus === 'success' && <span className="text-emerald-400">GPS OK</span>}
							{locationStatus === 'error' && <span className="text-amber-400">Mặc định TP.HCM</span>}
						</div>
					</div>

					{/* Sport selection — 1 row, 4 cols */}
					<div className="mb-5">
						<label className="block text-sm font-semibold text-slate-300 mb-2.5">Môn thể thao</label>
						<div className="grid grid-cols-4 gap-2.5">
							{SPORTS.map((sport) => (
								<button
									key={sport.key}
									type="button"
									onClick={() => { setSelectedSport(sport.key); setSelectedCourtId(''); setSelectedCourtName(''); }}
									className={`mm-sport-card flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
										selectedSport === sport.key
											? 'selected border-blue-500/80 bg-blue-500/12'
											: 'border-slate-700/60 bg-slate-800/40'
									}`}
								>
									<span className="text-2xl">{sport.emoji}</span>
									<span className={`font-semibold text-xs ${selectedSport === sport.key ? 'text-blue-300' : 'text-slate-400'}`}>
										{sport.label}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Map for court selection */}
					{selectedSport && MAPBOX_TOKEN && (
						<div className="mb-5" style={{ animation: 'mm-fade-up 0.3s ease-out' }}>
							<div className="flex items-center justify-between mb-2.5">
								<label className="text-sm font-semibold text-slate-300">
									Chọn sân trên bản đồ <span className="text-slate-500 font-normal">(tuỳ chọn)</span>
								</label>
								<button type="button" onClick={handleFlyToMe} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
									<Navigation className="w-3 h-3" /> Vị trí của tôi
								</button>
							</div>
							<div className="rounded-xl overflow-hidden border border-slate-700/60" style={{ height: 320 }}>
								<Map
									ref={mapRef}
									initialViewState={{
										longitude: userLocation?.lng ?? 106.6297,
										latitude: userLocation?.lat ?? 10.8231,
										zoom: 13,
									}}
									mapboxAccessToken={MAPBOX_TOKEN}
									mapStyle="mapbox://styles/mapbox/dark-v11"
									reuseMaps
								>
									{/* User location marker */}
									{userLocation && (
										<Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
											<div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50" />
										</Marker>
									)}

									{/* Court markers */}
									{courtsOnMap.map((court) => {
										if (!court.coordinates) return null;
										const isSelected = selectedCourtId === court.id;
										return (
											<Marker
												key={court.id}
												longitude={court.coordinates.longitude}
												latitude={court.coordinates.latitude}
												anchor="bottom"
											>
												<button
													type="button"
													onClick={() => handleSelectCourtOnMap(court)}
													className={`mm-map-marker flex flex-col items-center transition-transform ${isSelected ? 'scale-125' : 'scale-100 hover:scale-110'}`}
												>
													<span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-lg whitespace-nowrap ${
														isSelected
															? 'bg-cyan-400 text-slate-900'
															: 'bg-slate-800/90 text-white border border-slate-600/60'
													}`}>
														{court.name.length > 18 ? court.name.slice(0, 18) + '…' : court.name}
													</span>
													<div className={`mt-1 w-3 h-3 rounded-full shadow-lg ${
														isSelected ? 'bg-cyan-400 ring-2 ring-cyan-400/40' : 'bg-blue-500'
													}`} />
												</button>
											</Marker>
										);
									})}
								</Map>
							</div>
							{/* Selected court indicator */}
							{selectedCourtId && (
								<div className="mt-2 flex items-center gap-2 text-sm">
									<MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
									<span className="text-cyan-300 font-semibold truncate">{selectedCourtName}</span>
									<button type="button" onClick={() => { setSelectedCourtId(''); setSelectedCourtName(''); }} className="text-slate-500 hover:text-red-400 transition ml-auto">
										<X className="w-3.5 h-3.5" />
									</button>
								</div>
							)}
							{courtsOnMap.length === 0 && (
								<p className="mt-2 text-xs text-slate-500 text-center">Không tìm thấy sân cho môn này. Bạn vẫn có thể tìm đối thủ mà không chọn sân.</p>
							)}
						</div>
					)}

					{/* Fallback if no Mapbox token */}
					{selectedSport && !MAPBOX_TOKEN && (
						<div className="mb-5 rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 text-center text-sm text-slate-500">
							Thiếu Mapbox token — không thể hiển thị bản đồ.
						</div>
					)}

					{/* Error */}
					{error && (
						<div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
					)}

					{/* Join Button */}
					<button
						type="button" onClick={handleJoin} disabled={loading || !selectedSport}
						className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
						{loading ? 'Đang xử lý...' : 'Tìm Đối Thủ'}
					</button>
				</div>
			)}

			{/* ── WAITING STATE ── */}
			{mmState === 'WAITING' && (
				<div className="mm-card glass-panel" style={{ animation: 'mm-fade-up 0.5s ease-out' }}>
					<div className="mm-radar-container">
						<div className="mm-radar-ring" /><div className="mm-radar-ring" /><div className="mm-radar-ring" />
						<div className="mm-radar-sweep" /><div className="mm-radar-center-dot" /><div className="mm-radar-pulse-ring" />
					</div>
					<div className="text-center mb-6">
						<h2 className="text-xl font-bold text-white mb-2">
							Đang tìm đối thủ<span className="mm-waiting-dots ml-1"><span>.</span><span>.</span><span>.</span></span>
						</h2>
						<p className="text-slate-400 text-sm">Hệ thống đang ghép bạn với người chơi phù hợp</p>
					</div>
					<div className="text-center mb-6">
						<div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700/60 px-5 py-2.5">
							<Clock className="w-4 h-4 text-blue-400" />
							<span className="mm-timer text-lg font-bold text-white">{formatTime(waitSeconds)}</span>
							<span className="text-slate-500 text-xs">/ 30:00</span>
						</div>
					</div>
					<div className="flex flex-col gap-2 mb-6">
						<div className="flex items-center gap-2 text-sm text-slate-400">
							<Zap className="w-4 h-4 text-cyan-400" />
							<span>Môn: <span className="text-white font-semibold">{SPORTS.find((s) => s.key === (ticket?.sport ?? selectedSport))?.label ?? selectedSport}</span></span>
						</div>
						{ticket?.court_id && (
							<div className="flex items-center gap-2 text-sm text-slate-400">
								<MapPin className="w-4 h-4 text-cyan-400" /><span>Sân cụ thể</span>
							</div>
						)}
					</div>
					<div className="mm-progress-track">
						<div className="mm-progress-fill" style={{ width: `${progressPct}%` }} />
					</div>
					<p className="text-center text-xs text-slate-500 mt-2">Hết hạn sau {formatTime(Math.max(0, 1800 - waitSeconds))}</p>
					<button type="button" onClick={handleCancel} disabled={loading}
						className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-50">
						{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
						Huỷ Tìm Kiếm
					</button>
				</div>
			)}

			{/* ── MATCHED STATE ── */}
			{mmState === 'MATCHED' && (
				<div className="mm-card glass-panel mm-matched-card">
					<div className="mm-confetti-container">
						{Array.from({ length: 24 }).map((_, i) => (
							<div key={i} className="mm-confetti-piece" style={{
								left: `${Math.random() * 100}%`, top: `${Math.random() * 30 - 15}%`,
								backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
								animationDelay: `${Math.random() * 1.5}s`, animationDuration: `${1.5 + Math.random() * 1}s`,
							}} />
						))}
					</div>
					<div className="text-center mb-8 relative z-10">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-400 mb-4">
							<Trophy className="w-8 h-8 text-white" />
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">Đã Tìm Được Đối Thủ! 🎉</h2>
						<p className="text-slate-400 text-sm">Cùng nhau thi đấu nào!</p>
					</div>
					{matchData?.match_score != null && (
						<div className="mm-score-badge flex justify-center mb-6">
							<div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 px-5 py-2">
								<Target className="w-4 h-4 text-cyan-400" />
								<span className="text-sm font-bold text-cyan-300">Độ tương thích: {Math.round(matchData.match_score)}%</span>
							</div>
						</div>
					)}
					{opponent && (
						<div className="relative z-10 rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 mb-6">
							<div className="flex items-center gap-4">
								<div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-lg font-black text-slate-950 ring-2 ring-cyan-400/30 shrink-0">
									{opponent.avatarUrl ? <img src={opponent.avatarUrl} alt={opponent.name} className="h-full w-full object-cover" /> : opponent.name?.charAt(0).toUpperCase() ?? 'U'}
								</div>
								<div className="min-w-0">
									<h3 className="text-lg font-bold text-white truncate">{opponent.name ?? opponent.userName}</h3>
									<p className="text-sm text-slate-400">@{opponent.userName}</p>
								</div>
							</div>
						</div>
					)}
					{matchData?.court_id && (
						<div className="relative z-10 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 mb-6">
							<div className="flex items-center gap-3">
								<MapPin className="w-5 h-5 text-blue-400 shrink-0" />
								<div className="min-w-0">
									<p className="text-sm font-semibold text-white truncate">{matchData.court_id.name}</p>
									<p className="text-xs text-slate-400 truncate">{matchData.court_id.location}</p>
								</div>
							</div>
						</div>
					)}
					<div className="relative z-10 flex flex-col gap-3">
						<button type="button" onClick={handleGoToChat}
							className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:brightness-110">
							<MessageCircle className="w-5 h-5" /> Vào Chat
						</button>
						{matchData?.court_id && (
							<button type="button"
								onClick={() => {
									const cid = typeof matchData.court_id === 'object'
										? (matchData.court_id as any)._id?.toString() ?? ''
										: String(matchData.court_id);
									if (cid && !cid.includes('[object')) {
										navigate(`/courts/${cid}`);
									}
								}}
								className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:brightness-110">
								<MapPin className="w-5 h-5" /> Đặt Sân
							</button>
						)}
						<button type="button" onClick={handleReset}
							className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700/50">
							<RotateCcw className="w-4 h-4" /> Tìm Đối Thủ Khác
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
