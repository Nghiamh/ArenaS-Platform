import React, { useState, useRef } from "react";
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
import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { setGuestMode, setCredentials } from "../../../store/slices/authSlice";
import { setItem } from "../../../utils/storage";
import { STORAGE_KEYS } from "../../../constants/config";
import authApi from "../../../api/authApi";

// ── helpers ──────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

function validateLoginFields({ email, password }) {
    const errors = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
        errors.email = "Vui lòng nhập email hoặc số điện thoại.";
    } else if (!EMAIL_REGEX.test(trimmedEmail) && !PHONE_REGEX.test(trimmedEmail)) {
        errors.email = "Email hoặc số điện thoại không hợp lệ.";
    }

    if (!password) {
        errors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 6) {
        errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    return errors;
}

// ── component ────────────────────────────────────────────
export default function LoginScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const passwordRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});


    // ── handlers ─────────────────────────────────────────
    const handleLogin = async () => {
        const errors = validateLoginFields({ email, password });
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) return;

        try {
            setIsLoading(true);
            const response = await authApi.login({
                email: email.trim(),
                password,
            });

            const { token, user } = response.data;

            if (token) {
                await setItem(STORAGE_KEYS.authToken, token);
                await setItem(STORAGE_KEYS.user, JSON.stringify(user));
                dispatch(setCredentials({ user, token }));
            }
        } catch (error) {
            console.log("Login failed:", error.response?.status, error.response?.data?.message);
            const errorMessage =
                error.response?.data?.message ||
                "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
            showModal({ type: "error", title: "Đăng nhập thất bại", message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipLogin = async () => {
        await setItem(STORAGE_KEYS.guestMode, "true");
        dispatch(setGuestMode());
    };

    // clear individual error on change
    const onChangeEmail = (val) => {
        setEmail(val);
        if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
    };
    const onChangePassword = (val) => {
        setPassword(val);
        if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
    };

    // ── render ───────────────────────────────────────────
    return (
        <View className="flex-1 bg-[#F2F7F4]">
            {/* Skip / Guest button */}
            <View className="flex-row justify-end px-5 pt-12 pb-2">
                <TouchableOpacity
                    onPress={handleSkipLogin}
                    className="flex-row items-center gap-1 p-1 bg-white/50 rounded-full px-3 py-1.5 border border-green-700/10"
                    activeOpacity={0.7}
                >
                    <Text className="text-xs font-bold text-[#007F3F]">Trang Chủ</Text>
                    <Ionicons name="arrow-forward" size={14} color="#007F3F" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior="padding"
                className="flex-1"
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48, paddingTop: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets={true}
                >
                    {/* Logo & title */}
                    <View className="items-center mb-8">
                        <Image
                            source={require("../../../../assets/Img/logo.png")}
                            style={{ width: 80, height: 80, borderRadius: 40 }}
                            resizeMode="cover"
                        />
                        <Text className="mt-4 text-3xl font-black text-[#007F3F]">ArenaS</Text>
                        <Text className="mt-2 text-sm text-[#475569]">
                            Đặt Sân Nhanh Chóng – Tiện Lợi
                        </Text>
                    </View>

                    {/* Card */}
                    <View className="rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
                        {/* ── Email ── */}
                        <View className="mb-4">
                            <Text className="mb-2 text-[10px] font-bold text-gray-500 uppercase">
                                Email hoặc số điện thoại
                            </Text>
                            <View
                                className={`flex-row items-center rounded-xl border ${fieldErrors.email ? "border-red-400" : "border-gray-200"
                                    } bg-[#F8FAFC] px-3 py-3`}
                            >
                                <Ionicons name="person-outline" size={18} color="#64748B" />
                                <TextInput
                                    placeholder="name@example.com"
                                    placeholderTextColor="#94A3B8"
                                    className="flex-1 ml-2 text-sm text-gray-800"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    value={email}
                                    onChangeText={onChangeEmail}
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                            </View>
                            {fieldErrors.email ? (
                                <Text className="mt-1.5 text-xs text-red-500">{fieldErrors.email}</Text>
                            ) : null}
                        </View>

                        {/* ── Password ── */}
                        <View className="mb-5">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-[10px] font-bold text-gray-500 uppercase">
                                    Mật khẩu
                                </Text>
                                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                                    <Text className="text-[10px] font-bold text-[#007F3F] uppercase">
                                        Quên mật khẩu?
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View
                                className={`flex-row items-center rounded-xl border ${fieldErrors.password ? "border-red-400" : "border-gray-200"
                                    } bg-[#F8FAFC] px-3 py-3`}
                            >
                                <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                                <TextInput
                                    ref={passwordRef}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showPassword}
                                    className="flex-1 mx-2 text-sm text-gray-800"
                                    returnKeyType="done"
                                    value={password}
                                    onChangeText={onChangePassword}
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={18}
                                        color="#64748B"
                                    />
                                </TouchableOpacity>
                            </View>
                            {fieldErrors.password ? (
                                <Text className="mt-1.5 text-xs text-red-500">
                                    {fieldErrors.password}
                                </Text>
                            ) : null}
                        </View>

                        {/* ── Submit ── */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.85}
                            className={`rounded-xl py-3.5 shadow-sm items-center justify-center ${isLoading ? "bg-gray-400" : "bg-[#00522B] shadow-green-900/20"
                                }`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-sm font-bold text-white">Đăng nhập</Text>
                            )}
                        </TouchableOpacity>

                    </View>

                    {/* ── Footer ── */}
                    <View className="flex-row justify-center mt-8">
                        <Text className="text-xs text-gray-500">Bạn chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                            <Text className="text-xs font-bold text-[#007F3F]">Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <ModalComponent />
        </View>
    );
}
