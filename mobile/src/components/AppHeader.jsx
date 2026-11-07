import { View, Text, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";

/**
 * Header dùng chung cho HomeScreen và SearchResultScreen.
 * @param {boolean} showBack – hiện nút back bên trái
 * @param {string}  containerClassName – class bổ sung cho View bao ngoài
 */
export default function AppHeader({ showBack = false, containerClassName = "" }) {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const iconColor = isDark ? "#FFFFFF" : "#000000";
    const navigation = useNavigation();
    const { token, isGuest } = useSelector((state) => state.auth);
    const isLoggedIn = !!token && !isGuest;

    return (
        <View
            className={`flex-row items-center min-h-[48px] mb-2 ${showBack ? "justify-between" : "justify-end"} ${containerClassName}`}
        >
            {/* Nút Back (tuỳ chọn) */}
            {showBack ? (
                <View className="z-10">
                    <TouchableOpacity
                        onPress={() =>
                            navigation.canGoBack()
                                ? navigation.goBack()
                                : navigation.navigate("Trang chủ")
                        }
                        className="p-2 -ml-2"
                    >
                        <Ionicons name="arrow-back" size={24} color={iconColor} />
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Logo ở giữa */}
            <View
                className="absolute inset-0 items-center justify-center z-0"
                pointerEvents="none"
            >
                <Image
                    source={require("../../assets/Img/bannerNoBg.JPG.png")}
                    className="h-28 w-64"
                    resizeMode="contain"
                />
            </View>

            {/* Actions bên phải */}
            <View className="flex-row items-center gap-2 z-10">
                {isLoggedIn && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Thông báo")}
                        className="h-9 w-9 items-center justify-center rounded-full bg-appSurface border border-appText/10 relative"
                    >
                        <Ionicons name="notifications-outline" size={18} color={iconColor} />
                        <View className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border border-appSurface" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={toggleColorScheme}
                    className="h-9 w-9 items-center justify-center rounded-full bg-appSurface border border-appText/10"
                >
                    <MaterialCommunityIcons
                        name={isDark ? "weather-sunny" : "weather-night"}
                        size={18}
                        color={iconColor}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}
