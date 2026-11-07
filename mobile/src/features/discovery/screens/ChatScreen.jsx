import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import chatApi from "../../../api/chatApi";
import bookingApi from "../../../api/bookingApi"; // vẫn cần cho opponentPayBooking
import { getSocket } from "../../../utils/socket";

export default function ChatScreen({ navigation, route }) {
    const { matchId, opponentName } = route?.params || {};
    const user = useSelector((state) => state.auth.user);
    const currentUserId = String(user?._id || user?.id);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [pendingDeposit, setPendingDeposit] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const flatListRef = useRef(null);
    const socketRef = useRef(null);
    const currentUserIdRef = useRef(currentUserId);
    const pendingOptIds = useRef(new Set());
    useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

    // ── Load chat history ────────────────────────────────
    useEffect(() => {
        if (!matchId) return;
        loadHistory(); // pending_deposit đã được trả về trong response của loadHistory
    }, [matchId]);

    const loadHistory = async () => {
        if (!matchId) { setIsLoading(false); return; }
        try {
            setIsLoading(true);
            const res = await chatApi.getHistory(matchId);
            const data = res.data;
            setMessages(data.messages || []);
            if (data.pending_deposit) {
                setPendingDeposit(data.pending_deposit);
            }
        } catch (err) {
            console.error("Load chat history error:", err);
            Alert.alert("Lỗi", "Không thể tải lịch sử chat.");
        } finally {
            setIsLoading(false);
        }
    };


    // ── Socket.IO real-time ──────────────────────────────
    useEffect(() => {
        if (!matchId) return;
        let socket;
        let mounted = true;

        const onReceiveMessage = (data) => {
            if (!mounted) return;
            setMessages((prev) => {
                // Tin này đã có rồi (dedup)
                if (prev.some((m) => m._id === data._id)) return prev;

                const senderId = typeof data.sender_id === 'object'
                    ? String(data.sender_id?._id || data.sender_id?.id || '')
                    : String(data.sender_id || '');

                if (senderId === currentUserIdRef.current) {
                    // Server confirm message của mình → xóa opt- của mình, thêm bản xác nhận
                    pendingOptIds.current.clear();
                    const filtered = prev.filter(m => !String(m._id).startsWith('opt-'));
                    return [...filtered, data];
                }
                // Message của đối thủ → chỉ append, không xóa opt- của mình
                return [...prev, data];
            });
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 80);
        };

        const onChatVoteUpdated = (data) => {
            // chat_vote_updated listener removed — delete chat feature removed
        };

        const onOpponentDeposit = (data) => {
            if (!mounted || data.matchId !== matchId) return;
            setPendingDeposit({
                bookingId: data.bookingId,
                amount: data.opponent_amount,
                deadline: data.deadline,
                courtName: data.courtName,
                date: data.date,
                start_time: data.start_time,
                end_time: data.end_time,
                total_price: data.total_price,
            });
        };

        const onCourtBooked = (data) => {
            if (!mounted) return;
            if (data.matchId === matchId && data.status === "confirmed") {
                setPendingDeposit(null);
            }
        };

        const onCourtCancelled = (data) => {
            if (!mounted) return;
            if (data.matchId === matchId) setPendingDeposit(null);
        };

        const onSocketError = (err) => {
            if (!mounted) return;
            console.warn("[Chat] Socket error:", err?.message || err);
            // Nếu có opt- message đang chờ xác nhận → xóa (gửi thất bại)
            if (pendingOptIds.current.size > 0) {
                setMessages(prev => prev.filter(m => !String(m._id).startsWith('opt-')));
                pendingOptIds.current.clear();
            }
        };

        const connectSocket = async () => {
            socket = await getSocket();
            if (!socket || !mounted) return;
            socketRef.current = socket;

            socket.emit("join_match_room", { matchId });
            socket.on("connect", () => socket.emit("join_match_room", { matchId }));
            socket.on("receive_message", onReceiveMessage);
            socket.on("chat_vote_updated", onChatVoteUpdated);
            socket.on("opponent_deposit_required", onOpponentDeposit);
            socket.on("court_booked", onCourtBooked);
            socket.on("court_cancelled", onCourtCancelled);
            socket.on("error", onSocketError);
        };

        connectSocket();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.emit("leave_match_room", { matchId });
                socketRef.current.off("connect");
                socketRef.current.off("receive_message", onReceiveMessage);
                socketRef.current.off("opponent_deposit_required", onOpponentDeposit);
                socketRef.current.off("court_booked", onCourtBooked);
                socketRef.current.off("court_cancelled", onCourtCancelled);
                socketRef.current.off("error", onSocketError);
            }
        };
    }, [matchId]);

    // ── Send message ─────────────────────────────────────
    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text || !socketRef.current) return;

        // Optimistic update — hiện ngay cho sender, không chờ server broadcast
        const optId = `opt-${Date.now()}`;
        const optimisticMsg = {
            _id: optId,
            sender_id: currentUserId,
            message: text,
            createdAt: new Date().toISOString(),
        };
        pendingOptIds.current.add(optId);
        setMessages(prev => [...prev, optimisticMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

        socketRef.current.emit("send_message", { matchId, message: text });
        setInputText("");

        // Fallback: nếu sau 4s socket không confirm → gọi REST để đảm bảo lưu DB
        setTimeout(async () => {
            if (!pendingOptIds.current.has(optId)) return; // đã được confirm
            try {
                const res = await chatApi.sendMessage(matchId, text);
                // REST thành công → replace opt- bằng message từ server
                const confirmed = res.data?.message;
                if (confirmed) {
                    setMessages(prev => {
                        if (prev.some(m => m._id === confirmed._id)) return prev;
                        const filtered = prev.filter(m => m._id !== optId);
                        return [...filtered, confirmed];
                    });
                }
                pendingOptIds.current.delete(optId);
            } catch {
                // REST cũng lỗi → xóa opt- (message gửi thất bại)
                setMessages(prev => prev.filter(m => m._id !== optId));
                pendingOptIds.current.delete(optId);
            }
        }, 4000);
    }, [inputText, matchId, currentUserId]);

    // ── Opponent pay 50% ─────────────────────────────────
    const handlePayDeposit = () => {
        if (!pendingDeposit?.bookingId) return;

        const amountStr = (pendingDeposit.amount || 0).toLocaleString("vi-VN");

        Alert.alert(
            "Thanh toán 50% còn lại",
            `Bạn sẽ thanh toán ${amountStr}đ từ ví để xác nhận đặt sân.\n\nSân: ${pendingDeposit.courtName || "Sân"}\nNgày: ${pendingDeposit.date || ""}\nGiờ: ${pendingDeposit.start_time || ""} - ${pendingDeposit.end_time || ""}`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Thanh toán",
                    onPress: async () => {
                        try {
                            setIsPaying(true);
                            await bookingApi.opponentPayBooking(pendingDeposit.bookingId);
                            setPendingDeposit(null);
                            Alert.alert("🎉 Thành công!", "Đã thanh toán thành công. Sân đã được xác nhận!");
                        } catch (err) {
                            const msg = err.response?.data?.error || "Không thể thanh toán. Vui lòng thử lại.";
                            Alert.alert("Lỗi", msg);
                        } finally {
                            setIsPaying(false);
                        }
                    },
                },
            ]
        );
    };

    // ── Vote to delete chat — REMOVED ──────────────────────────────

    // ── Format time ──────────────────────────────────────
    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    // ── Render a single message ──────────────────────────
    const renderMessage = useCallback(({ item }) => {
        const senderId = typeof item.sender_id === "object"
            ? String(item.sender_id._id || item.sender_id.id)
            : String(item.sender_id);
        const isMe = senderId === currentUserId;

        // Check if this is a system/booking message
        const isBookingMsg = item.message?.includes("đặt cọc 50%") || item.message?.includes("đã đặt sân") || item.message?.includes("thanh toán 50%");

        // Get sender name
        let senderName = isMe ? "Bạn" : (opponentName || "Đối thủ");
        if (!isMe && typeof item.sender_id === "object" && (item.sender_id.name || item.sender_id.userName)) {
            senderName = item.sender_id.name || item.sender_id.userName;
        }

        if (isBookingMsg) {
            return (
                <View className={`mb-3 px-4 ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                        <Text className="text-[10px] text-appText/40 mb-1 ml-1">
                            {senderName}
                        </Text>
                    )}
                    <View className={`max-w-[85%] px-4 py-3 border ${
                        isMe
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 rounded-2xl rounded-br-md"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 rounded-2xl rounded-bl-md"
                    }`}>
                        <View className="flex-row items-center gap-2 mb-1.5">
                            <Ionicons name="receipt-outline" size={13} color="#3B82F6" />
                            <Text className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                {isMe ? "Bạn" : senderName}
                            </Text>
                        </View>
                        <Text className="text-xs text-blue-800 dark:text-blue-300 leading-[18px]">
                            {item.message}
                        </Text>
                        <Text className="text-[10px] text-blue-400 dark:text-blue-500 mt-1.5 text-right">
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                </View>
            );
        }


        return (
            <View className={`mb-3 px-4 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                    <Text className="text-[10px] text-appText/40 mb-1 ml-1">
                        {senderName}
                    </Text>
                )}
                <View
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${isMe
                        ? "bg-emerald-500 rounded-br-md"
                        : "bg-white dark:bg-appSurface border border-appText/10 rounded-bl-md"
                        }`}
                >
                    <Text
                        className={`text-sm leading-5 ${isMe ? "text-white" : "text-appText"}`}
                    >
                        {item.message}
                    </Text>
                </View>
                <Text className="text-[10px] text-appText/30 mt-1 mx-1">
                    {formatTime(item.createdAt)}
                </Text>
            </View>
        );
    }, [currentUserId, opponentName]);

    // ── Pending deposit banner ────────────────────────────
    const renderDepositBanner = () => {
        if (!pendingDeposit) return null;

        const deadline = pendingDeposit.deadline ? new Date(pendingDeposit.deadline) : null;
        const formattedDeadline = deadline
            ? `${deadline.getHours().toString().padStart(2, "0")}:${deadline.getMinutes().toString().padStart(2, "0")} ${deadline.getDate()}/${deadline.getMonth() + 1}`
            : "";

        const amountStr = (pendingDeposit.amount || 0).toLocaleString("vi-VN");

        return (
            <View className="mx-4 mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl">
                <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="wallet-outline" size={18} color="#d97706" />
                    <Text className="font-bold text-amber-700 dark:text-amber-400 text-sm flex-1">
                        Cần thanh toán 50% còn lại
                    </Text>
                </View>
                <Text className="text-xs text-amber-600/80 dark:text-amber-400/70 mb-1">
                    Sân: {pendingDeposit.courtName || "Đang tải..."}
                </Text>
                <Text className="text-xs text-amber-600/80 dark:text-amber-400/70 mb-1">
                    Ngày: {pendingDeposit.date || ""} • Giờ: {pendingDeposit.start_time || ""} - {pendingDeposit.end_time || ""}
                </Text>
                <Text className="text-xs text-amber-600/80 dark:text-amber-400/70 mb-3">
                    Số tiền: <Text className="font-bold text-amber-700 dark:text-amber-400">{amountStr}đ</Text>
                    {formattedDeadline ? ` • Hạn: ${formattedDeadline}` : ""}
                </Text>
                <TouchableOpacity
                    onPress={handlePayDeposit}
                    disabled={isPaying}
                    className="bg-amber-500 py-3 rounded-xl items-center justify-center flex-row gap-2 shadow-md shadow-amber-500/30"
                >
                    {isPaying ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Ionicons name="card-outline" size={16} color="white" />
                            <Text className="text-white font-bold text-sm">
                                Thanh toán {amountStr}đ
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    // ── Main render ──────────────────────────────────────
    return (
        <KeyboardAvoidingView
            className="flex-1 bg-appBg"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pb-3 pt-12 bg-white dark:bg-appSurface border-b border-appText/5">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#059669" />
                </TouchableOpacity>
                <View className="items-center flex-1">
                    <Text className="text-base font-bold text-appText" numberOfLines={1}>
                        {opponentName || "Chat trận đấu"}
                    </Text>
                    <Text className="text-[10px] text-appText/40 mt-0.5">Đang hoạt động</Text>
                </View>
                {/* Trash button removed — delete chat feature removed */}
                <View className="w-10" />
            </View>

            {/* Deposit banner */}
            {renderDepositBanner()}

            {/* Messages */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#059669" />
                    <Text className="text-sm text-appText/50 mt-3">Đang tải tin nhắn...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => String(item._id)}
                    renderItem={renderMessage}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
                    contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center px-6">
                            <View className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center mb-4">
                                <Ionicons name="chatbubble-ellipses-outline" size={32} color="#059669" />
                            </View>
                            <Text className="text-base font-bold text-appText/50 text-center">
                                Bắt đầu cuộc trò chuyện!
                            </Text>
                            <Text className="text-sm text-appText/30 mt-2 text-center">
                                Hãy gửi tin nhắn đầu tiên để trao đổi với đối thủ.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Input bar */}
            <View className="flex-row items-end px-3 py-3 bg-white dark:bg-appSurface border-t border-appText/5">
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                "Đặt sân cho trận đấu 🏟️",
                                "Bạn sẽ đặt sân cho trận đấu này. Bạn có thể chọn chia tiền 50/50 với đối thủ hoặc thanh toán toàn bộ (100%).\n\nBạn sẽ được chuyển sang màn hình tìm sân — hãy chọn sân và khung giờ phù hợp.",
                                [
                                    { text: "Hủy", style: "cancel" },
                                    { text: "Chọn sân", onPress: () => navigation.navigate("BottomTabs", { screen: "Tìm Sân", params: { matchId } }) },
                                ]
                            );
                        }}
                        className="h-11 w-11 rounded-full items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 mr-2"
                    >
                        <Ionicons name="football-outline" size={20} color="#059669" />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 mr-2 text-sm text-appText max-h-24"
                        placeholder="Nhập tin nhắn..."
                        placeholderTextColor="#94A3B8"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim() || isSending}
                        style={{
                            height: 44,
                            width: 44,
                            borderRadius: 22,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: inputText.trim() ? '#10B981' : '#E2E8F0',
                            elevation: inputText.trim() ? 4 : 0,
                            shadowColor: inputText.trim() ? '#10B981' : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                        }}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons
                                name="send"
                                size={18}
                                color={inputText.trim() ? "white" : "#94A3B8"}
                            />
                        )}
                    </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
