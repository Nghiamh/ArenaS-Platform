import { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { fetchCourts } from "../../../store/slices/venueSlice";
import { getCourtImage, formatPrice } from "../../../utils/courtHelpers";
import AppHeader from "../../../components/AppHeader";

const filters = ["Tất cả", "Gần đây", "Giá tốt nhất", "Đánh giá cao"];

export default function SearchResultScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const sportName = route.params?.sport || "";
    const query = route.params?.query || "";
    const matchId = route.params?.matchId || null;

    // Search state – cho phép người dùng lọc ngay tại màn hình này
    const [searchText, setSearchText] = useState(query);
    const [activeSearch, setActiveSearch] = useState(query);

    const handleSearch = () => {
        setActiveSearch(searchText.trim());
    };

    const { venues: courts, status, error } = useSelector((state) => state.venue);
    const isLoading = status === "loading";

    // Fetch courts khi vào screen (hoặc dùng data đã có)
    useEffect(() => {
        if (courts.length === 0) {
            dispatch(fetchCourts());
        }
    }, [dispatch, courts.length]);

    // Lọc theo sport hoặc searchText (ưu tiên search local)
    const filteredCourts = useMemo(() => {
        return courts.filter((c) => {
            let matchesSport = true;
            let matchesQuery = true;

            if (sportName) {
                const sports = c.sports || [];
                matchesSport = sports.some((s) => s.toLowerCase().includes(sportName.toLowerCase()));
            }

            const q = (activeSearch || "").toLowerCase();
            if (q) {
                const nameMatch = (c.name || "").toLowerCase().includes(q);
                const addressMatch = (c.location || c.address || "").toLowerCase().includes(q);
                const sportMatch = (c.sports || []).some(s => s.toLowerCase().includes(q));
                matchesQuery = nameMatch || addressMatch || sportMatch;
            }

            return matchesSport && matchesQuery;
        });
    }, [courts, sportName, activeSearch]);

    return (
        <SafeAreaView className="flex-1 bg-appBg">
            <View className="flex-1 pt-2">
                {/* Header dùng chung – có nút back */}
                <AppHeader showBack containerClassName="px-4" />

                {/* Thanh tìm kiếm */}
                <View className="mx-4 mb-3 flex-row items-center gap-2">
                    <View className="flex-1 flex-row items-center rounded-full border border-appText/10 bg-appSurface px-4 py-2">
                        <Ionicons name="search-outline" size={18} color={isDark ? "#94A3B8" : "#64748B"} style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Tìm sân, địa chỉ, môn thể thao..."
                            placeholderTextColor="#94A3B8"
                            className="flex-1 text-sm text-appText"
                            value={searchText}
                            onChangeText={setSearchText}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearchText(""); setActiveSearch(""); }}>
                                <Ionicons name="close-circle" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={handleSearch}
                        className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600"
                    >
                        <Ionicons name="search" size={18} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Match booking banner khi đến từ Chat */}
                {matchId && (
                    <View className="mx-4 mt-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl flex-row items-center gap-3">
                        <Ionicons name="people-outline" size={20} color="#059669" />
                        <View className="flex-1">
                            <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Đặt sân cho trận đấu</Text>
                        </View>
                    </View>
                )}

                {/* Sub-header info */}
                <View className="px-4 mt-4">
                    <Text className="text-sm text-appText/60">
                        Tìm thấy {filteredCourts.length} kết quả cho {query ? `"${query}"` : sportName ? `sân ${sportName.toLowerCase()}` : "tất cả sân"}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-1">
                        <Ionicons name="location-outline" size={16} color="#059669" />
                        <Text className="text-sm font-bold text-appText">TP. Hồ Chí Minh, VN</Text>
                    </View>
                </View>

                {/* Filter chips */}
                <View className="mt-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-2 pb-1">
                        {filters.map((filter, index) => (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => Alert.alert("Bộ lọc", `Đã chọn: ${filter}`)}
                                className={`rounded-full px-4 py-1.5 ${index === 0 ? "bg-emerald-500" : "bg-appSurface border border-appText/10"}`}
                            >
                                <Text className={`text-sm font-medium ${index === 0 ? "text-white" : "text-appText/70"}`}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Result List */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#059669" />
                        <Text className="mt-3 text-sm text-appText/60">Đang tải danh sách sân...</Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center px-6">
                        <Ionicons name="cloud-offline-outline" size={48} color={isDark ? "#475569" : "#94A3B8"} />
                        <Text className="mt-3 text-sm text-appText/60 text-center">{error}</Text>
                        <TouchableOpacity
                            onPress={() => dispatch(fetchCourts())}
                            className="mt-4 rounded-full bg-emerald-700 px-6 py-2"
                        >
                            <Text className="text-sm font-bold text-white">Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView className="flex-1 mt-4" contentContainerClassName="px-4 pb-8 gap-4" showsVerticalScrollIndicator={false}>
                        {filteredCourts.length === 0 ? (
                            <View className="items-center py-16">
                                <Ionicons name="search-outline" size={48} color={isDark ? "#475569" : "#94A3B8"} />
                                <Text className="mt-3 text-sm text-appText/60 text-center">
                                    Không tìm thấy sân phù hợp với "{query || sportName}".
                                </Text>
                            </View>
                        ) : (
                            filteredCourts.map((court) => (
                                <TouchableOpacity
                                    key={court._id || court.id}
                                    className="rounded-2xl bg-appSurface shadow-sm shadow-black/10 overflow-hidden border border-appText/5"
                                    onPress={() => navigation.navigate("Đặt lịch", { courtId: court._id || court.id, matchId })}
                                    activeOpacity={0.8}
                                >
                                    {/* Image Section */}
                                    <View className="relative h-40 w-full bg-slate-200 dark:bg-slate-800">
                                        <Image
                                            source={{ uri: getCourtImage(court) }}
                                            className="h-full w-full object-cover"
                                        />
                                        {(court.avg_rating || court.rating) ? (
                                            <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded bg-white px-1.5 py-0.5 shadow-sm">
                                                <Ionicons name="star" size={12} color="#F59E0B" />
                                                <Text className="text-[11px] font-bold text-slate-800">{court.avg_rating || court.rating}</Text>
                                            </View>
                                        ) : null}
                                        <View className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 ${court.status === "unavailable" ? "bg-slate-600" : "bg-emerald-600"}`}>
                                            <Text className="text-[10px] font-bold tracking-wide text-white">
                                                {court.status === "unavailable" ? "HẾT SÂN" : "CÒN SÂN"}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Content Section */}
                                    <View className="p-4">
                                        <View className="flex-row items-start justify-between">
                                            <Text className="text-base font-bold text-appText flex-1 mr-2">{court.name || "Sân không tên"}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1 mt-1">
                                            <Ionicons name="location-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                            <Text className="text-xs text-appText/60">{court.location || court.address || ""}</Text>
                                        </View>
                                        <View className="h-px w-full bg-appText/5 my-3" />
                                        <View className="flex-row items-end justify-between">
                                            <View>
                                                <Text className="text-[10px] text-appText/50 uppercase tracking-wider font-semibold">Chỉ từ</Text>
                                                <View className="flex-row items-end gap-0.5 mt-0.5">
                                                    <Text className="text-lg font-bold text-emerald-600">
                                                        {formatPrice(court.price_per_hour || court.price || court.pricePerHour)}
                                                    </Text>
                                                    <Text className="text-xs font-bold text-appText/50 mb-0.5">/h</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                className="rounded-lg px-4 py-2"
                                                style={{ backgroundColor: matchId ? '#D97706' : '#10B981' }}
                                                onPress={() => navigation.navigate("Đặt lịch", { courtId: court._id || court.id, matchId })}
                                            >
                                                <Text className="text-xs font-bold text-white">{matchId ? 'CHỌN SÂN' : 'ĐẶT NGAY'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}
