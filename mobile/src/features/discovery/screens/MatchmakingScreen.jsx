import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Animated, Easing, Image, Modal, TextInput } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import matchmakingApi from "../../../api/matchmakingApi";
import bookingApi from "../../../api/bookingApi";
import { setStatus, setMatchData } from "../../../store/slices/matchmakingSlice";
import MiniMap from "../../../components/MiniMap";
import ReportModal from "./ReportModal";
import { getSocket } from "../../../utils/socket";
import LoginRequiredScreen from "../../../components/LoginRequiredScreen";
import { useAppModal } from "../../../components/AppModal";

export default function MatchmakingScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const { user, isGuest } = useSelector(state => state.auth);
    const { status, matchData } = useSelector(state => state.matchmaking);

    // ── Guest guard ───────────────────────────────────────
    if (isGuest) {
        return (
            <LoginRequiredScreen
                icon="flash-outline"
                title="Đăng nhập để ghép kèo"
                description="Tính năng tìm đối thủ chỉ dành cho thành viên đã đăng nhập. Hãy đăng nhập để bắt đầu!"
            />
        );
    }
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSport, setSelectedSport] = useState("football");
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showReportModal, setShowReportModal] = useState(false);
    
    // Feedback Modal State
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [completedMatchId, setCompletedMatchId] = useState(null);
    const [feedbackForm, setFeedbackForm] = useState({
        punctual: null,           // true / false
        attitude: null,           // "friendly" | "neutral" | "bad"
        skill_as_described: null, // true / false
        play_again: null,         // true / false
    });
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    
    // Deposit States
    const [opponentDeposit, setOpponentDeposit] = useState(null);
    const [depositCountdown, setDepositCountdown] = useState(0);
    const [isPayingDeposit, setIsPayingDeposit] = useState(false);
    
    // Timer States
    const [nowTick, setNowTick] = useState(Date.now());
    const [initialLoading, setInitialLoading] = useState(true); // true cho đến khi check status xong lần đầu

    const pollRef = useRef(null);  // useRef để tránh race condition với polling

    useEffect(() => {
        if (route.params?.selectedCourtId) {
            setSelectedCourt({
                id: route.params.selectedCourtId,
                name: route.params.selectedCourtName
            });
        }
    }, [route.params?.selectedCourtId]);

    // Animation cho radar
    const [pulseAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (status === "WAITING") {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(0);
        }
    }, [status]);


    useEffect(() => {
        let interval;
        if (status === "WAITING") {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Polling trạng thái khi đang WAITING hoặc MATCHED hoặc CONFIRMED
    useEffect(() => {
        if (status === "WAITING" || status === "MATCHED" || status === "CONFIRMED") {
            pollRef.current = setInterval(async () => {
                try {
                    const res = await matchmakingApi.getStatus();
                    const serverStatus = res.data?.status;

                    if (serverStatus === "WAITING") {
                        // Vẫn đang tìm → tiếp tục poll, không làm gì thêm
                    } else if (serverStatus === "MATCHED" || serverStatus === "CONFIRMED") {
                        const match = res.data?.ticket?.match_id;
                        if (match) dispatch(setMatchData(match));

                        if (match?.status === "COMPLETED") {
                            clearInterval(pollRef.current);
                            pollRef.current = null;
                            const matchId = match._id || match.id;
                            setCompletedMatchId(matchId);
                            setShowFeedbackModal(true);
                        } else if (match?.status === "CONFIRMED") {
                            dispatch(setStatus("CONFIRMED"));
                            try {
                                const depRes = await bookingApi.getMatchPendingDeposit(match._id || match.id);
                                if (depRes.data?.pending_deposit) {
                                    setOpponentDeposit(depRes.data.pending_deposit);
                                    if (depRes.data.pending_deposit.deadline) {
                                        const remainingSec = Math.max(0, Math.floor((new Date(depRes.data.pending_deposit.deadline).getTime() - Date.now()) / 1000));
                                        setDepositCountdown(remainingSec);
                                    }
                                } else {
                                    setOpponentDeposit(null);
                                }
                            } catch (e) {}
                        } else {
                            dispatch(setStatus("MATCHED"));
                        }
                    } else {
                        // Server trả về IDLE hoặc không có ticket (bị cancel/hết hạn) → reset về IDLE
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                        dispatch(setStatus("IDLE"));
                        dispatch(setMatchData(null));
                    }
                } catch (err) {
                    // Ignore network errors during polling
                }
            }, 5000);
        } else {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        return () => {
            clearInterval(pollRef.current);
            pollRef.current = null;
        };
    }, [status, dispatch]);

    // Socket listener: clear deposit banner and timer instantly when court is cancelled
    useEffect(() => {
        if (!matchData) return;
        const matchId = matchData._id || matchData.id;
        if (!matchId) return;

        let socket;
        let mounted = true;
        getSocket().then((s) => {
            if (!s || !mounted) return;
            socket = s;
            socket.on("court_cancelled", (data) => {
                if (data.matchId === matchId) {
                    // Clear deposit countdown
                    setOpponentDeposit(null);
                    setDepositCountdown(0);
                    // Clear scheduled_end_at so complete-match timer stops
                    dispatch(setMatchData({
                        ...matchData,
                        scheduled_at: null,
                        scheduled_end_at: null,
                    }));
                }
            });
        });
        return () => {
            mounted = false;
            if (socket) socket.off("court_cancelled");
        };
    }, [matchData, dispatch]);

    // Kiểm tra trạng thái khi user đã load xong (fix: auth race condition)
    useEffect(() => {
        const userId = user?._id || user?.id;
        if (!userId) return; // User chưa load → giữ spinner, đợi

        setInitialLoading(true);
        let cancelled = false;
        const fallbackTimer = setTimeout(() => {
            if (!cancelled) setInitialLoading(false);
        }, 15000);

        const fetchCurrentStatus = async () => {
            try {
                const res = await matchmakingApi.getStatus();
                if (cancelled) return;
                const serverStatus = res.data?.status;
                if (serverStatus === "WAITING") {
                    dispatch(setStatus("WAITING"));
                } else if (serverStatus === "MATCHED" || serverStatus === "CONFIRMED") {
                    const match = res.data?.ticket?.match_id;
                    if (match) dispatch(setMatchData(match));

                    if (match?.status === "COMPLETED") {
                        const matchId = match._id || match.id;
                        setCompletedMatchId(matchId);
                        setShowFeedbackModal(true);
                    } else if (match?.status === "CONFIRMED") {
                        dispatch(setStatus("CONFIRMED"));
                        try {
                            const depRes = await bookingApi.getMatchPendingDeposit(match._id || match.id);
                            if (depRes.data?.pending_deposit) {
                                setOpponentDeposit(depRes.data.pending_deposit);
                                if (depRes.data.pending_deposit.deadline) {
                                    const remainingSec = Math.max(0, Math.floor((new Date(depRes.data.pending_deposit.deadline).getTime() - Date.now()) / 1000));
                                    setDepositCountdown(remainingSec);
                                }
                            }
                        } catch (e) {}
                    } else {
                        dispatch(setStatus("MATCHED"));
                    }
                } else {
                    // Server trả về IDLE hoặc không có ticket (DB bị xóa, match bị cancel) → về IDLE
                    dispatch(setStatus("IDLE"));
                    dispatch(setMatchData(null));
                }
            } catch (err) {
                // Ignore: 401 khi chưa auth, hoặc không có ticket
            } finally {
                if (!cancelled) {
                    clearTimeout(fallbackTimer);
                    setInitialLoading(false);
                }
            }
        };
        fetchCurrentStatus();

        return () => {
            cancelled = true;
            clearTimeout(fallbackTimer);
        };
    }, [user?._id, user?.id, dispatch]); // Re-run khi user load xong


    // Timer for Match Completion — dùng ref để clear chính xác, tránh race condition
    const completionTimerRef = useRef(null);

    useEffect(() => {
        // Dọn interval cũ trước
        if (completionTimerRef.current) {
            clearInterval(completionTimerRef.current);
            completionTimerRef.current = null;
        }

        if (status !== "CONFIRMED" || !matchData?.scheduled_end_at) return;

        const endTime = new Date(matchData.scheduled_end_at).getTime();
        const unlockTime = endTime - 15 * 60 * 1000;

        // Đã mở khóa rồi — set một lần, không cần interval
        if (Date.now() >= unlockTime) {
            setNowTick(Date.now());
            return;
        }

        completionTimerRef.current = setInterval(() => {
            const now = Date.now();
            setNowTick(now);
            if (now >= unlockTime) {
                clearInterval(completionTimerRef.current);
                completionTimerRef.current = null;
            }
        }, 1000);

        return () => {
            if (completionTimerRef.current) {
                clearInterval(completionTimerRef.current);
                completionTimerRef.current = null;
            }
        };
    }, [status, matchData?.scheduled_end_at]);

    const completeUnlockInfo = useMemo(() => {
        if (!matchData) return { canComplete: false, hasTimer: false, remainingMin: 0, remainingSec: 0 };
        // Chưa đặt sân → không cho complete
        if (!matchData.scheduled_end_at) return { canComplete: false, hasTimer: false, remainingMin: 0, remainingSec: 0 };
        // Có in-app booking → đếm ngược đến 15p trước giờ kết thúc
        const endTime = new Date(matchData.scheduled_end_at).getTime();
        const unlockTime = endTime - 15 * 60 * 1000;
        const diff = unlockTime - nowTick;
        return {
            canComplete: diff <= 0,
            hasTimer: true,
            remainingMin: Math.max(0, Math.floor(diff / 60000)),
            remainingSec: Math.max(0, Math.floor((diff % 60000) / 1000)),
        };
    }, [matchData, nowTick]);

    // Countdown for Deposit
    useEffect(() => {
        if (!opponentDeposit || depositCountdown <= 0) return;
        const timer = setInterval(() => {
            setDepositCountdown(prev => {
                if (prev <= 1) {
                    setOpponentDeposit(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [opponentDeposit, depositCountdown]);

    const handlePayDeposit = async () => {
        if (!opponentDeposit?.bookingId) return;
        try {
            setIsPayingDeposit(true);
            await bookingApi.opponentPayBooking(opponentDeposit.bookingId);
            setOpponentDeposit(null);
            showModal({ type: "success", title: "Thanh toán thành công", message: "Thanh toán thành công! Sân đã được đặt." });
            const res = await matchmakingApi.getStatus();
            if (res.data?.ticket?.match_id) dispatch(setMatchData(res.data.ticket.match_id));
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || err.message;
            if (msg.toLowerCase().includes("số dư") || msg.toLowerCase().includes("insufficient")) {
                showModal({ type: "error", title: "Số dư không đủ", message: "Số dư ví không đủ. Vui lòng nạp thêm tiền!" });
            } else {
                showModal({ type: "error", title: "Thanh toán thất bại", message: "Thanh toán thất bại: " + msg });
            }
        } finally {
            setIsPayingDeposit(false);
        }
    };

    const handleJoinQueue = async () => {
        try {
            setIsLoading(true);
            await matchmakingApi.joinQueue({
                sport: selectedSport,
                court_id: selectedCourt?.id,
                longitude: 106.6297, // Mặc định HCM hoặc lấy geolocation
                latitude: 10.8231
            });
            dispatch(setStatus("WAITING"));
        } catch (err) {
            const data = err.response?.data;
            if (data?.message === "already_in_queue") {
                dispatch(setStatus("WAITING"));
            } else {
                console.log("Join queue error:", data || err.message);
                showModal({ type: "error", title: "Lỗi", message: "Không thể tham gia ghép kèo: " + (data?.message || err.message) });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!matchData) return;
        try {
            const res = await matchmakingApi.acceptMatch(matchData._id || matchData.id);
            if (res.data?.match) {
                dispatch(setMatchData(res.data.match));
                if (res.data.match.status === "CONFIRMED") {
                    dispatch(setStatus("CONFIRMED"));
                }
            }
        } catch (err) {
            showModal({ type: "error", title: "Lỗi", message: "Không thể xác nhận" });
        }
    };

    const handleDecline = async () => {
        if (!matchData) return;
        try {
            await matchmakingApi.declineMatch(matchData._id || matchData.id);
            dispatch(setStatus("IDLE"));
            showModal({ type: "info", title: "Đã hủy", message: "Trận đấu đã bị hủy." });
        } catch (err) {
            showModal({ type: "error", title: "Lỗi", message: "Không thể từ chối" });
        }
    };

    const handleCancelQueue = async () => {
        try {
            await matchmakingApi.cancelQueue();
            dispatch(setStatus("IDLE"));
        } catch (err) {
            console.log("Cancel queue error:", err);
            // Vẫn cho về IDLE ở local nếu lỗi mạng để khỏi kẹt màn hình
            dispatch(setStatus("IDLE"));
        }
    };

    const renderRadar = () => {
        const scale1 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
        const opacity1 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
        const scale2 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
        const opacity2 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

        const maxSeconds = 1800; // 30 mins
        const currentSeconds = elapsedTime;
        const remainingSeconds = Math.max(0, maxSeconds - currentSeconds);

        const formatTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        const progressPercent = (currentSeconds / maxSeconds) * 100;
        
        const sportName = selectedSport === 'football' ? 'Bóng đá' : selectedSport === 'badminton' ? 'Cầu lông' : selectedSport === 'tennis' ? 'Tennis' : selectedSport === 'pickleball' ? 'Pickleball' : 'Bóng đá';

        return (
            <View className="flex-1 px-5 pt-8 items-center" style={{ minHeight: 500 }}>

                {/* Radar pulse */}
                <View className="items-center justify-center mb-6" style={{ height: 200, width: '100%' }}>
                    <Animated.View style={{ transform: [{ scale: scale2 }], opacity: opacity2, position: 'absolute' }}
                        className="h-36 w-36 rounded-full border border-sky-400/25" />
                    <Animated.View style={{ transform: [{ scale: scale1 }], opacity: opacity1, position: 'absolute' }}
                        className="h-36 w-36 rounded-full border border-sky-400/50 bg-sky-400/8" />
                    <View className="h-36 w-36 rounded-full border border-sky-400/15 absolute" />
                    {/* Center dot */}
                    <View className="h-16 w-16 rounded-full bg-sky-50 dark:bg-sky-900/40 border-2 border-sky-400/60 items-center justify-center shadow-lg shadow-sky-400/20">
                        <Ionicons name="search" size={28} color="#38bdf8" />
                    </View>
                </View>

                <Text className="font-black text-2xl text-appText text-center mb-1">Đang tìm đối thủ...</Text>
                <Text className="text-sm text-appText/50 text-center mb-6">Hệ thống đang ghép bạn với người chơi phù hợp</Text>

                {/* Status card */}
                <View className="w-full bg-appSurface border border-appText/8 rounded-2xl p-4 mb-6 gap-3">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="time-outline" size={16} color="#38bdf8" />
                            <Text className="text-sm text-appText/60">Thời gian tìm</Text>
                        </View>
                        <Text className="font-black text-sky-500 text-base">{formatTime(currentSeconds)}</Text>
                    </View>
                    <View className="h-px bg-appText/8" />
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="flash" size={16} color="#38bdf8" />
                            <Text className="text-sm text-appText/60">Môn thể thao</Text>
                        </View>
                        <Text className="font-bold text-appText text-sm">{sportName}</Text>
                    </View>
                    <View className="h-px bg-appText/8" />
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="location-outline" size={16} color="#38bdf8" />
                            <Text className="text-sm text-appText/60">Sân cụ thể</Text>
                        </View>
                        <Text className="font-bold text-appText text-sm" numberOfLines={1} style={{ maxWidth: 160 }}>
                            {selectedCourt ? selectedCourt.name : 'Bất kỳ sân nào'}
                        </Text>
                    </View>
                </View>

                {/* Progress */}
                <View className="w-full mb-1">
                    <View className="h-1.5 bg-appText/8 rounded-full overflow-hidden">
                        <View className="h-full bg-sky-400 rounded-full" style={{ width: `${progressPercent}%` }} />
                    </View>
                    <Text className="text-xs text-appText/40 text-center mt-2">Hết hạn sau {formatTime(remainingSeconds)}</Text>
                </View>

                {/* Cancel */}
                <TouchableOpacity onPress={handleCancelQueue}
                    className="w-full py-3.5 mt-auto mb-4 rounded-2xl border border-red-500/30 bg-red-500/8 items-center justify-center flex-row gap-2">
                    <Ionicons name="close-circle-outline" size={18} color="#F87171" />
                    <Text className="text-red-400 font-bold text-sm">Huỷ Tìm Kiếm</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const handleCompleteMatch = () => {
        showModal({
            type: "confirm",
            title: "Hoàn thành trận đấu",
            message: "Xác nhận hoàn thành trận đấu này? Bạn sẽ được đánh giá đối thủ sau khi xác nhận.",
            buttons: [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xác nhận",
                    onPress: async () => {
                        if (!matchData) return;
                        try {
                            setIsLoading(true);
                            await matchmakingApi.completeMatch(matchData._id || matchData.id);
                            setCompletedMatchId(matchData._id || matchData.id);
                            setShowFeedbackModal(true);
                        } catch (err) {
                            showModal({ type: "error", title: "Lỗi", message: err.response?.data?.error || "Không thể hoàn thành trận đấu." });
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ],
        });
    };

    const handleSubmitFeedback = async () => {
        const { punctual, attitude, skill_as_described, play_again } = feedbackForm;
        if (punctual === null || attitude === null || skill_as_described === null || play_again === null) {
            showModal({ type: "warning", title: "Thiếu thông tin", message: "Vui lòng trả lời đủ 4 câu hỏi trước khi gửi." });
            return;
        }
        if (!completedMatchId) return;
        try {
            setIsSubmittingFeedback(true);
            await matchmakingApi.submitFeedback(completedMatchId, { punctual, attitude, skill_as_described, play_again });
            showModal({ type: "success", title: "Cảm ơn!", message: "Đánh giá đã được ghi nhận. Bạn nhận được +10 XP và +5 điểm!" });
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg === "already_feedbacked") {
                showModal({ type: "info", title: "Thông báo", message: "Bạn đã đánh giá trận này rồi." });
            } else {
                showModal({ type: "error", title: "Lỗi", message: "Không thể gửi đánh giá." });
            }
        } finally {
            setIsSubmittingFeedback(false);
            setShowFeedbackModal(false);
            setFeedbackForm({ punctual: null, attitude: null, skill_as_described: null, play_again: null });
            dispatch(setStatus("IDLE"));
            dispatch(setMatchData(null));
        }
    };

    const handleSkipFeedback = () => {
        setShowFeedbackModal(false);
        setFeedbackForm({ punctual: null, attitude: null, skill_as_described: null, play_again: null });
        dispatch(setStatus("IDLE"));
        dispatch(setMatchData(null));
    };

    const renderMatchCard = (isConfirmed) => {
        const currentUserId = String(user?._id || user?.id);
        const opponent = matchData?.participants?.find(p => String(p?._id || p?.id) !== currentUserId) || {};
        const court = matchData?.court_id || selectedCourt || {};

        return (
            <View className="flex-1 items-center px-4 pt-10 pb-6 min-h-[600px]">
                {/* Icon Trophy / Search */}
                <View className="h-20 w-20 rounded-2xl bg-emerald-100 shadow-md shadow-emerald-900/10 items-center justify-center mb-6">
                    <Ionicons name={isConfirmed ? "trophy-outline" : "search-outline"} size={44} color="#059669" />
                </View>

                {/* Title */}
                <Text className="text-2xl font-bold text-appText mb-2">
                    {isConfirmed ? "Ghép Cặp Thành Công!" : "Đã tìm thấy trận!"}
                </Text>
                <Text className="text-sm text-appText/60 mb-8">
                    {isConfirmed ? "Chúc bạn có một trận đấu vui vẻ!" : "Đợi cả hai cùng xác nhận để bắt đầu"}
                </Text>

                {/* Compatibility */}
                <View className="bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 rounded-full px-5 py-2 flex-row items-center gap-2 mb-8">
                    <Ionicons name="scan-outline" size={16} color="#3b82f6" />
                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">Độ tương thích: 95%</Text>
                </View>

                {/* Opponent Card */}
                <View className="w-full bg-white dark:bg-appSurface border border-appText/10 rounded-xl p-4 mb-4 flex-row items-center gap-4 shadow-sm shadow-black/5">
                    <Image source={{ uri: opponent.avatarUrl || "https://i.pravatar.cc/150?img=12" }} className="h-14 w-14 rounded-full border-2 border-emerald-500 bg-slate-200" />
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-appText">{opponent.name || opponent.userName || "Ẩn danh (Theo ELO)"}</Text>
                        <Text className="text-sm text-appText/60 mt-0.5">@{opponent.userName || "unknown"}</Text>
                    </View>
                </View>

                {/* Court Card */}
                <View className="w-full bg-white dark:bg-appSurface border border-appText/10 rounded-xl p-4 mb-8 flex-row items-start gap-4 shadow-sm shadow-black/5">
                    <View className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mt-1">
                        <Ionicons name="location-outline" size={20} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-bold text-appText">{court.name || "Sân Bóng Chảo Lửa"}</Text>
                        <Text className="text-xs text-appText/50 mt-1" numberOfLines={2}>{court.location || "30 Phan Thúc Duyện, Phường 4, Tân Bình, HCM"}</Text>
                        
                        {/* Booked Time */}
                        {matchData?.scheduled_at && (
                            <View className="flex-row items-center mt-2 bg-blue-50 dark:bg-blue-900/20 self-start px-2 py-1 rounded-md">
                                <Ionicons name="alarm-outline" size={14} color="#3b82f6" />
                                <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-1">
                                    Giờ chơi: {new Date(matchData.scheduled_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Ho_Chi_Minh'})} ngày {new Date(matchData.scheduled_at).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric', timeZone: 'Asia/Ho_Chi_Minh'})}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Actions */}
                {isConfirmed ? (
                    <View className="w-full mt-auto gap-3">
                        {/* Deposit prompt */}
                        {opponentDeposit && (
                            <View className="w-full mb-1 bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 rounded-xl p-4">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Ionicons name="warning" size={20} color="#ea580c" />
                                    <Text className="font-bold text-orange-600 dark:text-orange-400">Yêu Cầu Thanh Toán Sân</Text>
                                </View>
                                <Text className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                                    Đối thủ đã đặt cọc 50%. Bạn cần thanh toán {new Intl.NumberFormat('vi-VN').format(opponentDeposit.amount)}đ phần còn lại.
                                </Text>
                                <View className="flex-row items-center justify-between mb-4 bg-orange-100/50 dark:bg-orange-950/50 p-2 rounded-lg">
                                    <Text className="text-xs text-orange-600 font-medium">Hạn chót thanh toán:</Text>
                                    <Text className="font-bold text-orange-600">
                                        {Math.floor(depositCountdown / 60).toString().padStart(2, '0')}:{(depositCountdown % 60).toString().padStart(2, '0')}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={handlePayDeposit}
                                    disabled={isPayingDeposit}
                                    className="w-full py-3 rounded-xl bg-orange-500 items-center justify-center shadow-sm"
                                >
                                    {isPayingDeposit ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold">Thanh Toán Ngay</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                        

                        {/* === ACTION BUTTONS === */}
                        {/* Hoàn thành: chỉ hiện khi có booking, đếm ngược, sáng khi còn 15p */}
                        <TouchableOpacity
                            onPress={handleCompleteMatch}
                            disabled={isLoading || !completeUnlockInfo.canComplete}
                            className={`w-full py-4 rounded-xl items-center justify-center flex-row gap-2 ${
                                completeUnlockInfo.canComplete
                                    ? 'bg-emerald-600'
                                    : 'bg-appSurface border border-appText/15'
                            }`}
                            style={{ opacity: completeUnlockInfo.canComplete ? 1 : 0.7 }}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={completeUnlockInfo.canComplete ? 'white' : '#94A3B8'} />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={20}
                                        color={completeUnlockInfo.canComplete ? 'white' : '#64748B'} />
                                    <Text style={{ color: completeUnlockInfo.canComplete ? 'white' : '#64748B', fontWeight: '700', fontSize: 15 }}>
                                        {!matchData?.scheduled_end_at
                                            ? 'Hoàn Thành (chưa đặt sân)'
                                            : completeUnlockInfo.canComplete
                                                ? 'Hoàn Thành Trận Đấu'
                                                : `Còn ${String(completeUnlockInfo.remainingMin).padStart(2,'0')}:${String(completeUnlockInfo.remainingSec).padStart(2,'0')} để hoàn thành`
                                        }
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Vào Chat */}
                        <TouchableOpacity
                            onPress={() => {
                                const currentUserId = String(user?._id || user?.id);
                                const opp = matchData?.participants?.find(p => String(p?._id || p?.id) !== currentUserId) || {};
                                navigation.navigate('Chat', {
                                    matchId: matchData?._id || matchData?.id,
                                    opponentName: opp.name || opp.userName || 'Đối thủ',
                                });
                            }}
                            className="w-full py-4 rounded-xl bg-[#0EA5E9] items-center justify-center flex-row gap-2 shadow-md shadow-sky-500/30"
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                            <Text className="text-white font-bold text-base">Vào Chat</Text>
                        </TouchableOpacity>

                        {/* Tố cáo + Hủy Trận — cùng hàng */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowReportModal(true)}
                                className="flex-1 py-4 rounded-xl bg-slate-800 border border-slate-700 items-center justify-center flex-row gap-2"
                            >
                                <Ionicons name="warning" size={15} color="#F59E0B" />
                                <Text className="text-slate-300 font-bold text-sm">Tố cáo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleDecline}
                                disabled={isLoading || !!matchData?.scheduled_end_at}
                                className="flex-1 py-4 rounded-xl items-center justify-center flex-row gap-2 border"
                                style={{
                                    borderColor: matchData?.scheduled_end_at ? 'rgba(100,116,139,0.2)' : '#FCA5A5',
                                    backgroundColor: matchData?.scheduled_end_at ? 'transparent' : 'rgba(239,68,68,0.08)',
                                    opacity: matchData?.scheduled_end_at ? 0.45 : 1,
                                }}
                            >
                                <Ionicons name="close-circle-outline" size={15}
                                    color={matchData?.scheduled_end_at ? '#64748B' : '#EF4444'} />
                                <Text style={{
                                    color: matchData?.scheduled_end_at ? '#64748B' : '#EF4444',
                                    fontWeight: '700', fontSize: 14
                                }}>Hủy Trận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View className="w-full mt-auto">
                        {matchData?.accepted_by?.includes(currentUserId) ? (
                            <View className="w-full py-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 items-center justify-center mb-4">
                                <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-base">Đã chấp nhận. Chờ đối thủ...</Text>
                            </View>
                        ) : (
                            <View className="w-full flex-row gap-4 mb-4">
                                <TouchableOpacity onPress={handleDecline} className="flex-1 py-4 rounded-xl bg-white dark:bg-appSurface border border-appText/20 items-center justify-center">
                                    <Text className="text-appText/70 font-bold text-base">Từ Chối</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAccept} className="flex-2 px-10 py-4 rounded-xl bg-emerald-500 items-center justify-center shadow-md shadow-emerald-500/30">
                                    <Text className="text-white font-bold text-base">Chấp Nhận</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <>
        <ScrollView className="flex-1 bg-appBg">
            <View className="flex-row items-center justify-between px-4 pb-3 pt-12 bg-white dark:bg-appSurface border-b border-appText/5">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#059669" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-emerald-700 dark:text-emerald-500">Ghép kèo</Text>
                <View className="w-10" />
            </View>

            {/* Loading lần đầu — chờ check status từ server */}
            {initialLoading && (
                <View className="flex-1 items-center justify-center py-24">
                    <ActivityIndicator size="large" color="#059669" />
                    <Text className="text-appText/50 text-sm mt-3">Đang kiểm tra trạng thái...</Text>
                </View>
            )}

            {!initialLoading && status === "WAITING" && renderRadar()}
            {!initialLoading && status === "MATCHED" && renderMatchCard(false)}
            {!initialLoading && status === "CONFIRMED" && renderMatchCard(true)}

            {!initialLoading && status === "IDLE" && (
                <View className="px-5 pt-6 pb-8">

                    {/* Hero */}
                    <View className="items-center mb-6">
                        <View className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 items-center justify-center mb-3 shadow-sm shadow-emerald-900/10">
                            <Ionicons name="flash" size={34} color="#059669" />
                        </View>
                        <Text className="text-2xl font-black text-appText mb-1">Tìm đối thủ</Text>
                        <Text className="text-sm text-appText/50 text-center px-6">
                            AI ghép cặp theo trình độ & khu vực của bạn
                        </Text>
                    </View>

                    {/* Sport selector */}
                    <Text className="text-xs font-black text-appText/40 uppercase tracking-widest mb-3">Môn thể thao</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                        {[
                            { id: 'football',   name: 'Bóng đá',   emoji: '⚽', color: '#16a34a', activeBg: '#dcfce7', activeBorder: '#16a34a' },
                            { id: 'badminton',  name: 'Cầu lông',  emoji: '🏸', color: '#2563eb', activeBg: '#dbeafe', activeBorder: '#2563eb' },
                            { id: 'tennis',     name: 'Tennis',    emoji: '🎾', color: '#d97706', activeBg: '#fef3c7', activeBorder: '#d97706' },
                            { id: 'pickleball', name: 'Pickleball',emoji: '🏓', color: '#7c3aed', activeBg: '#ede9fe', activeBorder: '#7c3aed' },
                        ].map(s => {
                            const active = selectedSport === s.id;
                            return (
                                <TouchableOpacity
                                    key={s.id}
                                    onPress={() => setSelectedSport(s.id)}
                                    activeOpacity={0.8}
                                    style={active ? { backgroundColor: s.activeBg, borderColor: s.activeBorder, borderWidth: 1.5 } : {}}
                                    className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl border ${
                                        active ? '' : 'bg-appSurface border-appText/10'
                                    }`}
                                >
                                    <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                                    <Text style={active ? { color: s.color, fontWeight: '800' } : {}}
                                        className={active ? 'text-sm' : 'text-sm font-semibold text-appText/70'}>
                                        {s.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Court selector */}
                    <Text className="text-xs font-black text-appText/40 uppercase tracking-widest mb-3">Sân thi đấu <Text className="text-appText/25 font-normal normal-case tracking-normal">(tuỳ chọn)</Text></Text>
                    {selectedCourt ? (
                        <View className="flex-row items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 mb-6">
                            <View className="flex-row items-center gap-3">
                                <View className="h-9 w-9 rounded-xl bg-emerald-600 items-center justify-center">
                                    <Ionicons name="location" size={18} color="white" />
                                </View>
                                <View>
                                    <Text className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{selectedCourt.name}</Text>
                                    <Text className="text-xs text-emerald-600/60 dark:text-emerald-500">Sân đã chọn</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedCourt(null)}
                                className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center">
                                <Ionicons name="close" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="mb-6 rounded-2xl overflow-hidden border border-appText/8">
                            <MiniMap sport={selectedSport} onSelectCourt={setSelectedCourt} />
                        </View>
                    )}

                    {/* Tips */}
                    <View className="flex-row items-start gap-3 bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/60 rounded-2xl p-3.5 mb-6">
                        <Ionicons name="sparkles-outline" size={16} color="#3b82f6" style={{ marginTop: 1 }} />
                        <Text className="flex-1 text-xs text-blue-700 dark:text-blue-300 leading-5">
                            Khai báo <Text className="font-bold">kỹ năng</Text> chính xác để AI ghép đối thủ vừa sức hơn!
                        </Text>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        onPress={handleJoinQueue}
                        disabled={isLoading}
                        activeOpacity={0.88}
                        style={{ backgroundColor: '#059669', borderRadius: 18, paddingVertical: 18,
                            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
                            shadowColor: '#059669', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
                            elevation: 8, opacity: isLoading ? 0.7 : 1 }}
                    >
                        {isLoading
                            ? <ActivityIndicator color="white" />
                            : <>
                                <Ionicons name="flash" size={22} color="white" />
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 17 }}>Tìm Trận Ngay</Text>
                              </>
                        }
                    </TouchableOpacity>
                </View>
            )}
            {/* Report Modal */}
            <ReportModal
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                matchId={matchData?._id || matchData?.id}
                opponentName={
                    matchData?.participants?.find(
                        (p) => String(p?._id || p?.id) !== String(user?._id || user?.id)
                    )?.name || "Đối thủ"
                }
            />

            {/* Feedback Modal */}
            <Modal visible={showFeedbackModal} transparent animationType="slide" onRequestClose={handleSkipFeedback}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 }}>
                        
                        {/* Handle bar */}
                        <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Đánh giá đối thủ</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Đánh giá ẩn danh — được xử lý sau 24h</Text>
                            </View>
                            <TouchableOpacity onPress={handleSkipFeedback} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="close" size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Progress bar */}
                        {(() => {
                            const answered = [feedbackForm.punctual, feedbackForm.attitude, feedbackForm.skill_as_described, feedbackForm.play_again].filter(v => v !== null).length;
                            return (
                                <View style={{ marginBottom: 18 }}>
                                    <View style={{ height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                                        <View style={{ height: 4, width: `${(answered / 4) * 100}%`, backgroundColor: '#059669', borderRadius: 2 }} />
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{answered}/4 câu trả lời</Text>
                                </View>
                            );
                        })()}

                        {/* Q1: Punctual */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                                ⏰ Đối thủ có đến đúng giờ không?
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[{ label: '✓ Đúng giờ', val: true, active: '#D1FAE5', activeBorder: '#059669', activeText: '#065F46' },
                                  { label: '✗ Trễ giờ', val: false, active: '#FEE2E2', activeBorder: '#EF4444', activeText: '#991B1B' }].map(opt => {
                                    const sel = feedbackForm.punctual === opt.val;
                                    return (
                                        <TouchableOpacity key={String(opt.val)} onPress={() => setFeedbackForm(p => ({ ...p, punctual: opt.val }))}
                                            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
                                                backgroundColor: sel ? opt.active : '#F8FAFC', borderColor: sel ? opt.activeBorder : '#E2E8F0' }}>
                                            <Text style={{ fontWeight: '700', fontSize: 13, color: sel ? opt.activeText : '#6B7280' }}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Q2: Attitude */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                                🤝 Thái độ thi đấu của đối thủ?
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[{ label: '😊 Thân thiện', val: 'friendly', active: '#D1FAE5', activeBorder: '#059669', activeText: '#065F46' },
                                  { label: '😐 Bình thường', val: 'neutral', active: '#DBEAFE', activeBorder: '#3B82F6', activeText: '#1E40AF' },
                                  { label: '😠 Tiêu cực', val: 'bad', active: '#FEE2E2', activeBorder: '#EF4444', activeText: '#991B1B' }].map(opt => {
                                    const sel = feedbackForm.attitude === opt.val;
                                    return (
                                        <TouchableOpacity key={opt.val} onPress={() => setFeedbackForm(p => ({ ...p, attitude: opt.val }))}
                                            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
                                                backgroundColor: sel ? opt.active : '#F8FAFC', borderColor: sel ? opt.activeBorder : '#E2E8F0' }}>
                                            <Text style={{ fontWeight: '700', fontSize: 11, color: sel ? opt.activeText : '#6B7280', textAlign: 'center' }}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Q3: Skill as described */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                                🎯 Kỹ năng có đúng như mô tả không?
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[{ label: '✓ Đúng', val: true, active: '#D1FAE5', activeBorder: '#059669', activeText: '#065F46' },
                                  { label: '✗ Không đúng', val: false, active: '#FEE2E2', activeBorder: '#EF4444', activeText: '#991B1B' }].map(opt => {
                                    const sel = feedbackForm.skill_as_described === opt.val;
                                    return (
                                        <TouchableOpacity key={String(opt.val)} onPress={() => setFeedbackForm(p => ({ ...p, skill_as_described: opt.val }))}
                                            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
                                                backgroundColor: sel ? opt.active : '#F8FAFC', borderColor: sel ? opt.activeBorder : '#E2E8F0' }}>
                                            <Text style={{ fontWeight: '700', fontSize: 13, color: sel ? opt.activeText : '#6B7280' }}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Q4: Play again */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                                🔁 Bạn muốn chơi lại với đối thủ này không?
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[{ label: '👍 Muốn', val: true, active: '#D1FAE5', activeBorder: '#059669', activeText: '#065F46' },
                                  { label: '👎 Không', val: false, active: '#FEE2E2', activeBorder: '#EF4444', activeText: '#991B1B' }].map(opt => {
                                    const sel = feedbackForm.play_again === opt.val;
                                    return (
                                        <TouchableOpacity key={String(opt.val)} onPress={() => setFeedbackForm(p => ({ ...p, play_again: opt.val }))}
                                            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
                                                backgroundColor: sel ? opt.active : '#F8FAFC', borderColor: sel ? opt.activeBorder : '#E2E8F0' }}>
                                            <Text style={{ fontWeight: '700', fontSize: 13, color: sel ? opt.activeText : '#6B7280' }}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            onPress={handleSubmitFeedback}
                            disabled={isSubmittingFeedback}
                            style={{ backgroundColor: '#059669', borderRadius: 16, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: isSubmittingFeedback ? 0.7 : 1 }}
                        >
                            {isSubmittingFeedback ? <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} /> : null}
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>GỬI ĐÁNH GIÁ · NHẬN +10 XP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSkipFeedback} style={{ paddingVertical: 12, alignItems: 'center' }}>
                            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}>Bỏ qua</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
        <ModalComponent />
        </>
    );
}
