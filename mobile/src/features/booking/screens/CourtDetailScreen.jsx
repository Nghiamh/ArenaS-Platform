import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Modal, FlatList, TextInput } from "react-native";
import { useAppModal } from "../../../components/AppModal";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourtById } from "../../../store/slices/venueSlice";
import { setCheckoutDraft } from "../../../store/slices/bookingSlice";
import { logout } from "../../../store/slices/authSlice";
import bookingApi from "../../../api/bookingApi";
import reviewApi from "../../../api/reviewApi";
import { getSportNameVI, getCourtSport, formatPrice } from "../../../utils/courtHelpers";
import { removeItem } from "../../../utils/storage";
import { STORAGE_KEYS } from "../../../constants/config";
import LoginRequiredScreen from "../../../components/LoginRequiredScreen";

const { width } = Dimensions.get("window");


// Mapping amenity → icon
const AMENITY_ICONS = {
    "bãi đỗ xe": { icon: "car", label: "Gửi xe" },
    "wifi": { icon: "wifi", label: "Wifi" },
    "nhà tắm": { icon: "shower", label: "Phòng tắm" },
    "phòng tắm": { icon: "shower", label: "Phòng tắm" },
    "phòng thay đồ": { icon: "hanger", label: "Thay đồ" },
    "tủ đồ": { icon: "locker", label: "Tủ đồ" },
    "căng tin": { icon: "food", label: "Căng tin" },
    "trà đá miễn phí": { icon: "cup-water", label: "Nước uống" },
    "nước uống": { icon: "cup-water", label: "Nước uống" },
};


function getAmenityIcon(amenity) {
    const key = amenity.toLowerCase();
    return AMENITY_ICONS[key] || { icon: "check-circle-outline", label: amenity };
}

