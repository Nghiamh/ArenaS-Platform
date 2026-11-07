import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Image, ActivityIndicator } from "react-native";
import { useAppModal } from "../../../components/AppModal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import walletApi from "../../../api/walletApi";

export default function WalletScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const navigation = useNavigation();

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal Nạp tiền bằng VietQR
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");

    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [serverQrUrl, setServerQrUrl] = useState(null);
    
    // Lưu số dư ban đầu để so sánh khi nạp tiền
    const [initialBalance, setInitialBalance] = useState(null);
    const [depositCode, setDepositCode] = useState("");
    const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);

    const isValidAmount = depositAmount ? !isNaN(depositAmount) && Number(depositAmount) >= 10000 : false;

    useEffect(() => {
        fetchWalletData();
    }, []);

    // Polling: Tự động kiểm tra số dư mỗi 5 giây khi đang hiển thị QR (chờ SEPay webhook)
    useEffect(() => {
        let interval;
        if (showDepositModal && depositCode) {
            interval = setInterval(() => {
                fetchWalletData(true); // Fetch ngầm không hiển thị loading quay vòng
            }, 5000);
        } else if (!showDepositModal) {
            setInitialBalance(null);
            setDepositCode(""); // Xóa mã khi đóng modal
            setServerQrUrl(null);
            setDepositAmount("");
        }
        return () => clearInterval(interval);
    }, [showDepositModal, depositCode]);

    const fetchWalletData = async (isSilent = false) => {
        try {
            if (!isSilent) setIsLoading(true);
            const response = await walletApi.getWallet();
            if (response.data) {
                const newBalance = response.data.wallet.balance;
                
                // Nếu đang mở modal nạp tiền, có mã và số dư tăng lên -> Báo thành công và đóng modal
                if (showDepositModal && depositCode && initialBalance !== null && newBalance > initialBalance) {
                    showModal({
                        type: "success",
                        title: "Nạp tiền thành công!",
                        message: `Hệ thống đã nhận được +${formatCurrency(newBalance - initialBalance)} vào ví của bạn.`,
                    });
                    setShowDepositModal(false);
                }
                
                setBalance(newBalance);
                setTransactions(response.data.transactions || []);
            }
        } catch (error) {
            console.error("Failed to fetch wallet:", error);
            if (!isSilent) showModal({ type: "error", title: "Lỗi", message: "Không thể tải thông tin ví" });
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    };

    const handleCreateDeposit = async () => {
        if (!isValidAmount) return;
        try {
            setIsGeneratingQR(true);
            const response = await walletApi.createDeposit(Number(depositAmount));
            if (response.data && response.data.transferCode) {
                setInitialBalance(balance);
                setDepositCode(response.data.transferCode);
                setServerQrUrl(response.data.qrUrl);
            }
        } catch (error) {
            showModal({ type: "error", title: "Lỗi", message: "Không thể tạo mã nạp tiền. Vui lòng thử lại sau." });
            console.error("Create deposit error:", error);
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    };

    return (
        <View className="flex-1 bg-appBg">
            <View className="flex-row items-center justify-between px-4 pt-12 pb-4 bg-emerald-600">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-white">Ví của tôi</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-4 py-6">
                <View className="rounded-2xl bg-emerald-600 p-6 shadow-md shadow-emerald-900/20 items-center justify-center relative overflow-hidden">
                    <View className="absolute top-[-20px] right-[-20px] opacity-10">
                        <Ionicons name="wallet" size={120} color="#FFFFFF" />
                    </View>
                    <Text className="text-emerald-50 font-medium text-sm mb-2">Số dư hiện tại</Text>
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="large" className="my-2" />
                    ) : (
                        <Text className="text-white font-bold text-4xl tracking-tight">
                            {formatCurrency(balance)}
                        </Text>
                    )}

                    <View className="flex-row items-center justify-center mt-8 gap-6 w-full">
                        <TouchableOpacity
                            onPress={() => setShowDepositModal(true)}
                            className="items-center"
                        >
                            <View className="h-12 w-12 rounded-full bg-white/20 items-center justify-center mb-2">
                                <Ionicons name="arrow-down-outline" size={24} color="#FFFFFF" />
                            </View>
                            <Text className="text-white text-xs font-medium">Nạp tiền</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="mt-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-bold text-appText">Giao dịch gần đây</Text>
                        {transactions.length > 5 && (
                            <TouchableOpacity onPress={() => setShowAllTransactionsModal(true)}>
                                <Text className="text-emerald-600 text-sm font-semibold">Xem tất cả</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View className="py-10 items-center justify-center">
                            <ActivityIndicator size="large" color="#059669" />
                        </View>
                    ) : transactions.length > 0 ? (
                        transactions.slice(0, 5).map((tx) => (
                            <View
                                key={tx.id}
                                className="flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-appSurface border border-appText/5 shadow-sm shadow-black/5"
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className={`h-10 w-10 rounded-full items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                        <Ionicons
                                            name={tx.type === 'deposit' ? "arrow-down" : "arrow-up"}
                                            size={20}
                                            color={tx.type === 'deposit' ? "#10B981" : "#EF4444"}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-appText font-medium text-base">
                                            {tx.type === 'deposit' ? 'Nạp tiền' : 'Thanh toán'}
                                        </Text>
                                        <Text className="text-appText/50 text-xs mt-0.5">
                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : ""}
                                        </Text>
                                    </View>
                                </View>
                                <Text className={`font-bold text-base ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-appText'}`}>
                                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View className="items-center justify-center py-10 bg-appSurface rounded-2xl border border-appText/5 border-dashed">
                            <Ionicons name="receipt-outline" size={48} color={isDark ? "#475569" : "#CBD5E1"} />
                            <Text className="text-appText/50 mt-2 text-sm">Chưa có giao dịch nào</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={showAllTransactionsModal}
                animationType="slide"
                onRequestClose={() => setShowAllTransactionsModal(false)}
            >
                <View className="flex-1 bg-appBg">
                    <View className="flex-row items-center px-4 pt-12 pb-4 bg-emerald-600">
                        <TouchableOpacity onPress={() => setShowAllTransactionsModal(false)} className="p-2 -ml-2">
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-white ml-2">Lịch sử giao dịch</Text>
                    </View>
                    <ScrollView className="flex-1 px-4 py-4">
                        {transactions.map((tx) => (
                            <View
                                key={tx.id}
                                className="flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-appSurface border border-appText/5 shadow-sm shadow-black/5"
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className={`h-10 w-10 rounded-full items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                        <Ionicons
                                            name={tx.type === 'deposit' ? "arrow-down" : "arrow-up"}
                                            size={20}
                                            color={tx.type === 'deposit' ? "#10B981" : "#EF4444"}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-appText font-medium text-base">
                                            {tx.type === 'deposit' ? 'Nạp tiền' : 'Thanh toán'}
                                        </Text>
                                        <Text className="text-appText/50 text-xs mt-0.5">
                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : ""}
                                        </Text>
                                    </View>
                                </View>
                                <Text className={`font-bold text-base ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-appText'}`}>
                                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </Text>
                            </View>
                        ))}
                        <View className="h-10" />
                    </ScrollView>
                </View>
            </Modal>

            <Modal
                visible={showDepositModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDepositModal(false)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-appBg rounded-t-3xl px-4 py-6 shadow-lg h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-appText">Nạp tiền vào ví</Text>
                            <TouchableOpacity onPress={() => setShowDepositModal(false)} className="p-2 bg-appSurface rounded-full">
                                <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm font-semibold text-appText/80 mb-2">Nhập số tiền cần nạp (VNĐ)</Text>
                        <TextInput
                            className="w-full rounded-2xl bg-appSurface border border-appText/10 px-4 py-4 text-appText text-lg font-bold text-center"
                            placeholder="Tối thiểu 10,000 đ"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={depositAmount}
                            onChangeText={(text) => {
                                setDepositAmount(text);
                                setDepositCode(""); // Reset QR khi thay đổi số tiền
                                setServerQrUrl(null);
                            }}
                            editable={!depositCode} // Khóa nhập khi đã có mã QR
                        />

                        {!depositCode ? (
                            <TouchableOpacity
                                onPress={handleCreateDeposit}
                                disabled={!isValidAmount || isGeneratingQR}
                                className={`mt-6 py-4 rounded-2xl items-center justify-center ${isValidAmount && !isGeneratingQR ? "bg-emerald-600" : "bg-emerald-600/50"}`}
                            >
                                {isGeneratingQR ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text className="text-white font-bold text-base">Tạo mã QR Nạp Tiền</Text>
                                )}
                            </TouchableOpacity>
                        ) : null}

                        {Boolean(serverQrUrl) ? (
                            <View className="mt-8 items-center flex-1">
                                <Text className="text-sm text-appText/70 text-center mb-2">Quét mã QR dưới đây bằng ứng dụng ngân hàng để nạp</Text>
                                <Text className="font-bold text-emerald-600 text-center mb-4">{formatCurrency(depositAmount)}</Text>
                                <View className="bg-white p-4 rounded-3xl shadow-sm mb-4">
                                    <Image
                                        source={{ uri: serverQrUrl }}
                                        className="w-64 h-64"
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text className="text-sm text-appText font-semibold text-center mb-1">
                                    Mã giao dịch: <Text className="text-emerald-600">{depositCode}</Text>
                                </Text>
                                <Text className="text-xs text-appText/40 text-center mt-2 px-4">
                                    Vui lòng giữ nguyên nội dung chuyển khoản là mã giao dịch ở trên. Hệ thống sẽ tự động cập nhật số dư.
                                </Text>
                            </View>
                        ) : (
                            <View className="mt-8 flex-1 items-center justify-center opacity-50">
                                <Ionicons name="qr-code-outline" size={80} color="#94A3B8" />
                                <Text className="text-sm text-appText/60 mt-4 text-center">
                                    Mã QR sẽ hiển thị sau khi bạn nhập số tiền
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
            <ModalComponent />
        </View>
    );
}
