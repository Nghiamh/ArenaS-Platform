import React, { useState } from "react";
import {
    ScrollView,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useAppModal } from "../../../components/AppModal";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import authApi from "../../../api/authApi";

// ── helpers ──────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── component ────────────────────────────────────────────
export default function ForgotPasswordScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const navigation = useNavigation();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async () => {
        const trimmed = email.trim();
        if (!trimmed) {
            setEmailError("Vui lòng nhập email đã đăng ký.");
            return;
        }
        if (!EMAIL_REGEX.test(trimmed)) {
            setEmailError("Email không đúng định dạng.");
            return;
        }

        try {
            setIsLoading(true);
            setEmailError("");
            const response = await authApi.forgotPassword({ email: trimmed });
            setIsSent(true);
            showModal({
                type: "success",
                title: "Email đã được gửi!",
                message: response.data?.message || "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu. Kiểm tra thư mục Spam nếu không thấy.",
            });
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.";
            setEmailError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-[#F2F7F4]">
            {/* Header */}
            <View className="flex-row items-center px-5 pt-12 pb-4">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="p-1 mr-3"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="arrow-back" size={22} color="#007F3F" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Quên mật khẩu</Text>
            </View>

            <KeyboardAvoidingView
                behavior="padding"
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 20,
                        paddingBottom: 48,
                        justifyContent: "center",
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Icon + description */}
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 rounded-full bg-[#D1FAE5] items-center justify-center mb-4">
                            <Ionicons name="lock-open-outline" size={36} color="#007F3F" />
                        </View>
                        <Text className="text-2xl font-black text-gray-900 mb-2">
                            Đặt lại mật khẩu
                        </Text>
                        <Text className="text-sm text-gray-500 text-center px-6 leading-5">
                            Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.
                        </Text>
                    </View>

                    {/* Card */}
                    <View className="rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
                        {isSent ? (
                            /* ── Success state ── */
                            <View className="items-center py-4">
                                <View className="w-16 h-16 rounded-full bg-[#D1FAE5] items-center justify-center mb-4">
                                    <Ionicons name="mail-outline" size={30} color="#059669" />
                                </View>
                                <Text className="text-base font-bold text-gray-900 mb-2">
                                    Email đã được gửi!
                                </Text>
                                <Text className="text-sm text-gray-500 text-center px-4 mb-6 leading-5">
                                    Vui lòng kiểm tra hộp thư (bao gồm thư mục spam) và nhấn vào liên kết để đặt lại mật khẩu.
                                </Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setIsSent(false);
                                        setEmail("");
                                    }}
                                    className="mb-3"
                                >
                                    <Text className="text-sm font-bold text-[#007F3F]">
                                        Gửi lại email
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => navigation.navigate("Login")}
                                    activeOpacity={0.85}
                                    className="w-full rounded-xl py-3.5 bg-[#00522B] items-center justify-center"
                                >
                                    <Text className="text-sm font-bold text-white">
                                        Quay lại đăng nhập
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* ── Form state ── */
                            <>
                                <View className="mb-5">
                                    <Text className="mb-2 text-[10px] font-bold text-gray-500 uppercase">
                                        Email đã đăng ký
                                    </Text>
                                    <View
                                        className={`flex-row items-center rounded-xl border ${
                                            emailError ? "border-red-400" : "border-gray-200"
                                        } bg-[#F8FAFC] px-3 py-3`}
                                    >
                                        <Ionicons name="mail-outline" size={18} color="#64748B" />
                                        <TextInput
                                            placeholder="name@example.com"
                                            placeholderTextColor="#94A3B8"
                                            className="flex-1 ml-2 text-sm text-gray-800"
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            returnKeyType="done"
                                            value={email}
                                            onChangeText={(val) => {
                                                setEmail(val);
                                                if (emailError) setEmailError("");
                                            }}
                                            onSubmitEditing={handleSubmit}
                                        />
                                    </View>
                                    {emailError ? (
                                        <Text className="mt-1.5 text-xs text-red-500">
                                            {emailError}
                                        </Text>
                                    ) : null}
                                </View>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    activeOpacity={0.85}
                                    className={`rounded-xl py-3.5 shadow-sm items-center justify-center ${
                                        isLoading
                                            ? "bg-gray-400"
                                            : "bg-[#00522B] shadow-green-900/20"
                                    }`}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-sm font-bold text-white">
                                            Gửi liên kết đặt lại
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Footer */}
                    {!isSent && (
                        <View className="flex-row justify-center mt-8">
                            <Text className="text-xs text-gray-500">Đã nhớ mật khẩu? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text className="text-xs font-bold text-[#007F3F]">
                                    Đăng nhập
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
            <ModalComponent />
        </View>
    );
}
