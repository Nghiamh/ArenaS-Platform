import { useEffect, useState, useMemo } from "react";
import { ScrollView, Text, TextInput, View, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "../../../store/slices/authSlice";
import { fetchCourts } from "../../../store/slices/venueSlice";
import {
    getSportIcon, getSportTone, getSportNameVI,
    getCourtImage, formatPrice, groupBySport,
} from "../../../utils/courtHelpers";
import AppHeader from "../../../components/AppHeader";

export default function HomeScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { token, isGuest } = useSelector((state) => state.auth);
    const { venues: courts, status, error } = useSelector((state) => state.venue);

    const isLoggedIn = !!token && !isGuest;
    const isLoading = status === "loading";
    const [activeFilter, setActiveFilter] = useState("Tất cả");
    const [searchText, setSearchText] = useState("");

    const handleSearch = () => {
        if (searchText.trim()) {
            navigation.navigate("Tìm Sân", { query: searchText.trim() });
        }
    };

    // Fetch courts và user profile khi component mount
    useEffect(() => {
        dispatch(fetchCourts());
        if (isLoggedIn) {
            dispatch(fetchUserProfile());
        }
    }, [dispatch, isLoggedIn]);

    // Nhóm theo môn thể thao
    const sportGroups = useMemo(() => groupBySport(courts), [courts]);

    // Áp dụng filter cho danh sách "Sân gần bạn"
    const nearbyVenues = useMemo(() => {
        let filtered = [...courts];
        switch (activeFilter) {
            case "Nổi bật":
                filtered = filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
                break;
            case "Mới":
                filtered = filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            case "Gần đây":
                filtered = filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                break;
            default:
                break;
        }
        return filtered.slice(0, 6);
    }, [courts, activeFilter]);

    return (
        <SafeAreaView className="flex-1 bg-appBg">
            <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-2">
                <AppHeader />

                <View className="mt-5 flex-row items-center gap-3">
                    <View className="flex-1 flex-row items-center rounded-full border border-appText/10 bg-appSurface px-4 py-1.5">
                        <Ionicons name="search-outline" size={18} color={isDark ? "#94A3B8" : "#64748B"} style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Tìm sân, môn thể thao..."
                            placeholderTextColor="#94A3B8"
                            className="flex-1 text-sm text-appText"
                            value={searchText}
                            onChangeText={setSearchText}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-5" contentContainerClassName="gap-3 pr-4">
                    {['Tất cả', 'Gần đây', 'Nổi bật', 'Mới'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setActiveFilter(item)}
                            className={`rounded-full px-4 py-2 ${activeFilter === item ? 'bg-emerald-700' : 'bg-appSurface border border-appText/10'}`}
                        >
                            <Text className={`text-sm font-semibold ${activeFilter === item ? 'text-white' : 'text-appText/80'}`}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ── Môn thể thao ── */}
                <View className="mt-7 flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-appText">Môn thể thao</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Tìm Sân")}>
                        <Text className="text-sm font-semibold text-emerald-300">Xem tất cả ›</Text>
                    </TouchableOpacity>
                </View>

                {isLoading && courts.length === 0 ? (
                    <View className="mt-8 items-center">
                        <ActivityIndicator size="large" color="#059669" />
                        <Text className="mt-3 text-sm text-appText/60">Đang tải dữ liệu sân...</Text>
                    </View>
                ) : error ? (
                    <View className="mt-8 items-center px-6">
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
                    <>
                        <View className="mt-4 flex-row flex-wrap justify-between gap-3">
                            {sportGroups.map((sport) => (
                                <TouchableOpacity
                                    key={sport.key}
                                    onPress={() => navigation.navigate("Tìm Sân", { sport: sport.key })}
                                    activeOpacity={0.8}
                                    className={`w-[48%] overflow-hidden rounded-3xl shadow-lg shadow-black/20 ${getSportTone(sport.key)} min-h-[140px]`}
                                >
                                    <View className="flex-1 justify-between z-10 p-4">
                                        <View className="h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm">
                                            <MaterialCommunityIcons name={getSportIcon(sport.key)} size={22} color="#000000" />
                                        </View>
                                        <View className="mt-8">
                                            <Text className="text-xl font-bold text-white shadow-sm">{sport.name}</Text>
                                            <Text className="mt-1 text-sm font-medium text-white/90">{sport.count} sân</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ── Sân gần bạn ── */}
                        <View className="mt-8 flex-row items-center justify-between">
                            <Text className="text-xl font-bold text-appText">Sân gần bạn</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Tìm Sân")}>
                                <Text className="text-sm font-semibold text-emerald-300">Xem tất cả</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mt-4 gap-4">
                            {nearbyVenues.map((court) => (
                                <TouchableOpacity
                                    key={court._id || court.id}
                                    className="rounded-3xl bg-appSurface p-3 border border-appText/10"
                                    onPress={() => navigation.navigate("Đặt lịch", { courtId: court._id || court.id })}
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-row gap-3">
                                        <Image
                                            source={{ uri: getCourtImage(court) }}
                                            className="h-20 w-20 rounded-2xl bg-slate-200"
                                            resizeMode="cover"
                                        />
                                        <View className="flex-1">
                                            <View className="flex-row items-start justify-between gap-2">
                                                <Text className="flex-1 text-base font-bold text-appText">{court.name || "Sân không tên"}</Text>
                                                <Text className="text-sm font-semibold text-amber-300">★ {court.avg_rating || court.rating || "N/A"}</Text>
                                            </View>
                                            <Text className="mt-1 text-xs text-appText/65">{court.location || court.address || ""}</Text>
                                            <View className="mt-2 flex-row flex-wrap gap-2">
                                                {(court.sports || []).map((s) => (
                                                    <View key={s} className="rounded-full bg-appText/5 px-2.5 py-1">
                                                        <Text className="text-[11px] text-appText/75">{getSportNameVI(s)}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <View className="mt-3 flex-row items-center justify-between gap-2">
                                                <Text className="flex-1 text-sm font-bold text-emerald-400" numberOfLines={1}>
                                                    {formatPrice(court.price_per_hour || court.price || court.pricePerHour, "đ/giờ")}
                                                </Text>
                                                <View className="rounded-full bg-emerald-600 px-4 py-1.5 justify-center items-center">
                                                    <Text className="text-[13px] font-bold text-white">Đặt</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {courts.length === 0 && status === "succeeded" && (
                            <View className="mt-8 items-center px-6">
                                <Ionicons name="tennisball-outline" size={48} color={isDark ? "#475569" : "#94A3B8"} />
                                <Text className="mt-3 text-sm text-appText/60 text-center">Chưa có sân nào được đăng ký.</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
