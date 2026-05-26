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
	acceptMatch, declineMatch, completeMatch, submitMatchFeedback, reportOpponent,
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
	const { onMatchFound, onPlayerAccepted, onMatchConfirmed, onMatchCancelled, onPlayerCheckedIn, onMatchCompleted, onPlayerReported } = useSocket();
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

	const [hasAccepted, setHasAccepted] = useState(false);
	const [opponentAccepted, setOpponentAccepted] = useState(false);
	const [confirmCountdown, setConfirmCountdown] = useState(300);

	const [completeLoading, setCompleteLoading] = useState(false);

	// Survey Modal States
	const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
	const [feedbackSuccess, setFeedbackSuccess] = useState(false);
	const [feedbackLoading, setFeedbackLoading] = useState(false);
	const [surveyPunctual, setSurveyPunctual] = useState<boolean | null>(null);
	const [surveyAttitude, setSurveyAttitude] = useState<'friendly' | 'neutral' | 'bad' | null>(null);
	const [surveySkill, setSurveySkill] = useState<boolean | null>(null);
	const [surveyPlayAgain, setSurveyPlayAgain] = useState<boolean | null>(null);

	// Rewards Earned
	const [rewardsEarned, setRewardsEarned] = useState<{ xpGained: number; pointsGained: number } | null>(null);

	// Report Opponent States
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [reportReason, setReportReason] = useState('');
	const [reportDescription, setReportDescription] = useState('');
	const [reportLoading, setReportLoading] = useState(false);

	// Received Report Notification State
	const [reportNotification, setReportNotification] = useState<{
		matchId: string;
		reportId: string;
		reporterName: string;
		reason: string;
		description: string;
		createdAt: string;
	} | null>(null);

	// Toast Notification State
	const [toastMessage, setToastMessage] = useState('');
	const showToast = useCallback((msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(''), 4000);
	}, []);



	// GPS and scheduled time verification logic






	// Real-time tick for complete-match countdown
	const [nowTick, setNowTick] = useState(Date.now());

	useEffect(() => {
		if (mmState !== 'MATCHED' || matchData?.status !== 'CONFIRMED') return;
		const timer = setInterval(() => setNowTick(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [mmState, matchData?.status]);

	const completeUnlockInfo = useMemo(() => {
		if (!matchData) return { canComplete: false, remainingMin: 0, remainingSec: 0 };
		const scheduledTime = matchData.scheduled_at
			? new Date(matchData.scheduled_at).getTime()
			: new Date(matchData.createdAt || Date.now()).getTime();
		const unlockTime = scheduledTime + 15 * 60 * 1000;
		const diff = unlockTime - nowTick;
		return {
			canComplete: diff <= 0,
			remainingMin: Math.max(0, Math.floor(diff / 60000)),
			remainingSec: Math.max(0, Math.floor((diff % 60000) / 1000)),
		};
	}, [matchData, nowTick]);

	const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// Race-condition guard: set true the moment user clicks Hủy so socket events are ignored
	const isCancellingRef = useRef(false);

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
		let curId = '';
		try {
			const stored = localStorage.getItem('currentUser');
			if (stored) {
				const parsed = JSON.parse(stored);
				curId = parsed.id ?? parsed._id ?? '';
			}
		} catch { /* ignore */ }

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
							const m = mid as unknown as MatchData;
							setMatchData(m);
							const idStr = (m as any)._id?.toString();
							if (idStr) setResolvedMatchId(idStr);

							// Determine acceptance states
							if (m.accepted_by && curId) {
								setHasAccepted(m.accepted_by.some((id: any) => String(id) === String(curId)));
								const opp = m.participants.find((p) => {
									const pId = typeof p === 'object' && p ? (p._id || (p as any).id) : p;
									return String(pId) !== String(curId);
								});
								if (opp) {
									const oppId = typeof opp === 'object' && opp ? (opp._id || (opp as any).id) : opp;
									setOpponentAccepted(m.accepted_by.some((id: any) => String(id) === String(oppId)));
								}
							}
						} else {
							const idStr = String(mid);
							if (idStr && !idStr.includes('[object')) {
								setResolvedMatchId(idStr);
								// Fallback: create a dummy matchData to prevent endless loading spinner
								setMatchData({
									_id: idStr,
									participants: [],
									owner_id: { _id: '', name: '', userName: '' },
									court_id: { _id: '', name: 'Đang tải sân...', location: '', sports: [] },
									sport: selectedSport || res.ticket.sport || '',
									match_score: 100,
									chat_deleted_by: [],
									accepted_by: [],
									checked_in_players: [],
									status: 'PENDING',
								} as any);
							}
						}
					} else {
						// Match object doesn't exist, fall back to IDLE
						setMmState('IDLE');
					}
				}
			})
			.catch(() => { })
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

	// Countdown timer for confirmation
	useEffect(() => {
		if (mmState === 'MATCHED' && matchData && matchData.status === 'PENDING') {
			const deadline = matchData.confirmation_deadline ? new Date(matchData.confirmation_deadline).getTime() : Date.now() + 300000;
			const initialSeconds = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
			setConfirmCountdown(initialSeconds);

			countdownTimerRef.current = setInterval(() => {
				setConfirmCountdown((prev) => {
					if (prev <= 1) {
						if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} else {
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
				countdownTimerRef.current = null;
			}
		}

		return () => {
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
				countdownTimerRef.current = null;
			}
		};
	}, [mmState, matchData]);

	// Listen for match_found
	useEffect(() => {
		onMatchFound((payload) => {
			// Ignore if user just cancelled (race condition guard)
			if (isCancellingRef.current) return;
			setMmState('MATCHED');
			setMatchData(payload.match as MatchData);
			setResolvedMatchId(String(payload.matchId));
			setWaitSeconds(0);
			setHasAccepted(false);
			setOpponentAccepted(false);
		});
	}, [onMatchFound]);

	// Listen for player_accepted
	useEffect(() => {
		onPlayerAccepted((payload) => {
			if (String(payload.matchId) === resolvedMatchId) {
				setOpponentAccepted(true);
				setMatchData((prev) => {
					if (!prev) return null;
					const accepted = prev.accepted_by ?? [];
					if (accepted.some((id: any) => String(id) === String(payload.playerId))) return prev;
					return {
						...prev,
						accepted_by: [...accepted, payload.playerId],
					};
				});
			}
		});
	}, [onPlayerAccepted, resolvedMatchId]);

	// Listen for match_confirmed
	useEffect(() => {
		onMatchConfirmed((payload) => {
			setMmState('MATCHED');
			setMatchData(payload.match as MatchData);
			setResolvedMatchId(String(payload.matchId));
			setHasAccepted(true);
			setOpponentAccepted(true);
		});
	}, [onMatchConfirmed]);

	// Listen for match_cancelled
	useEffect(() => {
		onMatchCancelled((payload) => {
			if (String(payload.matchId) === resolvedMatchId) {
				if (payload.reason === 'decline') {
					setError('Đối thủ đã từ chối trận đấu.');
				} else if (payload.reason === 'timeout') {
					setError('Đã hết thời gian xác nhận trận đấu.');
				}

				if (payload.isBackInQueue) {
					setMmState('WAITING');
					setMatchData(null);
					setResolvedMatchId('');
					setHasAccepted(false);
					setOpponentAccepted(false);
					if (payload.ticket) {
						setTicket(payload.ticket as MatchmakingTicket);
						const created = new Date((payload.ticket as any).createdAt ?? Date.now()).getTime();
						setWaitSeconds(Math.floor((Date.now() - created) / 1000));
					}
				} else {
					setMmState('IDLE');
					setTicket(null);
					setMatchData(null);
					setResolvedMatchId('');
					setWaitSeconds(0);
					setHasAccepted(false);
					setOpponentAccepted(false);
				}
			}
		});
	}, [onMatchCancelled, resolvedMatchId]);

	// Listen for player_checked_in
	useEffect(() => {
		onPlayerCheckedIn((payload) => {
			if (String(payload.matchId) === resolvedMatchId) {
				setMatchData((prev) => {
					if (!prev) return null;
					const checkedIn = prev.checked_in_players ?? [];
					if (checkedIn.includes(payload.playerId)) return prev;
					return {
						...prev,
						checked_in_players: [...checkedIn, payload.playerId],
					};
				});
			}
		});
	}, [onPlayerCheckedIn, resolvedMatchId]);

	// Listen for match_completed
	useEffect(() => {
		onMatchCompleted((payload) => {
			if (String(payload.matchId) === resolvedMatchId) {
				setMatchData((prev) => {
					if (!prev) return null;
					return {
						...prev,
						status: 'COMPLETED',
					};
				});
			}
		});
	}, [onMatchCompleted, resolvedMatchId]);

	// Listen for player_reported (when opponent reports you)
	useEffect(() => {
		onPlayerReported((payload) => {
			setReportNotification(payload);
		});
	}, [onPlayerReported]);

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
		isCancellingRef.current = true; // Block any incoming match_found socket events
		setLoading(true); setError('');
		try {
			await cancelMatchmaking();
			setMmState('IDLE'); setTicket(null); setWaitSeconds(0);
		} catch (err: unknown) {
			isCancellingRef.current = false; // Restore on error so matching works again
			setError(err instanceof Error ? err.message : 'Không thể huỷ.');
		} finally { setLoading(false); }
	}, []);

	const handleGoToChat = useCallback(() => {
		if (resolvedMatchId) {
			navigate(`/chat/${resolvedMatchId}`);
		}
	}, [resolvedMatchId, navigate]);

	const handleAccept = useCallback(async () => {
		if (!resolvedMatchId) return;
		setLoading(true);
		setError('');
		try {
			const res = await acceptMatch(resolvedMatchId);
			setHasAccepted(true);
			setMatchData(res.match);
			if (res.match.status === 'CONFIRMED') {
				setOpponentAccepted(true);
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Không thể xác nhận trận đấu');
		} finally {
			setLoading(false);
		}
	}, [resolvedMatchId]);

	const handleDecline = useCallback(async () => {
		if (!resolvedMatchId) return;
		setLoading(true);
		setError('');
		try {
			await declineMatch(resolvedMatchId);
			setMmState('IDLE');
			setTicket(null);
			setMatchData(null);
			setResolvedMatchId('');
			setWaitSeconds(0);
			setHasAccepted(false);
			setOpponentAccepted(false);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Không thể từ chối trận đấu');
		} finally {
			setLoading(false);
		}
	}, [resolvedMatchId]);



	const handleCompleteMatch = useCallback(async () => {
		if (!resolvedMatchId) return;
		setCompleteLoading(true);
		setError('');
		try {
			const res = await completeMatch(resolvedMatchId);
			setMatchData(res.match);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Không thể hoàn thành trận đấu');
		} finally {
			setCompleteLoading(false);
		}
	}, [resolvedMatchId]);

	const handleReset = useCallback(() => {
		setMmState('IDLE'); setTicket(null); setMatchData(null); setResolvedMatchId(''); setWaitSeconds(0); setError('');
		setHasAccepted(false); setOpponentAccepted(false);
	}, []);

	const handleCloseSurvey = useCallback(() => {
		handleReset();
		setFeedbackSubmitted(false);
		setFeedbackSuccess(false);
		setSurveyPunctual(null);
		setSurveyAttitude(null);
		setSurveySkill(null);
		setSurveyPlayAgain(null);
		setRewardsEarned(null);
	}, [handleReset]);

	const handleFeedbackSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		if (!resolvedMatchId) return;
		if (surveyPunctual === null || !surveyAttitude || surveySkill === null || surveyPlayAgain === null) {
			setError('Vui lòng hoàn thành tất cả câu hỏi khảo sát!');
			return;
		}

		setFeedbackLoading(true);
		setError('');
		try {
			const res = await submitMatchFeedback(resolvedMatchId, {
				punctual: surveyPunctual,
				attitude: surveyAttitude,
				skill_as_described: surveySkill,
				play_again: surveyPlayAgain,
			});
			if (res.rewards) {
				showToast(`Đánh giá thành công! Bạn nhận được +${res.rewards.xpGained} XP và +${res.rewards.pointsGained} Điểm thưởng.`);
			} else {
				showToast('Đánh giá thành công!');
			}
			handleCloseSurvey();
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : 'Không thể gửi đánh giá';
			if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('đã đánh giá')) {
				showToast('Bạn đã thực hiện đánh giá cho trận đấu này rồi!');
				handleCloseSurvey();
			} else {
				setError(errMsg);
			}
		} finally {
			setFeedbackLoading(false);
		}
	}, [resolvedMatchId, surveyPunctual, surveyAttitude, surveySkill, surveyPlayAgain, handleCloseSurvey]);

	const handleReportSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		if (!resolvedMatchId) return;
		if (!reportReason || !reportDescription) {
			setError('Vui lòng chọn lý do và điền mô tả báo cáo!');
			return;
		}

		setReportLoading(true);
		setError('');
		try {
			await reportOpponent(resolvedMatchId, {
				reason: reportReason,
				description: reportDescription,
			});
			showToast('Đã gửi báo cáo cho Admin kiểm duyệt! 🛡️');
			setIsReportModalOpen(false);
			setReportReason('');
			setReportDescription('');
			handleReset();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Không thể gửi báo cáo');
		} finally {
			setReportLoading(false);
		}
	}, [resolvedMatchId, reportReason, reportDescription, handleReset, showToast]);

	const opponent = useMemo(() => {
		return matchData?.participants?.find((p) => {
			const pId = typeof p === 'object' && p ? (p._id || (p as any).id) : p;
			return String(pId) !== String(currentUser?.id);
		});
	}, [matchData, currentUser]);



	const handleFlyToMe = useCallback(() => {
		if (userLocation && mapRef.current) {
			mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14, duration: 800 });
		}
	}, [userLocation]);

	const progressPct = Math.max(0, 100 - (waitSeconds / 1800) * 100);

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
									className={`mm-sport-card flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${selectedSport === sport.key
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
													<span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-lg whitespace-nowrap ${isSelected
														? 'bg-cyan-400 text-slate-900'
														: 'bg-slate-800/90 text-white border border-slate-600/60'
														}`}>
														{court.name.length > 18 ? court.name.slice(0, 18) + '…' : court.name}
													</span>
													<div className={`mt-1 w-3 h-3 rounded-full shadow-lg ${isSelected ? 'bg-cyan-400 ring-2 ring-cyan-400/40' : 'bg-blue-500'
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
					{error && (
						<div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 text-center animate-pulse">
							{error}
						</div>
					)}
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

					{!matchData ? (
						<div className="flex flex-col items-center justify-center py-12 gap-4">
							<Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
							<p className="text-slate-400 text-sm">Đang tải thông tin trận đấu...</p>
						</div>
					) : matchData.status === 'CANCELLED' ? (
						<div className="text-center py-8 px-4 relative z-10 animate-fade-in flex flex-col items-center">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 mb-5 shadow-lg shadow-red-500/20">
								<X className="w-8 h-8 text-white" />
							</div>
							<h2 className="text-2xl font-bold text-white mb-2">Trận Đấu Đã Bị Huỷ</h2>
							<p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Trận đấu này không còn hiệu lực do đối thủ từ chối hoặc đã quá giờ xác nhận.</p>
							<button type="button" onClick={handleReset}
								className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:brightness-110">
								<RotateCcw className="w-5 h-5" /> Tìm Đối Thủ Khác
							</button>
						</div>
					) : (
						<>
							{matchData.status === 'PENDING' ? (
								<>
									{/* ──── DOUBLE OPT-IN WAITING CONFIRMATION ──── */}
									<div className="text-center mb-6 relative z-10">
										<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 mb-4 shadow-lg shadow-orange-500/20">
											<Swords className="w-8 h-8 text-white" />
										</div>
										<h2 className="text-2xl font-bold text-white mb-2">Đã Tìm Thấy Đối Thủ! 🎉</h2>
										<p className="text-slate-400 text-sm">Vui lòng xác nhận thi đấu trước khi hết giờ</p>
									</div>

									<div className="text-center mb-6">
										<div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700/60 px-5 py-2.5">
											<Clock className="w-4 h-4 text-amber-400 animate-pulse" />
											<span className="text-lg font-bold text-white font-mono">{formatTime(confirmCountdown)}</span>
											<span className="text-slate-500 text-xs">xác nhận</span>
										</div>
									</div>
								</>
							) : (
								<>
									{/* ──── CONFIRMED / GAME ON ──── */}
									<div className="text-center mb-8 relative z-10">
										<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-400 mb-4 shadow-lg shadow-emerald-500/20">
											<Trophy className="w-8 h-8 text-white" />
										</div>
										<h2 className="text-2xl font-bold text-white mb-2">Ghép Cặp Thành Công!</h2>
										<p className="text-slate-400 text-sm">Chúc bạn có một trận đấu vui vẻ!</p>
									</div>
								</>
							)}

							{matchData.match_score != null && (
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

							{matchData.court_id && (
								<div className="relative z-10 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 mb-6">
									<div className="flex items-center gap-3">
										<MapPin className="w-5 h-5 text-blue-400 shrink-0" />
										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-white truncate">{matchData.court_id.name}</p>
											<p className="text-xs text-slate-400 truncate">{matchData.court_id.location}</p>
											{matchData.scheduled_at && (
												<p className="text-xs text-cyan-400 font-bold mt-1.5 flex items-center gap-1.5">
													<span>⏰ Giờ chơi:</span>
													<span>
														{(() => {
															const d = new Date(matchData.scheduled_at);
															const datePart = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
															const timePart = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
															return `${timePart} ngày ${datePart}`;
														})()}
													</span>
												</p>
											)}
										</div>
									</div>
								</div>
							)}



							{matchData.status === 'PENDING' && (
								<div className="relative z-10 rounded-xl border border-slate-700/60 bg-slate-800/30 p-4 mb-6">
									<div className="flex flex-col gap-2 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-slate-400">Trạng thái của bạn:</span>
											<span className={hasAccepted ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
												{hasAccepted ? "Đã xác nhận" : "Chờ xác nhận"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-400 font-normal">Trạng thái đối thủ:</span>
											<span className={opponentAccepted ? "text-emerald-400 font-bold" : "text-slate-500 font-normal"}>
												{opponentAccepted ? "Đã sẵn sàng" : "Đang suy nghĩ..."}
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Error */}
							{error && (
								<div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 z-10 relative">{error}</div>
							)}

							<div className="relative z-10 flex flex-col gap-3">
								{matchData.status === 'PENDING' ? (
									<>
										{!hasAccepted ? (
											<button type="button" onClick={handleAccept} disabled={loading}
												className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:brightness-110 disabled:opacity-50">
												{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
												Xác Nhận Sẵn Sàng
											</button>
										) : (
											<div className="text-center py-2.5 text-slate-400 text-sm font-semibold animate-pulse border border-slate-700/60 bg-slate-800/30 rounded-xl">
												Đang chờ đối thủ xác nhận...
											</div>
										)}
										<button type="button" onClick={handleDecline} disabled={loading}
											className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-50">
											{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
											Từ Chối Thi Đấu
										</button>
									</>
								) : (
									<>
										<button type="button" onClick={handleCompleteMatch} disabled={completeLoading || !completeUnlockInfo.canComplete}
											className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
											{completeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
											{completeUnlockInfo.canComplete
												? '🏁 Hoàn thành Trận Đấu'
												: `⏳ Còn ${String(completeUnlockInfo.remainingMin).padStart(2, '0')}:${String(completeUnlockInfo.remainingSec).padStart(2, '0')} để hoàn thành`}
										</button>

										<button type="button" onClick={handleGoToChat}
											className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:brightness-110">
											<MessageCircle className="w-5 h-5" /> Vào Chat
										</button>


										<button
											type="button"
											onClick={() => {
												setReportReason("Không điểm danh / Bỏ trận (AFK)");
												setIsReportModalOpen(true);
											}}
											className="w-full flex flex-col items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer px-6 py-3 transition"
										>
											<div className="flex items-center gap-2 text-sm font-bold">
												<span>⚠️ Tố cáo đối thủ không đến</span>
											</div>
										</button>
									</>
								)}
							</div>
						</>
					)}
				</div>
			)}

			{/* ── POST-MATCH SURVEY MODAL ── */}
			{matchData?.status === 'COMPLETED' && !feedbackSubmitted && (
				<div className="mm-modal-overlay">
					<div className="mm-modal-content glass-panel" style={{ animation: 'mm-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
						{!feedbackSuccess ? (
							<form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-5">
								<div className="text-center">
									<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-3 shadow-lg shadow-blue-500/20 animate-pulse">
										<Trophy className="w-7 h-7 text-white" />
									</div>
									<h2 className="text-xl font-bold text-white mb-1">Trận Đấu Đã Kết Thúc! 🏁</h2>
									<p className="text-slate-400 text-xs">Vui lòng hoàn thành khảo sát 15s để xây dựng cộng đồng văn minh.</p>
								</div>

								{opponent && (
									<div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
										<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-sm font-black text-slate-950 ring-2 ring-cyan-400/20 shrink-0">
											{opponent.avatarUrl ? <img src={opponent.avatarUrl} alt={opponent.name} className="h-full w-full object-cover" /> : opponent.name?.charAt(0).toUpperCase() ?? 'U'}
										</div>
										<div className="min-w-0">
											<p className="text-sm font-semibold text-white truncate">Đánh giá: {opponent.name ?? opponent.userName}</p>
											<p className="text-[11px] text-slate-500 truncate">@{opponent.userName}</p>
										</div>
										<span className="ml-auto text-[10px] text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">Blind Review 🔒</span>
									</div>
								)}

								<div className="flex flex-col gap-4">
									{/* Q1: Đúng giờ */}
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold text-slate-300">1. Đối thủ có đúng giờ chơi không?</span>
										<div className="grid grid-cols-2 gap-3">
											<button
												type="button"
												onClick={() => setSurveyPunctual(true)}
												className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${surveyPunctual === true
													? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/10'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												Có, đúng giờ
											</button>
											<button
												type="button"
												onClick={() => setSurveyPunctual(false)}
												className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${surveyPunctual === false
													? 'border-red-500 bg-red-500/15 text-red-400 shadow-lg shadow-red-500/10'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												Không, đi muộn
											</button>
										</div>
									</div>

									{/* Q2: Thái độ */}
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold text-slate-300">2. Thái độ ứng xử của đối thủ?</span>
										<div className="grid grid-cols-3 gap-2.5">
											<button
												type="button"
												onClick={() => setSurveyAttitude('friendly')}
												className={`flex flex-col items-center gap-1 py-2 rounded-xl border font-bold text-[10px] transition-all ${surveyAttitude === 'friendly'
													? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												<span className="text-lg">🙂</span>
												Thân thiện
											</button>
											<button
												type="button"
												onClick={() => setSurveyAttitude('neutral')}
												className={`flex flex-col items-center gap-1 py-2 rounded-xl border font-bold text-[10px] transition-all ${surveyAttitude === 'neutral'
													? 'border-amber-500 bg-amber-500/15 text-amber-400'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												<span className="text-lg">😐</span>
												Bình thường
											</button>
											<button
												type="button"
												onClick={() => setSurveyAttitude('bad')}
												className={`flex flex-col items-center gap-1 py-2 rounded-xl border font-bold text-[10px] transition-all ${surveyAttitude === 'bad'
													? 'border-pink-500 bg-pink-500/15 text-pink-400'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												<span className="text-lg">🙁</span>
												Không tốt
											</button>
										</div>
									</div>

									{/* Q3: Trình độ đúng mô tả */}
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold text-slate-300">3. Trình độ kỹ năng đúng như khai báo?</span>
										<div className="grid grid-cols-2 gap-3">
											<button
												type="button"
												onClick={() => setSurveySkill(true)}
												className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${surveySkill === true
													? 'border-blue-500 bg-blue-500/15 text-blue-400 shadow-lg shadow-blue-500/10'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												Chuẩn mô tả
											</button>
											<button
												type="button"
												onClick={() => setSurveySkill(false)}
												className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${surveySkill === false
													? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-lg shadow-amber-500/10'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												Lệch mô tả
											</button>
										</div>
									</div>

									{/* Q4: Muốn chơi lại */}
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold text-slate-300">4. Bạn có muốn ghép cặp cùng người này nữa không?</span>
										<div className="grid grid-cols-2 gap-3">
											<button
												type="button"
												onClick={() => setSurveyPlayAgain(true)}
												className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${surveyPlayAgain === true
													? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/10'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												Có, muốn chơi lại
											</button>
											<button
												type="button"
												onClick={() => setSurveyPlayAgain(false)}
												className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${surveyPlayAgain === false
													? 'border-red-500 bg-red-500/15 text-red-400 shadow-lg shadow-red-500/10'
													: 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
													}`}
											>
												Không, không hợp
											</button>
										</div>
									</div>
								</div>

								{error && (
									<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{error}</div>
								)}

								<div className="mt-2 text-center text-[11px] text-slate-500">
									🎁 Phần thưởng: <span className="text-yellow-400 font-bold">+10 XP</span> và <span className="text-emerald-400 font-bold">+5 Điểm thưởng</span>
								</div>

								<button
									type="submit"
									disabled={feedbackLoading || surveyPunctual === null || !surveyAttitude || surveySkill === null || surveyPlayAgain === null}
									className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{feedbackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi Đánh Giá & Nhận Quà 🎁'}
								</button>

								<button
									type="button"
									onClick={() => setIsReportModalOpen(true)}
									className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold transition hover:bg-red-500/20 hover:text-red-300"
								>
									⚠️ Báo cáo đối thủ xấu
								</button>
							</form>
						) : (
							<div className="flex flex-col items-center text-center py-6 gap-5 animate-fade-in">
								<div className="relative">
									<div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
									<div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 shadow-lg shadow-emerald-500/30">
										<span className="text-4xl animate-bounce">🎁</span>
									</div>
								</div>

								<div>
									<h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300 mb-1">
										Đánh Giá Thành Công!
									</h2>
									<p className="text-xs text-slate-400">Cảm ơn bạn đã góp ý xây dựng cộng đồng tin cậy!</p>
								</div>

								{rewardsEarned && (
									<div className="flex gap-4 p-4 rounded-xl border border-slate-700/60 bg-slate-800/40 min-w-[200px] justify-center">
										<div className="flex flex-col items-center">
											<span className="text-lg font-black text-yellow-400 animate-pulse">+{rewardsEarned.xpGained}</span>
											<span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Kinh nghiệm (XP)</span>
										</div>
										<div className="w-[1px] bg-slate-700" />
										<div className="flex flex-col items-center">
											<span className="text-lg font-black text-emerald-400 animate-pulse">+{rewardsEarned.pointsGained}</span>
											<span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Điểm thưởng</span>
										</div>
									</div>
								)}

								<button
									type="button"
									onClick={handleCloseSurvey}
									className="mt-2 w-full flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
								>
									Đóng & Quay lại Tìm Trận
								</button>
							</div>
						)}
					</div>
				</div>
			)}
			{/* ── REPORT MODAL ── */}
			{isReportModalOpen && (
				<div className="mm-modal-overlay" style={{ zIndex: 1100 }}>
					<div className="mm-modal-content glass-panel" style={{ maxWidth: '440px', animation: 'mm-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
						<div className="text-center mb-4">
							<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 mb-2.5 shadow-lg shadow-red-500/20">
								<Swords className="w-6 h-6 text-white" />
							</div>
							<h2 className="text-xl font-bold text-white">Báo Cáo Đối Thủ ⚠️</h2>
							<p className="text-slate-400 text-xs mt-1">Nội dung báo cáo kèm bản ghi chat sẽ được gửi tới Admin để kiểm duyệt.</p>
						</div>

						<form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-slate-400">LÝ DO BÁO CÁO</label>
								<select
									value={reportReason}
									onChange={(e) => setReportReason(e.target.value)}
									required
									className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500/50"
								>
									<option value="">-- Chọn lý do báo cáo --</option>
									<option value="Thái độ không đẹp / Xúc phạm">Thái độ không đẹp / Lời lẽ xúc phạm 😡</option>
									<option value="Gian lận / Sai lệch trình độ">Gian lận / Sai lệch trình độ 📈</option>
									<option value="Không điểm danh / Bỏ trận (AFK)">Không điểm danh / Bỏ trận (AFK) ⏰</option>
									<option value="Lý do khác">Lý do khác...</option>
								</select>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-slate-400">MÔ TẢ CHI TIẾT</label>
								<textarea
									value={reportDescription}
									onChange={(e) => setReportDescription(e.target.value)}
									required
									placeholder="Vui lòng cung cấp chi tiết sự việc..."
									rows={4}
									className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500/50 resize-none"
								/>
							</div>

							{error && (
								<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">{error}</div>
							)}

							<div className="flex gap-3 mt-1">
								<button
									type="button"
									onClick={() => {
										setIsReportModalOpen(false);
										setReportReason('');
										setReportDescription('');
										setError('');
									}}
									className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800/20 text-slate-400 text-xs font-semibold transition hover:bg-slate-700/30 hover:text-slate-300"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={reportLoading}
									className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-500 py-3 text-xs font-bold text-white shadow-lg shadow-red-500/25 transition hover:shadow-red-500/40 hover:brightness-110 disabled:opacity-50"
								>
									{reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi Báo Cáo 🛡️'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ── REPORT NOTIFICATION MODAL (for the reported player) ── */}
			{reportNotification && (
				<div className="mm-modal-overlay" style={{ zIndex: 1200 }}>
					<div className="mm-modal-content glass-panel" style={{ maxWidth: '440px', animation: 'mm-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
						<div className="text-center mb-4">
							<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-3 shadow-lg shadow-amber-500/20">
								<span className="text-2xl">🛡️</span>
							</div>
							<h2 className="text-xl font-bold text-white mb-1">Bạn đã bị tố cáo</h2>
							<p className="text-slate-400 text-xs">Đối thủ đã gửi báo cáo về bạn. Bạn có thể kháng cáo bằng cách liên hệ Admin.</p>
						</div>

						<div className="flex flex-col gap-3 mb-5">
							<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
								<div className="flex flex-col gap-2 text-sm">
									<div className="flex items-start gap-2">
										<span className="text-slate-500 shrink-0 text-xs font-bold mt-0.5">Người tố cáo:</span>
										<span className="text-amber-300 font-semibold text-xs">{reportNotification.reporterName}</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="text-slate-500 shrink-0 text-xs font-bold mt-0.5">Lý do:</span>
										<span className="text-white text-xs">{reportNotification.reason}</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="text-slate-500 shrink-0 text-xs font-bold mt-0.5">Mô tả:</span>
										<span className="text-slate-300 text-xs">{reportNotification.description}</span>
									</div>
								</div>
							</div>

							<div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
								<p className="text-[11px] text-blue-300">
									💡 <strong>Kháng cáo:</strong> Nếu bạn cho rằng báo cáo này không chính xác, vui lòng vào <strong>Trang cá nhân</strong> của bạn để gửi kháng cáo chi tiết cho Admin. Mã báo cáo: <span className="font-mono text-cyan-400">#{reportNotification.reportId.slice(-6)}</span>
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => {
									setReportNotification(null);
									handleReset();
								}}
								className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800/20 text-slate-400 text-xs font-semibold transition hover:bg-slate-700/30 hover:text-slate-300"
							>
								Đã hiểu
							</button>
							<button
								type="button"
								onClick={() => {
									setReportNotification(null);
									navigate('/profile');
								}}
								className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:brightness-110"
							>
								Kháng cáo ngay ⚖️
							</button>
						</div>
					</div>
				</div>
			)}


			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-[#06152d]/95 px-5 py-4 text-sm font-semibold text-emerald-400 shadow-2xl shadow-emerald-950/40 backdrop-blur animate-fade-in">
					<span className="text-base font-bold">✓</span>
					{toastMessage}
				</div>
			)}
		</div>
	);
};
