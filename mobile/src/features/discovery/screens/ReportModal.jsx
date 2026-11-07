import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useAppModal } from "../../../components/AppModal";
import { Ionicons } from "@expo/vector-icons";
import matchmakingApi from "../../../api/matchmakingApi";

const REPORT_REASONS = [
    { id: "toxic", label: "Hành vi độc hại / Ngôn từ xúc phạm", icon: "flame-outline" },
    { id: "no_show", label: "Không đến / Vắng mặt (AFK)", icon: "person-remove-outline" },
    { id: "cheating", label: "Gian lận / Chơi xấu", icon: "warning-outline" },
    { id: "fake_profile", label: "Thông tin giả mạo", icon: "alert-circle-outline" },
    { id: "other", label: "Lý do khác", icon: "ellipsis-horizontal-outline" },
];

export default function ReportModal({ visible, onClose, matchId, opponentName }) {
    const { showModal, ModalComponent } = useAppModal();
    const [selectedReason, setSelectedReason] = useState(null);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) {
            showModal({ type: "warning", title: "Thiếu thông tin", message: "Vui lòng chọn lý do tố cáo." });
            return;
        }
        if (!description.trim()) {
            showModal({ type: "warning", title: "Thiếu thông tin", message: "Vui lòng mô tả chi tiết vi phạm." });
            return;
        }

        try {
            setIsSubmitting(true);
            await matchmakingApi.reportOpponent(matchId, {
                reason: selectedReason,
                description: description.trim(),
            });

            showModal({
                type: "success",
                title: "Đã gửi tố cáo",
                message: "Báo cáo của bạn đã được gửi đến Admin. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.",
                buttons: [{ text: "OK", onPress: onClose }],
            });

            // Reset
            setSelectedReason(null);
            setDescription("");
        } catch (err) {
            const msg = err.response?.data?.error || "Không thể gửi tố cáo. Vui lòng thử lại.";
            showModal({ type: "error", title: "Lỗi", message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedReason(null);
        setDescription("");
        onClose();
    };

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View className="flex-1 justify-end bg-black/40">
                        <View className="bg-white dark:bg-[#111827] rounded-t-3xl max-h-[85%] overflow-hidden">
                            {/* Handle bar */}
                            <View className="items-center pt-3 pb-1">
                                <View className="w-10 h-1 rounded-full bg-appText/20" />
                            </View>

                            <ScrollView
                                className="px-5 pb-8"
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 30 }}
                            >
                                {/* Header */}
                                <View className="flex-row items-center justify-between mt-3 mb-6">
                                    <View className="flex-1">
                                        <Text className="text-xl font-bold text-appText">Tố cáo người chơi</Text>
                                        <Text className="text-sm text-appText/50 mt-1">
                                            Tố cáo: <Text className="font-semibold text-appText/70">{opponentName || "Đối thủ"}</Text>
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={handleClose} className="p-2 -mr-2">
                                        <Ionicons name="close" size={24} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>

                                {/* Warning */}
                                <View className="flex-row items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3 mb-6">
                                    <Ionicons name="information-circle" size={20} color="#d97706" style={{ marginTop: 2 }} />
                                    <Text className="flex-1 text-xs text-amber-700 dark:text-amber-400 leading-5">
                                        Tố cáo sai sự thật có thể ảnh hưởng đến uy tín của bạn. Chat logs sẽ được đính kèm tự động để Admin xem xét.
                                    </Text>
                                </View>

                                {/* Reason selection */}
                                <Text className="text-xs font-bold text-appText/50 uppercase mb-3">
                                    Chọn lý do tố cáo
                                </Text>

                                {REPORT_REASONS.map((reason) => (
                                    <TouchableOpacity
                                        key={reason.id}
                                        onPress={() => setSelectedReason(reason.id)}
                                        className={`flex-row items-center gap-3 p-4 mb-2 rounded-xl border ${selectedReason === reason.id
                                            ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700/50"
                                            : "bg-slate-50 dark:bg-slate-800/50 border-appText/10"
                                            }`}
                                    >
                                        <Ionicons
                                            name={reason.icon}
                                            size={20}
                                            color={selectedReason === reason.id ? "#EF4444" : "#64748B"}
                                        />
                                        <Text
                                            className={`flex-1 text-sm font-medium ${selectedReason === reason.id
                                                ? "text-red-600 dark:text-red-400"
                                                : "text-appText/70"
                                                }`}
                                        >
                                            {reason.label}
                                        </Text>
                                        <View
                                            className={`h-5 w-5 rounded-full border-2 items-center justify-center ${selectedReason === reason.id
                                                ? "border-red-500 bg-red-500"
                                                : "border-appText/20"
                                                }`}
                                        >
                                            {selectedReason === reason.id && (
                                                <Ionicons name="checkmark" size={12} color="white" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}

                                {/* Description */}
                                <Text className="text-xs font-bold text-appText/50 uppercase mt-5 mb-3">
                                    Mô tả chi tiết
                                </Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800/50 border border-appText/10 rounded-xl px-4 py-3 text-sm text-appText min-h-[100px]"
                                    placeholder="Mô tả chi tiết vi phạm để Admin có thể xem xét chính xác..."
                                    placeholderTextColor="#94A3B8"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    textAlignVertical="top"
                                    maxLength={500}
                                />
                                <Text className="text-[10px] text-appText/30 text-right mt-1">
                                    {description.length}/500
                                </Text>

                                {/* Submit */}
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={isSubmitting || !selectedReason || !description.trim()}
                                    className={`mt-6 py-4 rounded-xl items-center justify-center flex-row gap-2 ${isSubmitting || !selectedReason || !description.trim()
                                        ? "bg-slate-200 dark:bg-slate-700"
                                        : "bg-red-500 shadow-md shadow-red-500/30"
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="flag" size={18} color="white" />
                                            <Text className="text-white font-bold text-base">Gửi Tố Cáo</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Cancel */}
                                <TouchableOpacity
                                    onPress={handleClose}
                                    className="mt-3 py-3 rounded-xl items-center"
                                >
                                    <Text className="text-appText/50 font-medium">Hủy bỏ</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <ModalComponent />
        </>
    );
}

