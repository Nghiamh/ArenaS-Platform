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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import authApi from "../../../api/authApi";

// ── helpers ──────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

function validateRegisterFields({ fullName, email, phone, password, confirmPassword, isAgreed }) {
    const errors = {};

    // Full name
    const name = fullName.trim();
    if (!name) {
        errors.fullName = "Vui lòng nhập họ và tên.";
    } else if (name.length < 2) {
        errors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
    }

    // Email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
        errors.email = "Vui lòng nhập email.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        errors.email = "Email không đúng định dạng. VD: name@example.com";
    }

    // Phone
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
        errors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!PHONE_REGEX.test(trimmedPhone)) {
        errors.phone = "Số điện thoại không hợp lệ. VD: 0912345678";
    }

    // Password
    if (!password) {
        errors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 8) {
        errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    } else if (!/[A-Z]/.test(password)) {
        errors.password = "Mật khẩu phải chứa ít nhất 1 chữ in hoa.";
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.password = "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.";
    }

    // Confirm password
    if (!confirmPassword) {
        errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    // Terms
    if (!isAgreed) {
        errors.isAgreed = "Bạn cần đồng ý Điều khoản & Chính sách.";
    }

    return errors;
}

// ── component ────────────────────────────────────────────
export default function RegisterScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const navigation = useNavigation();

    const emailRef = useRef(null);
    const phoneRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmRef = useRef(null);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // ── handlers ─────────────────────────────────────────
    const clearError = (key) => {
        if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: undefined }));
    };

    const handleRegister = async () => {
        const errors = validateRegisterFields({
            fullName,
            email,
            phone,
            password,
            confirmPassword,
            isAgreed,
        });
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) return;

        try {
            setIsLoading(true);
            const trimmedEmail = email.trim();
            await authApi.register({
                name: fullName.trim(),
                email: trimmedEmail,
                userName: trimmedEmail.split("@")[0] || fullName.trim().replace(/\s+/g, "_"),
                phone: phone.trim(),
                password,
            });

            showModal({
                type: "success",
                title: "Đăng ký thành công!",
                message: `Tài khoản đã được tạo.\n\nVui lòng kiểm tra hộp thư email (${email.trim()}) để xác nhận trước khi đăng nhập.\n\nKiểm tra thư mục Spam nếu không thấy email.`,
                buttons: [{ text: "Đến trang Đăng nhập", onPress: () => navigation.navigate("Login") }],
            });
        } catch (error) {
            console.log("Register failed:", error.response?.status, error.response?.data?.message);
            const errorMessage =
                error?.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại.";
            showModal({ type: "error", title: "Đăng ký thất bại", message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    // ── render helper: input row ─────────────────────────
    const renderInput = ({
        label,
        icon,
        value,
        onChangeText,
        placeholder,
        errorKey,
        inputRef,
        nextRef,
        secureTextEntry = false,
        toggleSecure,
        showSecure,
        keyboardType = "default",
        autoCapitalize = "none",
    }) => (
        <View>
            <Text className="mb-2 text-[10px] font-bold text-gray-500 uppercase">{label}</Text>
            <View
                className={`flex-row items-center rounded-xl border ${
                    fieldErrors[errorKey] ? "border-red-400" : "border-gray-200"
                } bg-[#F8FAFC] px-3 py-3`}
            >
                <Ionicons name={icon} size={18} color="#64748B" />
                <TextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-2 text-sm text-gray-800"
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry && !showSecure}
                    returnKeyType={nextRef ? "next" : "done"}
                    value={value}
                    onChangeText={(v) => {
                        onChangeText(v);
                        clearError(errorKey);
                    }}
                    onSubmitEditing={() =>
                        nextRef ? nextRef.current?.focus() : handleRegister()
                    }
                    blurOnSubmit={!nextRef}
                />
                {toggleSecure ? (
                    <TouchableOpacity
                        onPress={toggleSecure}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name={showSecure ? "eye-off-outline" : "eye-outline"}
                            size={18}
                            color="#64748B"
                        />
                    </TouchableOpacity>
                ) : null}
            </View>
            {fieldErrors[errorKey] ? (
                <Text className="mt-1.5 text-xs text-red-500">{fieldErrors[errorKey]}</Text>
            ) : null}
        </View>
    );

    // ── render ───────────────────────────────────────────
    return (
        <View className="flex-1 bg-[#F2F7F4]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-[#F2F7F4]">
                <View className="flex-row items-center gap-2">
                    <Image
                        source={require("../../../../assets/Img/logo.png")}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                        resizeMode="cover"
                    />
                    <Text className="text-xl font-black text-[#007F3F]">ArenaS</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
                    <Ionicons name="close" size={24} color="#475569" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior="padding"
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="rounded-3xl bg-white p-6 shadow-sm shadow-black/5 mt-2">
                        {/* Title */}
                        <View className="items-center mb-6">
                            <Text className="text-2xl font-black text-gray-900">Tạo tài khoản</Text>
                            <Text className="mt-2 text-center text-[13px] text-gray-500 px-4">
                                Tham gia cộng đồng ArenaS để bắt đầu hành trình thể thao của bạn.
                            </Text>
                        </View>

                        <View className="gap-4">
                            {/* Full Name */}
                            {renderInput({
                                label: "Họ và tên",
                                icon: "person-outline",
                                value: fullName,
                                onChangeText: setFullName,
                                placeholder: "Nguyễn Văn A",
                                errorKey: "fullName",
                                nextRef: emailRef,
                                autoCapitalize: "words",
                            })}

                            {/* Email */}
                            {renderInput({
                                label: "Email",
                                icon: "mail-outline",
                                value: email,
                                onChangeText: setEmail,
                                placeholder: "example@gmail.com",
                                errorKey: "email",
                                inputRef: emailRef,
                                nextRef: phoneRef,
                                keyboardType: "email-address",
                            })}

                            {/* Phone */}
                            {renderInput({
                                label: "Số điện thoại",
                                icon: "call-outline",
                                value: phone,
                                onChangeText: setPhone,
                                placeholder: "0912 345 678",
                                errorKey: "phone",
                                inputRef: phoneRef,
                                nextRef: passwordRef,
                                keyboardType: "phone-pad",
                            })}

                            {/* Password */}
                            {renderInput({
                                label: "Mật khẩu",
                                icon: "lock-closed-outline",
                                value: password,
                                onChangeText: setPassword,
                                placeholder: "••••••••",
                                errorKey: "password",
                                inputRef: passwordRef,
                                nextRef: confirmRef,
                                secureTextEntry: true,
                                showSecure: showPassword,
                                toggleSecure: () => setShowPassword(!showPassword),
                            })}

                            {/* Confirm Password */}
                            {renderInput({
                                label: "Xác nhận mật khẩu",
                                icon: "shield-checkmark-outline",
                                value: confirmPassword,
                                onChangeText: setConfirmPassword,
                                placeholder: "••••••••",
                                errorKey: "confirmPassword",
                                inputRef: confirmRef,
                                secureTextEntry: true,
                                showSecure: showConfirmPassword,
                                toggleSecure: () => setShowConfirmPassword(!showConfirmPassword),
                            })}

                            {/* Terms checkbox */}
                            <View>
                                <View className="flex-row items-start mt-2 pr-2">
                                    <TouchableOpacity
                                        className="mt-0.5"
                                        onPress={() => {
                                            setIsAgreed(!isAgreed);
                                            clearError("isAgreed");
                                        }}
                                    >
                                        <Ionicons
                                            name={isAgreed ? "checkbox" : "square-outline"}
                                            size={18}
                                            color={isAgreed ? "#007F3F" : "#94A3B8"}
                                        />
                                    </TouchableOpacity>
                                    <Text className="ml-2 flex-1 text-[11px] text-gray-500 leading-relaxed">
                                        Tôi đồng ý với{" "}
                                        <Text className="font-bold text-[#007F3F]">
                                            Điều khoản dịch vụ
                                        </Text>{" "}
                                        và{" "}
                                        <Text className="font-bold text-[#007F3F]">
                                            Chính sách bảo mật
                                        </Text>
                                        .
                                    </Text>
                                </View>
                                {fieldErrors.isAgreed ? (
                                    <Text className="mt-1.5 ml-6 text-xs text-red-500">
                                        {fieldErrors.isAgreed}
                                    </Text>
                                ) : null}
                            </View>

                            {/* Submit */}
                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={isLoading}
                                activeOpacity={0.85}
                                className={`mt-4 flex-row rounded-xl py-3.5 shadow-sm items-center justify-center gap-1 ${
                                    isLoading
                                        ? "bg-gray-400"
                                        : "bg-[#22C55E] shadow-green-500/30"
                                }`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text className="text-sm font-bold text-white">
                                            Đăng ký
                                        </Text>
                                        <Ionicons name="arrow-forward" size={16} color="white" />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Divider */}
                            <View className="h-px w-full bg-gray-200 my-4" />

                            {/* Already have account */}
                            <View className="items-center gap-1.5">
                                <Text className="text-[11px] text-gray-500">Đã có tài khoản?</Text>
                                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                    <Text className="text-xs font-bold text-[#007F3F]">
                                        Quay lại trang Đăng nhập
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <ModalComponent />
        </View>
    );
}
