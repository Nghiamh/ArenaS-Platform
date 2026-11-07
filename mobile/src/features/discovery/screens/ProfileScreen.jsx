import { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal } from "react-native";
import { useAppModal } from "../../../components/AppModal";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { logout, fetchUserProfile } from "../../../store/slices/authSlice";
import { removeItem } from "../../../utils/storage";
import { STORAGE_KEYS } from "../../../constants/config";
import { formatPrice } from "../../../utils/courtHelpers";
import bookingApi from "../../../api/bookingApi";
import matchmakingApi from "../../../api/matchmakingApi";
import React from "react";

export default function ProfileScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const iconColor = isDark ? "#FFFFFF" : "#000000";
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { user, isGuest } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [bookingFilter, setBookingFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Feedback State
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [feedbackBooking, setFeedbackBooking] = useState(null);
    const [punctual, setPunctual] = useState(true);
    const [attitude, setAttitude] = useState('friendly'); // 'friendly', 'neutral', 'bad'
    const [skillAsDescribed, setSkillAsDescribed] = useState(true);
    const [playAgain, setPlayAgain] = useState(true);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // Fetch user profile when entering the screen
    useFocusEffect(
        React.useCallback(() => {
            if (!isGuest && user?.id !== "guest") {
                // Lần đầu load (chưa có data): hiện spinner
                // Quay lại từ màn hình khác (đã có data): refresh ngầm, không flash
                const isFirstLoad = bookings.length === 0;

                if (isFirstLoad) setIsLoading(true);
                dispatch(fetchUserProfile()).finally(() => setIsLoading(false));

                if (isFirstLoad) setIsLoadingBookings(true);
                bookingApi.getMyBookings()
                    .then(res => setBookings(res.data?.bookings || res.data || []))
                    .catch(() => {})
                    .finally(() => setIsLoadingBookings(false));
            }
        }, [dispatch, isGuest])
    );

    const todayObj = new Date();
    const year = todayObj.getFullYear();
    const month = String(todayObj.getMonth() + 1).padStart(2, '0');
    const day = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const tenDaysAgoObj = new Date();
    tenDaysAgoObj.setDate(new Date().getDate() - 10);
    const tenYear = tenDaysAgoObj.getFullYear();
    const tenMonth = String(tenDaysAgoObj.getMonth() + 1).padStart(2, '0');
    const tenDay = String(tenDaysAgoObj.getDate()).padStart(2, '0');
    const tenDaysAgoStr = `${tenYear}-${tenMonth}-${tenDay}`;

    const processedBookings = useMemo(() => {
        return bookings
            .filter(b => b.date >= tenDaysAgoStr)
            .map(b => {
                let status = b.status;
                // Override waiting_opponent to confirmed if the user paid 100%
                if (status === "waiting_opponent" && b.participants) {
                    const totalPaid = b.participants.reduce((sum, p) => p.status === 'paid' ? sum + p.amount : sum, 0);
                    if (totalPaid >= b.total_price) {
                        status = "confirmed";
                    }
                }
                if (status === "confirmed" || status === "pending") {
                    if (b.date < todayStr) {
                        status = "completed";
                    } else if (b.date === todayStr) {
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();
                        const endTimeStr = b.end_time || b.endTime || "23:59";
                        const [endHour, endMinute] = endTimeStr.split(':').map(Number);
                        
                        if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) {
                            status = "completed";
                        }
                    }
                }
                return { ...b, displayStatus: status };
            });
    }, [bookings, tenDaysAgoStr, todayStr]);

    const statusWeight = {
        confirmed: 1,
        waiting_opponent: 1,
        pending: 2,
        completed: 3,
        cancelled: 4
    };

    const sortedBookings = useMemo(() => {
        return (bookingFilter === "all"
            ? processedBookings
            : processedBookings.filter(b => (b.displayStatus === "confirmed" || b.displayStatus === "pending") && b.date >= todayStr)
        ).sort((a, b) => {
            const wA = statusWeight[a.displayStatus] || 99;
            const wB = statusWeight[b.displayStatus] || 99;
            
            if (wA !== wB) return wA - wB;
            
            if (a.date !== b.date) {
                // Completed/Cancelled: newest first (descending)
                // Upcoming: nearest first (ascending)
                if (wA >= 3) return b.date.localeCompare(a.date);
                return a.date.localeCompare(b.date);
            }

            const tA = a.start_time || a.startTime || "00:00";
            const tB = b.start_time || b.startTime || "00:00";
            
            if (wA >= 3) return tB.localeCompare(tA);
            return tA.localeCompare(tB);
        });
    }, [bookingFilter, processedBookings, todayStr]);


    const handleCancelBooking = (booking) => {
        const startDateTime = new Date(`${booking.date}T${booking.start_time || booking.startTime}:00`);
        const now = new Date();
        const hoursDifference = (startDateTime - now) / (1000 * 60 * 60);

        if (hoursDifference < 1) {
            showModal({ type: "error", title: "Không thể hủy", message: "Bạn không thể hủy sân khi chỉ còn chưa tới 1 tiếng trước giờ đá." });
            return;
        }

        let message = "Bạn có chắc chắn muốn hủy sân này?";
        if (hoursDifference >= 3) {
            message += "\nBạn sẽ được hoàn 100% tiền vào ví.";
        } else {
            message += "\nLưu ý: Bạn hủy sát giờ (dưới 3 tiếng). Bạn sẽ chỉ được hoàn 50% tiền vào ví. 50% còn lại sẽ được trả cho Chủ sân.";
        }

        showModal({
            type: "confirm",
            title: "Hủy đặt sân",
            message,
            buttons: [
                { text: "Không", style: "cancel" },
                {
                    text: "Xác nhận hủy",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoadingBookings(true);
                            await bookingApi.cancelBooking(booking._id || booking.id);
                            showModal({ type: "success", title: "Thành công", message: "Đã hủy sân thành công và hoàn tiền vào ví." });
                            const res = await bookingApi.getMyBookings();
                            setBookings(res.data?.bookings || res.data || []);
                        } catch (error) {
                            const errorMsg = error.response?.data?.error || error.response?.data?.message || "Có lỗi xảy ra khi hủy sân.";
                            showModal({ type: "error", title: "Lỗi", message: errorMsg });
                        } finally {
                            setIsLoadingBookings(false);
                        }
                    }
                }
            ],
        });
    };

    const handleSubmitFeedback = async () => {
        try {
            setIsSubmittingFeedback(true);
            const data = {
                punctual,
                attitude,
                skill_as_described: skillAsDescribed,
                play_again: playAgain
            };
            const matchId = feedbackBooking.match_id || feedbackBooking._id || feedbackBooking.id;
            await matchmakingApi.submitFeedback(matchId, data);

            showModal({ type: "success", title: "Chúc mừng!", message: "Bạn nhận được 10 XP & 5 Điểm tích lũy." });
            setFeedbackModalVisible(false);

            // Cập nhật lại danh sách booking để ẩn nút đánh giá (giả lập)
            setBookings(bookings.map(b =>
                (b._id === feedbackBooking._id || b.id === feedbackBooking.id)
                    ? { ...b, is_feedback_submitted: true } : b
            ));

            // Fetch lại profile để cập nhật điểm mới
            dispatch(fetchUserProfile());
        } catch (error) {
            showModal({ type: "error", title: "Lỗi", message: "Không thể gửi đánh giá: " + (error.response?.data?.message || error.message) });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleLogout = async () => {
        showModal({
            type: "confirm",
            title: "Đăng xuất",
            message: "Bạn có chắc chắn muốn đăng xuất?",
            buttons: [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: async () => {
                        await removeItem(STORAGE_KEYS.authToken);
                        await removeItem(STORAGE_KEYS.guestMode);
                        await removeItem(STORAGE_KEYS.user);
                        dispatch(logout());
                    }
                }
            ],
        });
    };

    if (isGuest || !user) {
        const handleGuestLogin = async () => {
            // Dispatch logout để AppNavigator tự switch sang AuthStack (conditional rendering)
            // Không thể navigate() trực tiếp sang screen thuộc stack khác khi đang ở MainTab
            await removeItem(STORAGE_KEYS.authToken);
            await removeItem(STORAGE_KEYS.guestMode);
            await removeItem(STORAGE_KEYS.user);
            dispatch(logout());
        };
        return (
            <View className="flex-1 bg-appBg items-center justify-center px-6">
                <Ionicons name="person-circle-outline" size={64} color={isDark ? "#475569" : "#94A3B8"} />
                <Text className="mt-4 text-base text-appText/70 text-center">
                    Bạn đang sử dụng ứng dụng với tư cách Khách. Vui lòng đăng nhập để xem hồ sơ và quản lý đặt sân.
                </Text>
                <TouchableOpacity
                    onPress={handleGuestLogin}
                    className="mt-6 rounded-full bg-emerald-600 px-8 py-3"
                >
                    <Text className="text-sm font-bold text-white">Đăng nhập ngay</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const userName = user.name || user.fullName || user.username || "Thành viên";
    const userEmail = user.email || "Chưa cập nhật email";
    const userAvatar = user.avatarUrl || user.avatar || user.profilePicture || "https://i.pravatar.cc/150?img=11";

    return (
        <>
            <ScrollView className="flex-1 bg-appBg" contentContainerClassName="px-4 pt-12 pb-10">
                {/* Header */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                        <Ionicons name="location-outline" size={24} color="#059669" />
                        <Text className="text-2xl font-bold text-emerald-600">ArenaS</Text>
                    </View>
                    <TouchableOpacity
                    onPress={() => showModal({ type: "info", title: "Thông báo", message: "Bạn không có thông báo mới." })}
                        className="h-10 w-10 items-center justify-center rounded-full bg-appSurface border border-appText/10"
                    >
                        <Ionicons name="notifications-outline" size={20} color={iconColor} />
                    </TouchableOpacity>
                </View>

                {/* Profile Info */}
                <View className="mt-6 flex-row items-center">
                    <View className="relative">
                        <Image
                            source={{ uri: userAvatar }}
                            className="h-16 w-16 rounded-full bg-slate-200"
                        />
                        <View className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-0.5 border-2 border-appBg">
                            <MaterialCommunityIcons name="check-decagram" size={14} color="white" />
                        </View>
                    </View>
                    <View className="ml-4 flex-1">
                        {isLoading ? (
                            <View className="flex-row items-center gap-2">
                                <ActivityIndicator size="small" color="#059669" />
                                <Text className="text-sm text-appText/60">Đang cập nhật...</Text>
                            </View>
                        ) : (
                            <>
                                <Text className="text-xl font-bold text-appText">{userName}</Text>
                                <Text className="text-sm text-appText/60">{userEmail}</Text>
                                <View className="flex-row items-center mt-1">
                                    <Text className="text-xs font-bold text-emerald-600">Uy tín: {user.reliability_score ?? 100}/100 </Text>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                </View>
                            </>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Chỉnh sửa hồ sơ")}
                        className="h-10 w-10 items-center justify-center rounded-xl bg-appSurface border border-appText/10"
                    >
                        <Ionicons name="settings-outline" size={20} color={iconColor} />
                    </TouchableOpacity>
                </View>

                {/* Additional Info */}
                {!isLoading && user && (
                    <View className="mt-4 rounded-2xl bg-appSurface p-4 border border-appText/10 shadow-sm shadow-black/5">
                        <View className="flex-row items-center justify-between py-2 border-b border-appText/5">
                            <Text className="text-sm font-semibold text-appText/70">Số điện thoại</Text>
                            <Text className="text-sm text-appText">{user.phone || "Chưa cập nhật"}</Text>
                        </View>
                        <View className="flex-row items-center justify-between py-2 border-b border-appText/5">
                            <Text className="text-sm font-semibold text-appText/70">Ngày sinh</Text>
                            <Text className="text-sm text-appText">
                                {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                            </Text>
                        </View>
                        <View className="flex-row items-center justify-between py-2">
                            <Text className="text-sm font-semibold text-appText/70">Địa chỉ</Text>
                            <Text className="text-sm text-appText text-right flex-1 ml-4" numberOfLines={2}>
                                {user.address || "Chưa cập nhật"}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Stats Card */}
                <View className="mt-6 flex-row rounded-2xl bg-appSurface py-4 border border-appText/10 shadow-sm shadow-black/5">
                    <View className="flex-1 items-center border-r border-appText/10">
                        <Text className="text-[10px] font-medium text-appText/60 uppercase">Điểm tích lũy</Text>
                        <Text className="mt-1 text-base font-bold text-emerald-600">{user.points ?? 0} pts</Text>
                    </View>
                    <View className="flex-1 items-center border-r border-appText/10">
                        <Text className="text-[10px] font-medium text-appText/60 uppercase">Đã đặt sân</Text>
                        <Text className="mt-1 text-base font-bold text-appText">{bookings.length} buổi</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate("Kỹ năng")} className="flex-1 items-center justify-center">
                        <Text className="text-[10px] font-medium text-appText/60 uppercase">Kỹ năng</Text>
                        <Text className="mt-1 text-sm font-bold text-emerald-600">Xem ›</Text>
                    </TouchableOpacity>
                </View>

                {/* Ranking Tier Card */}
                {!isLoading && user && (() => {
                    const xp = user.xp ?? 0;
                    const TIERS = [
                        { name: "BRONZE",   min: 0,    icon: "medal-outline",   color: "#F59E0B" },
                        { name: "SILVER",   min: 100,  icon: "medal-outline",   color: "#94A3B8" },
                        { name: "GOLD",     min: 300,  icon: "trophy-outline",  color: "#EAB308" },
                        { name: "PLATINUM", min: 600,  icon: "diamond-outline", color: "#06B6D4" },
                        { name: "DIAMOND",  min: 1000, icon: "diamond-outline", color: "#A78BFA" },
                        { name: "ELITE",    min: 2000, icon: "flame-outline",   color: "#00d26a" },
                    ];
                    const currentTier = [...TIERS].reverse().find(t => xp >= t.min) || TIERS[0];
                    const currentTierIndex = TIERS.findIndex(t => t.name === currentTier.name);
                    const nextTier = currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;
                    const progressInTier = nextTier
                        ? Math.min(1, (xp - currentTier.min) / (nextTier.min - currentTier.min))
                        : 1;
                    const xpToNext = nextTier ? nextTier.min - xp : 0;

                    return (
                        <View className="mt-6 rounded-2xl overflow-hidden border border-appText/10 shadow-sm shadow-black/5">
                            {/* Header strip */}
                            <View style={{ backgroundColor: currentTier.color + "18" }} className="px-4 pt-4 pb-3">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <View className="h-12 w-12 rounded-2xl items-center justify-center"
                                            style={{ backgroundColor: currentTier.color + "25" }}>
                                            <Ionicons name={currentTier.icon} size={26} color={currentTier.color} />
                                        </View>
                                        <View>
                                            <Text className="text-[11px] text-appText/40 uppercase tracking-widest font-semibold">Cấp bậc</Text>
                                            <Text className="text-2xl font-black tracking-wider" style={{ color: currentTier.color }}>
                                                {currentTier.name}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end bg-appSurface rounded-xl px-3 py-2 border border-appText/10">
                                        <Text className="text-xl font-black text-appText">{xp.toLocaleString()}</Text>
                                        <Text className="text-[10px] text-appText/40 uppercase tracking-widest">XP</Text>
                                    </View>
                                </View>
                                {/* Progress bar */}
                                <View className="mt-4">
                                    <View className="h-2 rounded-full bg-appText/10 overflow-hidden">
                                        <View className="h-full rounded-full" style={{ width: `${Math.max(4, progressInTier * 100)}%`, backgroundColor: currentTier.color }} />
                                    </View>
                                    <View className="flex-row justify-between mt-1.5">
                                        <Text className="text-[10px] text-appText/40">{currentTier.name} · {currentTier.min} XP</Text>
                                        {nextTier ? (
                                            <Text className="text-[10px] text-appText/40">
                                                {nextTier.name} · còn <Text style={{ color: currentTier.color }} className="font-bold">{xpToNext} XP</Text>
                                            </Text>
                                        ) : (
                                            <Text className="text-[10px] font-bold" style={{ color: currentTier.color }}>MAX RANK 🏆</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                            {/* Tier road */}
                            <View className="flex-row bg-appSurface px-3 py-3">
                                {TIERS.map((tier, idx) => {
                                    const unlocked = idx <= currentTierIndex;
                                    const isCurrent = idx === currentTierIndex;
                                    return (
                                        <View key={tier.name} className="flex-1 items-center">
                                            <View className="h-8 w-8 rounded-full items-center justify-center" style={{
                                                backgroundColor: unlocked ? tier.color + "25" : "#E2E8F0",
                                                borderWidth: isCurrent ? 2 : 0,
                                                borderColor: isCurrent ? tier.color : "transparent",
                                                opacity: unlocked ? 1 : 0.3,
                                            }}>
                                                <Ionicons name={tier.icon} size={15} color={unlocked ? tier.color : "#94A3B8"} />
                                            </View>
                                            <Text numberOfLines={1} style={{ color: isCurrent ? tier.color : unlocked ? "#64748B" : "#CBD5E1", fontWeight: isCurrent ? "900" : "500" }}
                                                className="text-[8px] mt-1 text-center">
                                                {tier.name}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })()}

                {/* Bookings Section */}
                <View className="mt-8 flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-appText">Lịch sử đặt sân</Text>
                    <View className="flex-row gap-2">
                        {[{ key: 'all', label: 'Tất cả' }, { key: 'upcoming', label: 'Sắp tới' }].map(f => (
                            <TouchableOpacity key={f.key} onPress={() => setBookingFilter(f.key)}
                                className={`rounded-full px-4 py-1.5 ${bookingFilter === f.key ? 'bg-emerald-700' : 'bg-appSurface border border-appText/10'}`}>
                                <Text className={`text-xs font-semibold ${bookingFilter === f.key ? 'text-white' : 'text-appText/70'}`}>{f.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mt-4 gap-4">
                    {isLoadingBookings ? (
                        <ActivityIndicator size="small" color="#059669" className="my-4" />
                    ) : sortedBookings.length === 0 ? (
                        <View className="items-center py-10 w-full rounded-2xl bg-appSurface border border-appText/10 shadow-sm shadow-black/5 justify-center">
                            <Ionicons name="calendar-outline" size={40} color={isDark ? "#475569" : "#94A3B8"} />
                            <Text className="mt-3 text-sm text-appText/60">Chưa có đơn đặt sân nào</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Trang chủ")} className="mt-4 rounded-full bg-emerald-100 px-6 py-2.5 dark:bg-emerald-900/30">
                                <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Đặt sân ngay</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        sortedBookings.slice(0, 5).map(b => {
                            const statusMap = { confirmed: 'Đã xác nhận', pending: 'Chờ xử lý', cancelled: 'Đã hủy', completed: 'Hoàn thành', waiting_opponent: 'Chờ đối thủ' };
                            const statusColor = { confirmed: 'text-emerald-600', pending: 'text-amber-600', cancelled: 'text-red-500', completed: 'text-blue-600', waiting_opponent: 'text-orange-600' };
                            const bgColor = { confirmed: 'bg-emerald-100 dark:bg-emerald-900/30', pending: 'bg-amber-100 dark:bg-amber-900/30', cancelled: 'bg-red-100 dark:bg-red-900/30', completed: 'bg-blue-100 dark:bg-blue-900/30', waiting_opponent: 'bg-orange-100 dark:bg-orange-900/30' };
                            return (
                                <TouchableOpacity
                                    key={b._id || b.id}
                                    onPress={() => setSelectedBooking(b)}
                                    activeOpacity={0.7}
                                    className="rounded-2xl bg-appSurface p-4 border border-appText/10 shadow-sm shadow-black/5"
                                >
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-sm font-bold text-appText" numberOfLines={1}>{b.court_name || b.courtName || 'Sân'}</Text>
                                        <View className={`px-2.5 py-0.5 rounded-full ${bgColor[b.displayStatus] || 'bg-slate-100'}`}>
                                            <Text className={`text-[10px] font-bold ${statusColor[b.displayStatus] || 'text-appText'}`}>{statusMap[b.displayStatus] || b.displayStatus}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center gap-1.5 mb-1">
                                        <Ionicons name="football-outline" size={14} color="#059669" />
                                        <Text className="text-xs text-appText/60">{b.sub_court_name || b.subCourtName || ''}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1.5 mb-1">
                                        <Ionicons name="calendar-outline" size={14} color="#059669" />
                                        <Text className="text-xs text-appText/60">{b.date ? new Date(b.date).toLocaleDateString('vi-VN') : ''}</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-1.5">
                                            <Ionicons name="time-outline" size={14} color="#059669" />
                                            <Text className="text-xs text-appText/60">{b.start_time || b.startTime} - {b.end_time || b.endTime}</Text>
                                        </View>
                                        <View className="items-end">
                                            {(() => {
                                                // Match booking: lấy số tiền user này thực sự đã trả
                                                const myParticipant = b.participants?.find(
                                                    p => p.userId === user?.id || p.userId === user?._id ||
                                                         p.userId?.toString() === (user?.id || user?._id)?.toString()
                                                );
                                                const chargedAmount = myParticipant
                                                    ? myParticipant.amount
                                                    : Math.max(0, (b.total_price || b.totalPrice || 0) - (b.voucher_discount || 0));

                                                return (
                                                    <Text className="text-sm font-bold text-emerald-600">{formatPrice(chargedAmount)}</Text>
                                                );
                                            })()}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Quick Actions */}
                <View className="mt-6 flex-row gap-4">
                    <TouchableOpacity
                        onPress={() => showModal({ type: "info", title: "Hỗ trợ", message: "Liên hệ tổng đài 1900 xxxx" })}
                        className="flex-1 items-center justify-center rounded-2xl bg-appSurface py-5 border border-appText/10 shadow-sm shadow-black/5"
                    >
                        <Ionicons name="headset-outline" size={24} color="#059669" />
                        <Text className="mt-2 text-sm font-medium text-appText">Hỗ trợ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Ví tiền")}
                        className="flex-1 items-center justify-center rounded-2xl bg-appSurface py-5 border border-appText/10 shadow-sm shadow-black/5"
                    >
                        <Ionicons name="wallet-outline" size={24} color="#059669" />
                        <Text className="mt-2 text-sm font-medium text-appText">Ví tiền</Text>
                    </TouchableOpacity>
                </View>

                {/* Nút Đăng Xuất */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="mt-8 flex-row items-center justify-center rounded-2xl bg-red-100 py-4 dark:bg-red-900/20"
                >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text className="text-base font-bold text-red-500">Đăng xuất tài khoản</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Booking Detail Modal */}
            <Modal visible={!!selectedBooking} transparent animationType="slide" onRequestClose={() => setSelectedBooking(null)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-appBg rounded-t-3xl pt-5 pb-8 px-5">
                        {selectedBooking && (() => {
                            const b = selectedBooking;
                            const statusMap = { confirmed: 'Đã xác nhận', pending: 'Chờ xử lý', cancelled: 'Đã hủy', completed: 'Hoàn thành', waiting_opponent: 'Chờ đối thủ' };
                            const statusColor = { confirmed: 'text-emerald-600', pending: 'text-amber-600', cancelled: 'text-red-500', completed: 'text-blue-600', waiting_opponent: 'text-orange-600' };
                            const bgColor = { confirmed: 'bg-emerald-100 dark:bg-emerald-900/30', pending: 'bg-amber-100 dark:bg-amber-900/30', cancelled: 'bg-red-100 dark:bg-red-900/30', completed: 'bg-blue-100 dark:bg-blue-900/30', waiting_opponent: 'bg-orange-100 dark:bg-orange-900/30' };
                            const canCancel = b.displayStatus === "confirmed" || b.displayStatus === "pending" || b.displayStatus === "waiting_opponent";
                            const opponent = b.match_id?.participants?.find(p => p._id !== user.id && p._id !== user._id);

                            return (
                                <>
                                    <View className="flex-row items-center justify-between mb-5">
                                        <Text className="text-lg font-bold text-appText">Chi tiết đơn đặt</Text>
                                        <TouchableOpacity onPress={() => setSelectedBooking(null)} className="h-8 w-8 items-center justify-center rounded-full bg-appSurface">
                                            <Ionicons name="close" size={20} color={isDark ? "#fff" : "#000"} />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="rounded-2xl bg-appSurface p-4 border border-appText/10 shadow-sm shadow-black/5 mb-5">
                                        <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-appText/5">
                                            <Text className="text-base font-bold text-appText">{b.court_name || b.courtName}</Text>
                                            <View className={`px-3 py-1 rounded-full ${bgColor[b.displayStatus] || 'bg-slate-100'}`}>
                                                <Text className={`text-xs font-bold ${statusColor[b.displayStatus] || 'text-appText'}`}>{statusMap[b.displayStatus] || b.displayStatus}</Text>
                                            </View>
                                        </View>

                                        <View className="gap-3">
                                            <View className="flex-row justify-between">
                                                <Text className="text-sm text-appText/60">Loại sân</Text>
                                                <Text className="text-sm font-semibold text-appText">{b.sub_court_name || b.subCourtName}</Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <Text className="text-sm text-appText/60">Ngày đặt</Text>
                                                <Text className="text-sm font-semibold text-appText">{b.date ? new Date(b.date).toLocaleDateString('vi-VN') : ''}</Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <Text className="text-sm text-appText/60">Giờ đặt</Text>
                                                <Text className="text-sm font-semibold text-appText">{b.start_time || b.startTime} - {b.end_time || b.endTime}</Text>
                                            </View>
                                            {opponent ? (
                                                <View className="flex-row justify-between">
                                                    <Text className="text-sm text-amber-600">Đối thủ</Text>
                                                    <Text className="text-sm font-semibold text-amber-600">{opponent.name || opponent.userName}</Text>
                                                </View>
                                            ) : null}
                                            {b.voucher_code ? (
                                                <View className="flex-row justify-between">
                                                    <Text className="text-sm text-emerald-600">Voucher</Text>
                                                    <Text className="text-sm font-semibold text-emerald-600">{b.voucher_code}</Text>
                                                </View>
                                            ) : null}
                                            {b.voucher_discount > 0 ? (
                                                <View className="flex-row justify-between">
                                                    <Text className="text-sm text-emerald-600">Giảm giá</Text>
                                                    <Text className="text-sm font-semibold text-emerald-600">-{formatPrice(b.voucher_discount)}</Text>
                                                </View>
                                            ) : null}
                                            <View className="h-px bg-appText/5 my-1" />
                                            {b.voucher_discount > 0 ? (
                                                <>
                                                    <View className="flex-row justify-between">
                                                        <Text className="text-sm text-appText/60">Giá gốc</Text>
                                                        <Text className="text-sm font-semibold text-appText/40 line-through">{formatPrice(b.total_price || b.totalPrice)}</Text>
                                                    </View>
                                                    <View className="flex-row justify-between">
                                                        <Text className="text-sm font-bold text-appText">Bạn đã trả</Text>
                                                        <Text className="text-base font-bold text-emerald-600">{formatPrice((b.total_price || b.totalPrice) - b.voucher_discount)}</Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <View className="flex-row justify-between">
                                                    <Text className="text-sm font-bold text-appText">Tổng tiền</Text>
                                                    <Text className="text-base font-bold text-emerald-600">{formatPrice(b.total_price || b.totalPrice)}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {canCancel ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                const bookingToCancel = selectedBooking;
                                                setSelectedBooking(null);
                                                handleCancelBooking(bookingToCancel);
                                            }}
                                            className="w-full rounded-xl bg-red-100 dark:bg-red-900/30 py-3.5 border border-red-200 dark:border-red-800 mb-3"
                                        >
                                            <Text className="text-sm font-bold text-center text-red-600 dark:text-red-400">Hủy đặt sân</Text>
                                        </TouchableOpacity>
                                    ) : null}

                                    <TouchableOpacity
                                        onPress={() => setSelectedBooking(null)}
                                        className="w-full rounded-xl bg-emerald-600 py-3.5 shadow-md shadow-emerald-900/20"
                                    >
                                        <Text className="text-sm font-bold text-center text-white">Đóng</Text>
                                    </TouchableOpacity>
                                </>
                            );
                        })()}
                    </View>
                </View>
            </Modal>

            {/* Feedback Modal */}
            <Modal visible={feedbackModalVisible} transparent animationType="fade" onRequestClose={() => setFeedbackModalVisible(false)}>
                <View className="flex-1 justify-center bg-black/60 px-5">
                    <View className="bg-white dark:bg-appBg rounded-3xl p-6 shadow-xl">
                        <Text className="text-xl font-bold text-appText text-center mb-1">Đánh giá trận đấu</Text>
                        <Text className="text-sm text-appText/60 text-center mb-6">Đánh giá trung thực giúp xây dựng cộng đồng văn minh.</Text>

                        <View className="gap-5">
                            <View>
                                <Text className="text-base font-bold text-appText mb-3">1. Đối thủ đến đúng giờ không?</Text>
                                <View className="flex-row gap-3">
                                    <TouchableOpacity onPress={() => setPunctual(true)} className={`flex-1 py-3 rounded-xl border ${punctual ? 'bg-emerald-50 border-emerald-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center font-bold ${punctual ? 'text-emerald-700' : 'text-appText'}`}>Có</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setPunctual(false)} className={`flex-1 py-3 rounded-xl border ${!punctual ? 'bg-red-50 border-red-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center font-bold ${!punctual ? 'text-red-600' : 'text-appText'}`}>Không</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className="text-base font-bold text-appText mb-3">2. Thái độ chơi?</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity onPress={() => setAttitude('friendly')} className={`flex-1 py-3 rounded-xl border ${attitude === 'friendly' ? 'bg-emerald-50 border-emerald-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center text-xs font-bold ${attitude === 'friendly' ? 'text-emerald-700' : 'text-appText'}`}>Vui vẻ</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setAttitude('neutral')} className={`flex-1 py-3 rounded-xl border ${attitude === 'neutral' ? 'bg-amber-50 border-amber-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center text-xs font-bold ${attitude === 'neutral' ? 'text-amber-700' : 'text-appText'}`}>Bình thường</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setAttitude('bad')} className={`flex-1 py-3 rounded-xl border ${attitude === 'bad' ? 'bg-red-50 border-red-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center text-xs font-bold ${attitude === 'bad' ? 'text-red-600' : 'text-appText'}`}>Tệ</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className="text-base font-bold text-appText mb-3">3. Trình độ như App ghi không?</Text>
                                <View className="flex-row gap-3">
                                    <TouchableOpacity onPress={() => setSkillAsDescribed(true)} className={`flex-1 py-3 rounded-xl border ${skillAsDescribed ? 'bg-emerald-50 border-emerald-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center font-bold ${skillAsDescribed ? 'text-emerald-700' : 'text-appText'}`}>Đúng</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setSkillAsDescribed(false)} className={`flex-1 py-3 rounded-xl border ${!skillAsDescribed ? 'bg-red-50 border-red-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center font-bold ${!skillAsDescribed ? 'text-red-600' : 'text-appText'}`}>Sai lệch</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className="text-base font-bold text-appText mb-3">4. Có muốn chơi lại không?</Text>
                                <View className="flex-row gap-3">
                                    <TouchableOpacity onPress={() => setPlayAgain(true)} className={`flex-1 py-3 rounded-xl border ${playAgain ? 'bg-emerald-50 border-emerald-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center font-bold ${playAgain ? 'text-emerald-700' : 'text-appText'}`}>Có</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setPlayAgain(false)} className={`flex-1 py-3 rounded-xl border ${!playAgain ? 'bg-red-50 border-red-500' : 'bg-appSurface border-appText/10'}`}>
                                        <Text className={`text-center font-bold ${!playAgain ? 'text-red-600' : 'text-appText'}`}>Không</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row gap-3 mt-8">
                            <TouchableOpacity
                                onPress={() => setFeedbackModalVisible(false)}
                                className="flex-1 py-3.5 rounded-xl border border-appText/20"
                            >
                                <Text className="text-center font-bold text-appText/70">Bỏ qua</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSubmitFeedback}
                                disabled={isSubmittingFeedback}
                                className="flex-1 py-3.5 rounded-xl bg-amber-500 shadow-md shadow-amber-900/20"
                            >
                                {isSubmittingFeedback ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-bold text-white">Gửi & Nhận XP</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <ModalComponent />
        </>
    );
}