function formatLocalYYYYMMDD(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function CourtDetailScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const iconColor = isDark ? "#FFFFFF" : "#000000";
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const [activeIndex, setActiveIndex] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);

    const [selectedDate, setSelectedDate] = useState(formatLocalYYYYMMDD(new Date()));
    const [slotsData, setSlotsData] = useState([]);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [isLocking, setIsLocking] = useState(false);

    const [selectedSubCourt, setSelectedSubCourt] = useState(null);
    const [selectedSlotIndices, setSelectedSlotIndices] = useState([]);
    const slotScrollRefs = useRef({});

    const courtId = route.params?.courtId;
    const matchId = route.params?.matchId || null;
    const { selectedVenue: court, status, error } = useSelector((state) => state.venue);
    const isLoading = status === "loading";
    const { user, isGuest } = useSelector(state => state.auth);

    // ── Guest guard (xem sân OK, nhưng không đặt được) — check sớm nếu muốn chặn toàn bộ không cho xâm nhập ở dưới

    // Review states
    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null);
    const [canReview, setCanReview] = useState(false);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Fetch reviews
    useEffect(() => {
        if (!courtId) return;
        const fetchReviews = async () => {
            try {
                setIsLoadingReviews(true);
                const [reviewsRes, canReviewRes, myReviewRes] = await Promise.all([
                    reviewApi.getCourtReviews(courtId).catch(() => ({ data: { reviews: [] } })),
                    user ? reviewApi.checkCanReview(courtId).catch(() => ({ data: { canReview: false } })) : Promise.resolve({ data: { canReview: false } }),
                    user ? reviewApi.getMyReview(courtId).catch(() => ({ data: { review: null } })) : Promise.resolve({ data: { review: null } }),
                ]);
                setReviews(reviewsRes.data?.reviews || []);
                setCanReview(canReviewRes.data?.canReview || false);
                if (myReviewRes.data?.review) {
                    setMyReview(myReviewRes.data.review);
                    setReviewForm({ rating: myReviewRes.data.review.rating, comment: myReviewRes.data.review.comment || "" });
                }
            } catch (err) {
                console.log("Error fetching reviews", err);
            } finally {
                setIsLoadingReviews(false);
            }
        };
        fetchReviews();
    }, [courtId, user]);

    // Handle submit review
    const handleSubmitReview = async () => {
        if (reviewForm.rating < 1 || reviewForm.rating > 5) {
            return showModal({ type: "warning", title: "Lỗi", message: "Vui lòng chọn số sao từ 1 đến 5" });
        }
        try {
            setIsSubmittingReview(true);
            if (myReview) {
                // Update
                const res = await reviewApi.updateReview(myReview._id, reviewForm);
                setMyReview(res.data.review);
                showModal({ type: "success", title: "Thành công", message: "Đã cập nhật đánh giá!" });
            } else {
                // Create
                const res = await reviewApi.createReview({ court_id: courtId, ...reviewForm });
                setMyReview(res.data.review);
                setCanReview(false); // only 1 review allowed
                showModal({ type: "success", title: "Thành công", message: "Cảm ơn bạn đã đánh giá sân!" });
            }
            // Refresh list
            const reviewsRes = await reviewApi.getCourtReviews(courtId);
            setReviews(reviewsRes.data?.reviews || []);
            setShowReviewModal(false);
        } catch (err) {
            showModal({ type: "error", title: "Lỗi", message: err.response?.data?.error || "Có lỗi xảy ra khi gửi đánh giá" });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Helper: Tạo slots client-side dựa trên giờ mở/đóng cửa (giống BE)
    const generateClientSlots = (openTime = "06:00", closeTime = "22:00") => {
        const slots = [];
        const [startH, startM] = openTime.split(":").map(Number);
        const [endH, endM] = closeTime.split(":").map(Number);
        let current = startH * 60 + startM;
        const end = endH * 60 + endM;
        while (current + 30 <= end) {
            const h1 = String(Math.floor(current / 60)).padStart(2, "0");
            const m1 = String(current % 60).padStart(2, "0");
            const next = current + 30;
            const h2 = String(Math.floor(next / 60)).padStart(2, "0");
            const m2 = String(next % 60).padStart(2, "0");
            slots.push({ start: `${h1}:${m1}`, end: `${h2}:${m2}`, status: "available" });
            current = next;
        }
        return slots;
    };

    // Lấy mảng slots hiển thị cho 1 sub_court (ưu tiên BE data, fallback client-side)
    const getSlotsForSubCourt = (subCourtId) => {
        const doc = slotsData.find(s => s.sub_court_id === subCourtId);
        if (doc && doc.slots && doc.slots.length > 0) return doc.slots;
        // BE chưa generate → hiển thị tất cả "available" dựa trên giờ mở cửa
        if (court) return generateClientSlots(court.open_time, court.close_time);
        return [];
    };

    // Fetch court detail khi có courtId
    useEffect(() => {
        if (courtId) {
            dispatch(fetchCourtById(courtId));
        }
    }, [courtId, dispatch]);

    // Fetch slots khi đổi ngày; reset selection
    useEffect(() => {
        setSelectedSubCourt(null);
        setSelectedSlotIndices([]);
        if (courtId && selectedDate) {
            setIsFetchingSlots(true);
            bookingApi.getCourtSlots(courtId, selectedDate)
                .then(res => setSlotsData(res.data || []))
                .catch(err => console.log("Lỗi lấy slots:", err))
                .finally(() => setIsFetchingSlots(false));
        }
    }, [courtId, selectedDate]);

    const handleSlotClick = (subCourtId, index, slot) => {
        if (slot.status !== "available") return;

        if (selectedSubCourt !== subCourtId) {
            setSelectedSubCourt(subCourtId);
            setSelectedSlotIndices([index]);
        } else {
            if (selectedSlotIndices.includes(index)) {
                setSelectedSlotIndices(prev => prev.filter(i => i !== index));
            } else {
                setSelectedSlotIndices(prev => [...prev, index].sort((a, b) => a - b));
            }
        }
    };

    const handleBookNow = async () => {
        if (!selectedSubCourt || selectedSlotIndices.length === 0) {
            showModal({ type: "warning", title: "Chưa chọn giờ", message: "Vui lòng chọn ít nhất 1 khung giờ." });
            return;
        }

        // Check if contiguous
        for (let i = 0; i < selectedSlotIndices.length - 1; i++) {
            if (selectedSlotIndices[i + 1] - selectedSlotIndices[i] !== 1) {
                showModal({ type: "warning", title: "Lỗi chọn giờ", message: "Vui lòng chọn các khung giờ liền kề nhau." });
                return;
            }
        }

        const sub = subCourts.find(s => s._id === selectedSubCourt);
        const slots = getSlotsForSubCourt(selectedSubCourt);
        const selectedSlots = selectedSlotIndices.map(i => slots[i]);

        const startTime = selectedSlots[0].start;
        const endTime = selectedSlots[selectedSlots.length - 1].end;

        // Time validation for today's slots
        const now = new Date();
        const selectedD = new Date(selectedDate + 'T00:00:00');

        // Check if selected date is today
        if (now.getFullYear() === selectedD.getFullYear() &&
            now.getMonth() === selectedD.getMonth() &&
            now.getDate() === selectedD.getDate()) {

            const [startHour, startMinute] = startTime.split(':').map(Number);
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            if (startHour < currentHour || (startHour === currentHour && startMinute <= currentMinute)) {
                showModal({ type: "warning", title: "Giờ đã qua", message: "Khung giờ này đã trôi qua. Vui lòng chọn khung giờ khác!" });
                return;
            }
        }

        // BE (userBookCourt) dùng court.price_per_hour làm nguồn giá duy nhất
        // → FE phải dùng đúng court.price_per_hour để totalPrice khớp với DB
        const pricePerHour = court.price_per_hour || 0;
        const price = (pricePerHour / 2) * selectedSlotIndices.length;

        // ── Bước 1: Lock slots trước khi chuyển sang thanh toán ──
        try {
            setIsLocking(true);
            await bookingApi.lockSlots({
                court_id: court._id || court.id,
                sub_court_id: sub._id,
                date: selectedDate,
                start_time: startTime,
                end_time: endTime,
            });
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || "Không thể giữ chỗ. Khung giờ có thể đã được đặt.";
            showModal({ type: "error", title: "Không thể giữ chỗ", message: msg });
            // Refresh lại slots
            bookingApi.getCourtSlots(courtId, selectedDate)
                .then(res => setSlotsData(res.data || []))
                .catch(() => { });
            setSelectedSlotIndices([]);
            setIsLocking(false);
            return;
        } finally {
            setIsLocking(false);
        }

        // ── Bước 2: Lưu thông tin vào Redux và chuyển sang Thanh toán ──
        dispatch(setCheckoutDraft({
            courtId: court._id || court.id,
            courtName: court.name,
            subCourtId: sub._id,
            subCourtName: sub.name,
            date: selectedDate,
            startTime,
            endTime,
            totalPrice: price,
            matchId: matchId || undefined,
        }));

        navigation.navigate("Thanh toán");
    };

    const onScroll = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        setActiveIndex(Math.round(index));
    };

    // Loading state
    if (isLoading || (!court && courtId)) {
        return (
            <View className="flex-1 bg-appBg items-center justify-center">
                <ActivityIndicator size="large" color="#059669" />
                <Text className="mt-3 text-sm text-appText/60">Đang tải thông tin sân...</Text>
            </View>
        );
    }

    // Error state
    if (error && !court) {
        return (
            <View className="flex-1 bg-appBg items-center justify-center px-6">
                <Ionicons name="cloud-offline-outline" size={48} color={isDark ? "#475569" : "#94A3B8"} />
                <Text className="mt-3 text-sm text-appText/60 text-center">{error}</Text>
                <TouchableOpacity
                    onPress={() => courtId && dispatch(fetchCourtById(courtId))}
                    className="mt-4 rounded-full bg-emerald-700 px-6 py-2"
                >
                    <Text className="text-sm font-bold text-white">Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No courtId passed (e.g. tapped bottom tab directly)
    if (!court) {
        return (
            <View className="flex-1 bg-appBg items-center justify-center px-6">
                <Ionicons name="tennisball-outline" size={48} color={isDark ? "#475569" : "#94A3B8"} />
                <Text className="mt-3 text-sm text-appText/60 text-center">
                    Chọn một sân từ trang chủ để xem chi tiết.
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate("BottomTabs", { screen: "Trang chủ" })}
                    className="mt-4 rounded-full bg-emerald-700 px-6 py-2"
                >
                    <Text className="text-sm font-bold text-white">Về trang chủ</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Data from API
    const courtImages = court.images && court.images.length > 0 ? court.images : [PLACEHOLDER_IMAGE];
    const sportLabel = (court.sports || []).map(getSportNameVI).join(", ") || "Thể thao";
    const amenities = court.amenities || [];
    const subCourts = court.sub_courts && court.sub_courts.length > 0
        ? court.sub_courts
        : [{ _id: '1', name: 'Sân 1', price_per_hour: court.price_per_hour || 190000, type: getCourtSport(court) }, { _id: '2', name: 'Sân 2', price_per_hour: court.price_per_hour || 190000, type: getCourtSport(court) }]; // Fallback data
    const minPrice = subCourts.length > 0
        ? Math.min(...subCourts.map((s) => s.price_per_hour || Infinity))
        : court.price_per_hour || 190000;

    const handleDirections = () => {
        navigation.navigate("BottomTabs", {
            screen: "Bản đồ",
            params: {
                latitude: court.coordinates?.latitude,
                longitude: court.coordinates?.longitude,
                venueName: court.name
            }
        });
    };

    return (
        <View className="flex-1 bg-appBg">
            <ScrollView className="flex-1" contentContainerClassName="pb-32" showsVerticalScrollIndicator={false}>
                {/* Header Image Gallery */}
                <View className="relative h-64 w-full bg-slate-200 dark:bg-slate-900">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                        className="h-full w-full"
                    >
                        {courtImages.map((uri, index) => (
                            <Image
                                key={index}
                                source={{ uri }}
                                style={{ width, height: 256 }}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View pointerEvents="none" className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5 z-10">
                        {courtImages.map((_, index) => (
                            <View
                                key={index}
                                className={`h-1.5 rounded-full ${activeIndex === index ? 'w-5 bg-emerald-500 dark:bg-white' : 'w-1.5 bg-white/70 dark:bg-white/50'}`}
                            />
                        ))}
                    </View>

                    {/* Top Bar Actions */}
                    <View pointerEvents="box-none" className="absolute left-4 right-4 top-12 flex-row justify-between z-10">
                        <TouchableOpacity
                            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("BottomTabs", { screen: "Trang chủ" })}
                            className="h-10 w-10 items-center justify-center rounded-full bg-white/70 dark:bg-black/40"
                        >
                            <Ionicons name="arrow-back" size={20} color={isDark ? "white" : "black"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => showModal({ type: "success", title: "Yêu thích", message: "Đã thêm vào danh sách yêu thích!" })}
                            className="h-10 w-10 items-center justify-center rounded-full bg-white/70 dark:bg-black/40"
                        >
                            <Ionicons name="heart-outline" size={20} color={isDark ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Title & Directions */}
                <View className="px-4 pt-4">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-4">
                            <Text className="text-xl font-bold text-appText">{court.name}</Text>
                            {court.avg_rating > 0 && (
                                <View className="mt-1 flex-row items-center gap-1">
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text className="text-sm font-bold text-appText">{court.avg_rating}</Text>
                                    <Text className="text-xs text-appText/50">
                                        ({reviews.length > 0 ? `${reviews.length} đánh giá` : 'Chưa có đánh giá'})
                                    </Text>
                                </View>
                            )}
                            <View className="mt-1.5 flex-row items-start gap-1">
                                <Ionicons name="location-outline" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                <Text className="flex-1 text-xs text-appText/70 leading-tight">
                                    {court.location || court.address || "Chưa cập nhật địa chỉ"}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={handleDirections}
                            className="flex-row items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2"
                        >
                            <Ionicons name="navigate" size={16} color="white" />
                            <Text className="text-xs font-bold text-white">Chỉ đường</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tiện ích (Amenities) */}
                <View className="mt-5 px-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                        {amenities.length > 0 ? amenities.map((amenity) => {
                            const { icon, label } = getAmenityIcon(amenity);
                            return (
                                <View key={amenity} className="flex-row items-center gap-2 rounded-xl border border-appText/10 bg-appSurface px-3 py-2">
                                    <MaterialCommunityIcons name={icon} size={16} color="#059669" />
                                    <Text className="text-xs font-medium text-appText">{label}</Text>
                                </View>
                            );
                        }) : (
                            // Fake amenities if empty to match design
                            <>
                                <View className="flex-row items-center gap-2 rounded-xl border border-appText/10 bg-appSurface px-3 py-2">
                                    <MaterialCommunityIcons name="car" size={16} color="#059669" />
                                    <Text className="text-xs font-medium text-appText">Gửi xe</Text>
                                </View>
                                <View className="flex-row items-center gap-2 rounded-xl border border-appText/10 bg-appSurface px-3 py-2">
                                    <MaterialCommunityIcons name="food" size={16} color="#059669" />
                                    <Text className="text-xs font-medium text-appText">Căng tin</Text>
                                </View>
                                <View className="flex-row items-center gap-2 rounded-xl border border-appText/10 bg-appSurface px-3 py-2">
                                    <MaterialCommunityIcons name="locker" size={16} color="#059669" />
                                    <Text className="text-xs font-medium text-appText">Tủ đồ</Text>
                                </View>
                                <View className="flex-row items-center gap-2 rounded-xl border border-appText/10 bg-appSurface px-3 py-2">
                                    <MaterialCommunityIcons name="cup-water" size={16} color="#059669" />
                                    <Text className="text-xs font-medium text-appText">Trà đá</Text>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>

                {/* Date Selector */}
                <View className="mt-6 flex-row items-center justify-between px-4">
                    <TouchableOpacity
                        onPress={() => {
                            const d = new Date(selectedDate + 'T00:00:00');
                            d.setDate(d.getDate() - 1);
                            const todayStr = formatLocalYYYYMMDD(new Date());
                            const newDateStr = formatLocalYYYYMMDD(d);
                            if (newDateStr >= todayStr) setSelectedDate(newDateStr);
                        }}
                        className="h-8 w-8 items-center justify-center rounded-lg border border-appText/10 bg-appSurface">
                        <Ionicons name="chevron-back" size={16} color={iconColor} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowCalendar(true)} className="flex-row items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                        <Ionicons name="calendar-outline" size={16} color="#059669" />
                        <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{new Date(selectedDate + 'T00:00:00').toLocaleDateString("vi-VN", { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            const d = new Date(selectedDate + 'T00:00:00');
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(formatLocalYYYYMMDD(d));
                        }}
                        className="h-8 w-8 items-center justify-center rounded-lg border border-appText/10 bg-appSurface">
                        <Ionicons name="chevron-forward" size={16} color={iconColor} />
                    </TouchableOpacity>
                </View>

                {/* Calendar Modal */}
                <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowCalendar(false)} className="flex-1 bg-black/50 justify-center items-center px-6">
                        <TouchableOpacity activeOpacity={1} className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full">
                            {(() => {
                                const current = new Date(selectedDate + 'T00:00:00');
                                const year = current.getFullYear();
                                const month = current.getMonth();
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const firstDay = new Date(year, month, 1).getDay();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                const days = [];
                                for (let i = 0; i < firstDay; i++) days.push(null);
                                for (let i = 1; i <= daysInMonth; i++) days.push(i);
                                const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
                                return (
                                    <>
                                        <View className="flex-row items-center justify-between mb-4">
                                            <TouchableOpacity onPress={() => {
                                                const prev = new Date(year, month - 1, 1);
                                                setSelectedDate(formatLocalYYYYMMDD(prev));
                                            }}>
                                                <Ionicons name="chevron-back" size={22} color={isDark ? '#fff' : '#333'} />
                                            </TouchableOpacity>
                                            <Text className="text-base font-bold text-appText">{monthNames[month]} {year}</Text>
                                            <TouchableOpacity onPress={() => {
                                                const next = new Date(year, month + 1, 1);
                                                setSelectedDate(formatLocalYYYYMMDD(next));
                                            }}>
                                                <Ionicons name="chevron-forward" size={22} color={isDark ? '#fff' : '#333'} />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                                                <Text key={d} className="w-[14%] text-center text-xs font-bold text-appText/50">{d}</Text>
                                            ))}
                                        </View>
                                        <View className="flex-row flex-wrap">
                                            {days.map((day, idx) => {
                                                if (day === null) return <View key={`e${idx}`} style={{ width: '14.28%', height: 40 }} />;
                                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const dateObj = new Date(dateStr + 'T00:00:00');
                                                const isPast = dateObj < today;
                                                const isSelected = dateStr === selectedDate;
                                                const isToday = dateStr === today.toISOString().split('T')[0];
                                                return (
                                                    <TouchableOpacity
                                                        key={day}
                                                        disabled={isPast}
                                                        onPress={() => { setSelectedDate(dateStr); setShowCalendar(false); }}
                                                        style={{ width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <View className={`h-8 w-8 rounded-full items-center justify-center ${isSelected ? 'bg-emerald-600' : isToday ? 'border border-emerald-500' : ''}`}>
                                                            <Text className={`text-sm font-semibold ${isPast ? 'text-appText/20' : isSelected ? 'text-white' : 'text-appText'}`}>{day}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </>
                                );
                            })()}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Danh sách sân con & Lịch (Time Slots) */}
                <View className="mt-4 px-4 gap-3">
                    {isFetchingSlots ? (
                        <ActivityIndicator size="small" color="#059669" />
                    ) : (
                        subCourts.map((sub, idx) => {
                            const slots = getSlotsForSubCourt(sub._id);

                            return (
                                <View key={sub._id || idx} className="rounded-xl border border-appText/10 bg-appSurface p-3 flex-row items-center shadow-sm shadow-black/5">
                                    <Text className="w-14 text-sm font-bold text-appText">{sub.name}</Text>

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerClassName="gap-2"
                                        ref={(ref) => { if (ref) slotScrollRefs.current[sub._id] = ref; }}
                                        onLayout={() => {
                                            // Auto-scroll to first available slot
                                            const now = new Date();
                                            const selectedD = new Date(selectedDate + 'T00:00:00');
                                            const isToday = now.getFullYear() === selectedD.getFullYear() &&
                                                now.getMonth() === selectedD.getMonth() &&
                                                now.getDate() === selectedD.getDate();
                                            if (isToday && slots.length > 0) {
                                                const firstAvailIdx = slots.findIndex((s) => {
                                                    const [h, m] = s.start.split(':').map(Number);
                                                    const notPassed = h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
                                                    return notPassed && s.status === 'available';
                                                });
                                                if (firstAvailIdx > 0) {
                                                    const SLOT_WIDTH = 72; // min-w-[64px] + gap-2 (8px)
                                                    const offset = Math.max(0, (firstAvailIdx - 1) * SLOT_WIDTH);
                                                    setTimeout(() => {
                                                        slotScrollRefs.current[sub._id]?.scrollTo({ x: offset, animated: false });
                                                    }, 50);
                                                }
                                            }
                                        }}
                                    >
                                        {slots.length === 0 ? (
                                            <Text className="text-xs text-appText/50 italic">Không có lịch</Text>
                                        ) : (
                                            slots.map((slot, sIdx) => {
                                                const now = new Date();
                                                const selectedD = new Date(selectedDate + 'T00:00:00');
                                                const isToday = now.getFullYear() === selectedD.getFullYear() &&
                                                    now.getMonth() === selectedD.getMonth() &&
                                                    now.getDate() === selectedD.getDate();

                                                let isPassed = false;
                                                if (isToday) {
                                                    const [startH, startM] = slot.start.split(':').map(Number);
                                                    if (startH < now.getHours() || (startH === now.getHours() && startM <= now.getMinutes())) {
                                                        isPassed = true;
                                                    }
                                                }

                                                const isAvailable = !isPassed && slot.status === "available";
                                                const isLocked = !isPassed && slot.status === "locked";
                                                const isBooked = !isPassed && slot.status === "booked";
                                                const isSelected = selectedSubCourt === sub._id && selectedSlotIndices.includes(sIdx);

                                                let bgColor = "bg-red-100 dark:bg-red-900/30";
                                                let textColor = "text-red-500 dark:text-red-400";
                                                let subTextColor = "text-red-400 dark:text-red-500";
                                                let label = "Đã đặt";

                                                if (isPassed) {
                                                    bgColor = "bg-slate-200 dark:bg-slate-800";
                                                    textColor = "text-slate-400 dark:text-slate-600";
                                                    subTextColor = "text-slate-400 dark:text-slate-600";
                                                    label = "Đã qua";
                                                } else if (isLocked) {
                                                    bgColor = "bg-amber-100 dark:bg-amber-900/30";
                                                    textColor = "text-amber-600 dark:text-amber-400";
                                                    subTextColor = "text-amber-500 dark:text-amber-500";
                                                    label = "Đang giữ";
                                                } else if (isAvailable) {
                                                    bgColor = isSelected ? "bg-emerald-700" : "bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800";
                                                    textColor = isSelected ? "text-white" : "text-emerald-700 dark:text-emerald-400";
                                                    subTextColor = isSelected ? "text-emerald-100" : "text-emerald-600/70 dark:text-emerald-500/70";
                                                    label = "Trống";
                                                }

                                                return (
                                                    <TouchableOpacity
                                                        key={sIdx}
                                                        onPress={() => isPassed ? null : handleSlotClick(sub._id, sIdx, slot)}
                                                        activeOpacity={isAvailable ? 0.7 : 1}
                                                        className={`items-center justify-center rounded-lg px-3 py-1.5 min-w-[64px] ${bgColor}`}
                                                    >
                                                        <Text className={`text-xs font-bold ${textColor}`}>{slot.start}</Text>
                                                        <Text className={`text-[9px] ${subTextColor}`}>{label}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </ScrollView>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Reviews Section */}
                <View className="mt-8 px-4 pb-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-bold text-appText">Đánh giá sân ({reviews.length})</Text>
                        {(canReview || myReview) && (
                            <TouchableOpacity onPress={() => setShowReviewModal(true)} className="flex-row items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <Ionicons name="pencil" size={14} color="#059669" />
                                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                    {myReview ? "Sửa đánh giá" : "Viết đánh giá"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoadingReviews ? (
                        <ActivityIndicator size="small" color="#059669" className="py-4" />
                    ) : reviews.length === 0 ? (
                        <View className="bg-appSurface border border-appText/5 rounded-2xl p-6 items-center shadow-sm shadow-black/5">
                            <Ionicons name="chatbubbles-outline" size={40} color={isDark ? "#475569" : "#94A3B8"} />
                            <Text className="mt-3 text-sm text-appText/50 text-center">Chưa có đánh giá nào. {canReview && 'Hãy là người đầu tiên đánh giá sân này!'}</Text>
                        </View>
                    ) : (
                        <View className="gap-4">
                            {reviews.map((r, i) => (
                                <View key={r._id || i} className="bg-appSurface border border-appText/5 rounded-2xl p-4 shadow-sm shadow-black/5">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className="flex-row items-center gap-2">
                                            <View className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                                                {r.user_avatar ? (
                                                    <Image source={{ uri: r.user_avatar }} className="h-full w-full rounded-full" />
                                                ) : (
                                                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">{(r.user_name?.[0] || 'U').toUpperCase()}</Text>
                                                )}
                                            </View>
                                            <View>
                                                <Text className="text-sm font-bold text-appText">{r.user_name || 'Người dùng ẩn danh'}</Text>
                                                <Text className="text-[10px] text-appText/40">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                                            <Ionicons name="star" size={14} color="#F59E0B" />
                                            <Text className="ml-1 text-xs font-bold text-yellow-700 dark:text-yellow-500">{r.rating}</Text>
                                        </View>
                                    </View>
                                    {r.comment && (
                                        <Text className="text-sm text-appText/70 mt-1 leading-5">{r.comment}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Review Modal */}
            <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-appBg rounded-t-3xl p-6">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-bold text-appText">{myReview ? "Sửa đánh giá" : "Viết đánh giá"}</Text>
                            <TouchableOpacity onPress={() => setShowReviewModal(false)} className="h-8 w-8 items-center justify-center rounded-full bg-appSurface">
                                <Ionicons name="close" size={20} color={isDark ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm font-medium text-appText/70 text-center mb-3">Chất lượng sân như thế nào?</Text>
                        <View className="flex-row justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setReviewForm(p => ({ ...p, rating: star }))}>
                                    <Ionicons name={star <= reviewForm.rating ? "star" : "star-outline"} size={40} color={star <= reviewForm.rating ? "#F59E0B" : (isDark ? "#475569" : "#CBD5E1")} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-sm font-semibold text-appText mb-2">Chia sẻ trải nghiệm của bạn (tùy chọn)</Text>
                        <TextInput
                            value={reviewForm.comment}
                            onChangeText={text => setReviewForm(p => ({ ...p, comment: text }))}
                            placeholder="Sân sạch đẹp, ánh sáng tốt..."
                            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-appSurface border border-appText/10 rounded-xl p-4 text-appText min-h-[100px] mb-6"
                        />

                        <TouchableOpacity
                            onPress={handleSubmitReview}
                            disabled={isSubmittingReview}
                            className={`rounded-xl py-3.5 items-center flex-row justify-center ${isSubmittingReview ? 'bg-emerald-600/70' : 'bg-emerald-600'}`}
                        >
                            {isSubmittingReview ? <ActivityIndicator size="small" color="white" className="mr-2" /> : null}
                            <Text className="text-base font-bold text-white">GỬI ĐÁNH GIÁ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Bottom Sticky Bar */}
            <View className="absolute bottom-0 left-0 right-0 border-t border-appText/10 bg-appSurface px-5 py-4 flex-col shadow-lg shadow-black/20" style={{ paddingBottom: 24 }}>
                {/* Split-pay indicator */}
                {matchId && (
                    <View className="flex-row items-center gap-2 mb-3 px-1">
                        <Ionicons name="people-outline" size={16} color="#059669" />
                        <Text className="text-xs font-bold text-emerald-600">Đặt sân cùng bạn mới</Text>
                    </View>
                )}
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xs font-medium text-appText/60">
                            {selectedSlotIndices.length > 0 ? `${selectedSlotIndices.length} slot đã chọn` : `Giờ hoạt động: ${court.open_time || "06:00"} - ${court.close_time || "22:00"}`}
                        </Text>
                        <Text className="mt-1 text-xs font-medium text-appText/60">
                            {'Giá: '}<Text className="text-sm font-bold text-emerald-600">
                                {selectedSlotIndices.length > 0
                                    ? formatPrice((court.price_per_hour || 0) / 2 * selectedSlotIndices.length)
                                    : formatPrice(court.price_per_hour || minPrice) + "/h"}
                            </Text>
                        </Text>
                    </View>

                    {/* ── Guest: show login button instead of booking button ── */}
                    {isGuest ? (
                        <TouchableOpacity
                            onPress={async () => {
                                await removeItem(STORAGE_KEYS.guestMode);
                                dispatch(logout());
                            }}
                            activeOpacity={0.85}
                            className="rounded-xl px-6 py-3.5 shadow-md flex-row items-center gap-2 bg-emerald-600 shadow-emerald-900/20"
                        >
                            <Ionicons name="log-in-outline" size={18} color="white" />
                            <Text className="text-sm font-bold text-white">Đăng nhập để đặt</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleBookNow}
                            className={`rounded-xl px-8 py-3.5 shadow-md flex-row items-center gap-2 ${selectedSlotIndices.length > 0 && !isLocking
                                ? matchId ? 'bg-amber-500 shadow-amber-900/20' : 'bg-emerald-600 shadow-emerald-900/20'
                                : 'bg-appText/20'}`}
                            disabled={selectedSlotIndices.length === 0 || isLocking}
                        >
                            {isLocking ? <ActivityIndicator size="small" color="white" /> : null}
                            <Text className="text-sm font-bold text-white text-center">
                                {isLocking ? "Đang giữ chỗ..." : matchId ? "Đặt cọc " : "Đặt sân ngay"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <ModalComponent />
        </View>
    );
}
