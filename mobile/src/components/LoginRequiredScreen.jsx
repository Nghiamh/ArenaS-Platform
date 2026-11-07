import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import { logout } from "../store/slices/authSlice";
import { removeItem } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/config";

/**
 * LoginRequiredScreen – full-screen gate for guest users.
 *
 * Dispatches logout + xóa guestMode storage → AppNavigator tự chuyển về
 * AuthStack (LoginScreen) mà không cần navigate trực tiếp qua stack khác.
 *
 * Props:
 *  icon        – Ionicons name (default "lock-closed-outline")
 *  title       – Heading text
 *  description – Sub-text description
 */
export default function LoginRequiredScreen({
    icon = "lock-closed-outline",
    title = "Yêu cầu đăng nhập",
    description = "Bạn cần đăng nhập để sử dụng tính năng này.",
}) {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    /**
     * Xóa guest mode khỏi storage + dispatch logout
     * → AppNavigator thấy token=null, isGuest=false → render AuthStack
     * → AuthStack defaultScreen = "Login"
     */
    const handleGoLogin = async () => {
        await removeItem(STORAGE_KEYS.guestMode);
        dispatch(logout());
        // Sau khi AuthStack hiện, nó mặc định vào LoginScreen
    };

    /**
     * Tương tự nhưng navigate sang Register sau khi AuthStack sẵn sàng.
     * Dùng setTimeout ngắn để đợi AppNavigator re-render xong.
     */
    const handleGoRegister = async () => {
        await removeItem(STORAGE_KEYS.guestMode);
        dispatch(logout());
        // AuthStack sẵn sàng sau vài frame, navigate tớ Register
        setTimeout(() => {
            try { navigation.navigate("Register"); } catch (_) {}
        }, 150);
    };

    return (
        <View className="flex-1 bg-appBg items-center justify-center px-8">
            {/* Back button */}
            <TouchableOpacity
                onPress={() => navigation.canGoBack() ? navigation.goBack() : null}
                className="absolute top-12 left-4 p-2"
            >
                <Ionicons name="arrow-back" size={24} color="#059669" />
            </TouchableOpacity>

            {/* Icon */}
            <View className="h-24 w-24 rounded-3xl bg-emerald-50 items-center justify-center mb-6 shadow-sm shadow-emerald-900/10">
                <Ionicons name={icon} size={44} color="#059669" />
            </View>

            {/* Text */}
            <Text className="text-2xl font-black text-appText text-center mb-3">{title}</Text>
            <Text className="text-sm text-appText/50 text-center leading-6 mb-10">{description}</Text>

            {/* CTA – Đăng nhập */}
            <TouchableOpacity
                onPress={handleGoLogin}
                activeOpacity={0.85}
                style={{
                    backgroundColor: "#059669",
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 48,
                    alignItems: "center",
                    shadowColor: "#059669",
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                    width: "100%",
                }}
            >
                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                    Đăng nhập ngay
                </Text>
            </TouchableOpacity>

            {/* Đăng ký */}
            <TouchableOpacity
                onPress={handleGoRegister}
                className="mt-4 py-3 px-6"
            >
                <Text className="text-sm text-appText/50">
                    Chưa có tài khoản?{" "}
                    <Text className="text-emerald-600 font-bold">Đăng ký</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
}
