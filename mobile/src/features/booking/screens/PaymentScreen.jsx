import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Modal } from "react-native";
import { useAppModal } from "../../../components/AppModal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import bookingApi from "../../../api/bookingApi";
import walletApi from "../../../api/walletApi";
import voucherApi from "../../../api/voucherApi";
import { resetBooking } from "../../../store/slices/bookingSlice";

export default function PaymentScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const [selectedMethod, setSelectedMethod] = useState("wallet");
    const [isBooking, setIsBooking] = useState(false);
    const [matchPaymentMode, setMatchPaymentMode] = useState('split');

    // Wallet
    const [walletBalance, setWalletBalance] = useState(null);
    const [isLoadingWallet, setIsLoadingWallet] = useState(true);

    // Voucher
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [publicVouchers, setPublicVouchers] = useState([]);
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

    // Top-up Modal
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [serverQrUrl, setServerQrUrl] = useState(null);
    const [initialBalance, setInitialBalance] = useState(null);
    const [depositCode, setDepositCode] = useState("");
    const isValidAmount = depositAmount ? !isNaN(depositAmount) && Number(depositAmount) >= 10000 : false;

    const checkoutDraft = useSelector(state => state.booking.checkoutDraft);
    const user = useSelector(state => state.auth.user);

    // Fetch wallet balance
    useEffect(() => {
        walletApi.getWallet()
            .then(res => {
                const data = res.data;
                setWalletBalance(data?.balance ?? data?.wallet?.balance ?? 0);
            })
            .catch(() => setWalletBalance(0))
            .finally(() => setIsLoadingWallet(false));
    }, []);

    // Polling cho Nạp tiền
    useEffect(() => {
        let interval;
        if (showDepositModal && depositCode) {
            interval = setInterval(() => {
                walletApi.getWallet().then(res => {
                    if (res.data) {
                        const newBalance = res.data?.balance ?? res.data?.wallet?.balance ?? 0;
                        setWalletBalance(newBalance);
                        if (initialBalance !== null && newBalance > initialBalance) {
                            showModal({
                                type: "success",
                                title: "Nạp tiền thành công!",
                                message: `Đã nhận +${(newBalance - initialBalance).toLocaleString("vi-VN")}đ vào ví.`,
                            });
                            setShowDepositModal(false);
                        }
                    }
                }).catch(() => {});
            }, 5000);
        } else if (!showDepositModal) {
            setInitialBalance(null);
            setDepositCode("");
            setServerQrUrl(null);
            setDepositAmount("");
        }
        return () => clearInterval(interval);
    }, [showDepositModal, depositCode, initialBalance]);

    // Unlock slots khi user rời trang thanh toán mà chưa đặt
    const handleGoBack = async () => {
        if (checkoutDraft) {
            try {
                await bookingApi.unlockSlots({
                    court_id: checkoutDraft.courtId,
                    sub_court_id: checkoutDraft.subCourtId,
                    date: checkoutDraft.date,
                });
            } catch (e) { /* BE sẽ tự unlock sau timeout */ }
            dispatch(resetBooking());
        }
        navigation.canGoBack() ? navigation.goBack() : navigation.navigate("BottomTabs", { screen: "Trang chủ" });
    };

    if (!checkoutDraft) {
        return (
            <View className="flex-1 bg-[#F8FAFC] dark:bg-appBg items-center justify-center">
                <Text className="text-appText">Không có thông tin đặt sân</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 px-4 py-2 bg-emerald-600 rounded-lg">
                    <Text className="text-white">Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatPrice = (price) => (price || 0).toLocaleString("vi-VN") + "đ";
    const isMatchBooking = !!checkoutDraft.matchId;
    const discountAmount = appliedVoucher?.discountAmount || 0;
    const finalAmount = Math.max(0, checkoutDraft.totalPrice - discountAmount);
    // For match booking: user can pay 50% or 100%
    const chargedAmount = isMatchBooking ? (matchPaymentMode === 'split' ? Math.ceil(finalAmount / 2) : finalAmount) : finalAmount;

    // Validate voucher
    const handleValidateVoucher = async (code) => {
        const codeToUse = code || voucherCode;
        if (!codeToUse.trim()) return;
        try {
            setIsValidating(true);
            const res = await voucherApi.validate(codeToUse.trim(), checkoutDraft.totalPrice);
            setAppliedVoucher(res.data);
            setVoucherCode(codeToUse.trim());
            setShowVoucherModal(false);
        } catch (err) {
            const msg = err.response?.data?.message || "Mã voucher không hợp lệ";
            showModal({ type: "error", title: "Voucher không hợp lệ", message: msg });
            setAppliedVoucher(null);
        } finally {
            setIsValidating(false);
        }
    };

    // Fetch public vouchers
    const handleOpenVoucherModal = async () => {
        setShowVoucherModal(true);
        setIsLoadingVouchers(true);
        try {
            const res = await voucherApi.getPublic();
            setPublicVouchers(res.data?.vouchers || []);
        } catch { setPublicVouchers([]); }
        finally { setIsLoadingVouchers(false); }
    };

    // Payment
    const handlePayment = async () => {
        if (walletBalance !== null && walletBalance < chargedAmount) {
            setDepositAmount((chargedAmount - walletBalance).toString());
            setShowDepositModal(true);
            return;
        }
        try {
            setIsBooking(true);
            const data = {
                court_id: checkoutDraft.courtId,
                sub_court_id: checkoutDraft.subCourtId,
                date: checkoutDraft.date,
                start_time: checkoutDraft.startTime,
                end_time: checkoutDraft.endTime,
                voucher_code: appliedVoucher?.voucher?.code || undefined,
                ...(isMatchBooking ? { match_id: checkoutDraft.matchId, payment_type: matchPaymentMode } : {}),
            };
            await bookingApi.userBookCourt(data);
            showModal({
                type: "success",
                title: isMatchBooking && matchPaymentMode === 'split' ? "Đặt cọc thành công!" : "Đặt sân thành công!",
                message: isMatchBooking && matchPaymentMode === 'split'
                    ? "Bạn đã thanh toán 50%. Đợi đối thủ hoàn tất."
                    : "Tiền đã được trừ từ ví của bạn.",
                buttons: [
                    {
                        text: isMatchBooking ? "Về trang ghép kèo" : "Về trang chủ",
                        onPress: () => {
                            dispatch(resetBooking());
                            if (isMatchBooking) {
                                navigation.navigate("BottomTabs", { screen: "Ghép Kèo" });
                            } else {
                                navigation.navigate("BottomTabs", { screen: "Trang chủ" });
                            }
                        }
                    }
                ],
            });
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || "Có lỗi xảy ra khi đặt sân.";
            showModal({ type: "error", title: "Lỗi thanh toán", message: errorMessage });
        } finally {
            setIsBooking(false);
        }
    };

    const handleCreateDeposit = async () => {
        if (!isValidAmount) return;
        try {
            setIsGeneratingQR(true);
            const response = await walletApi.createDeposit(Number(depositAmount));
            if (response.data && response.data.transferCode) {
                setInitialBalance(walletBalance);
                setDepositCode(response.data.transferCode);
                setServerQrUrl(response.data.qrUrl);
            }
        } catch (error) {
            showModal({ type: "error", title: "Lỗi", message: "Không thể tạo mã nạp tiền. Vui lòng thử lại sau." });
        } finally {
            setIsGeneratingQR(false);
        }
    };

    return (
        <View className="flex-1 bg-[#F8FAFC] dark:bg-appBg">
            <View className="flex-row items-center justify-between px-4 pb-3 pt-12 bg-white dark:bg-appSurface border-b border-appText/5">
                <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#475569"} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-emerald-700 dark:text-emerald-500">Thanh toán</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" contentContainerClassName="px-4 pb-32 pt-5" showsVerticalScrollIndicator={false}>
                {/* Order Summary */}
                <Text className="text-base font-bold text-appText mb-3">Tóm tắt đơn hàng</Text>
                <View className="rounded-2xl bg-white dark:bg-appSurface p-4 shadow-sm shadow-black/5 border border-appText/5">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="h-14 w-14 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 items-center justify-center">
                            <MaterialCommunityIcons name="soccer-field" size={28} color="#059669" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-appText">{checkoutDraft.courtName}</Text>
                            <Text className="text-[11px] text-appText/60 mt-0.5">{checkoutDraft.subCourtName}</Text>
                        </View>
                    </View>
                    <View className="gap-2.5">
                        {/* Split-pay badge */}
                        {isMatchBooking && (
                            <View className="flex-row items-center gap-2 mb-1 px-1 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40">
                                <Ionicons name="people-outline" size={16} color="#D97706" />
                                <Text className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                    {matchPaymentMode === 'split' ? "Đặt sân chia tiền — bạn trả 50%" : "Đặt sân ghép kèo — bạn trả 100%"}
                                </Text>
                            </View>
                        )}
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-appText/60">Ngày</Text>
                            <Text className="text-sm font-bold text-appText">{new Date(checkoutDraft.date + 'T00:00:00').toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-appText/60">Thời gian</Text>
                            <Text className="text-sm font-bold text-appText">{checkoutDraft.startTime} - {checkoutDraft.endTime}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-appText/60">Giá sân</Text>
                            {appliedVoucher ? (
                                <Text className="text-sm font-bold text-appText/40 line-through">{formatPrice(checkoutDraft.totalPrice)}</Text>
                            ) : (
                                <Text className="text-sm font-bold text-appText">{formatPrice(checkoutDraft.totalPrice)}</Text>
                            )}
                        </View>
                        {appliedVoucher ? (
                            <>
                                <View className="flex-row justify-between">
                                    <Text className="text-sm text-emerald-600">Giảm giá ({appliedVoucher.voucher?.code})</Text>
                                    <Text className="text-sm font-bold text-emerald-600">-{formatPrice(discountAmount)}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-sm font-semibold text-appText">Sau giảm</Text>
                                    <Text className="text-sm font-bold text-emerald-600">{formatPrice(finalAmount)}</Text>
                                </View>
                            </>
                        ) : null}
                        <View className="h-px bg-appText/10 my-1" />
                        {isMatchBooking ? (
                            <>
                                <View className="flex-row justify-between">
                                    <Text className="text-sm text-appText/60">Tổng tiền sân</Text>
                                    <Text className="text-sm font-bold text-appText">{formatPrice(finalAmount)}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-sm font-bold text-amber-600">Bạn thanh toán ({matchPaymentMode === 'split' ? '50%' : '100%'})</Text>
                                    <Text className="text-base font-bold text-amber-600">{formatPrice(chargedAmount)}</Text>
                                </View>
                            </>
                        ) : (
                            <View className="flex-row justify-between">
                                <Text className="text-sm font-bold text-appText">Tổng cộng</Text>
                                <Text className="text-base font-bold text-emerald-600">{formatPrice(finalAmount)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {isMatchBooking && (
                    <View className="mt-6 mb-3">
                        <Text className="text-base font-bold text-appText mb-3">Hình thức thanh toán (Ghép kèo)</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity 
                                onPress={() => setMatchPaymentMode('split')}
                                className={`flex-1 rounded-xl p-3 border ${matchPaymentMode === 'split' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30' : 'bg-white dark:bg-appSurface border-appText/10'}`}
                            >
                                <View className="flex-row items-center gap-2 mb-1">
                                    <Ionicons name="pie-chart" size={18} color={matchPaymentMode === 'split' ? '#059669' : '#64748B'} />
                                    <Text className={`font-bold ${matchPaymentMode === 'split' ? 'text-emerald-700 dark:text-emerald-400' : 'text-appText/70'}`}>Chia tiền (50%)</Text>
                                </View>
                                <Text className="text-[10px] text-appText/50 leading-tight">Bạn trả 50%, đối thủ trả 50% còn lại.</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => setMatchPaymentMode('full')}
                                className={`flex-1 rounded-xl p-3 border ${matchPaymentMode === 'full' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30' : 'bg-white dark:bg-appSurface border-appText/10'}`}
                            >
                                <View className="flex-row items-center gap-2 mb-1">
                                    <Ionicons name="checkmark-circle" size={18} color={matchPaymentMode === 'full' ? '#059669' : '#64748B'} />
                                    <Text className={`font-bold ${matchPaymentMode === 'full' ? 'text-emerald-700 dark:text-emerald-400' : 'text-appText/70'}`}>Trả toàn bộ (100%)</Text>
                                </View>
                                <Text className="text-[10px] text-appText/50 leading-tight">Thanh toán luôn 100% tiền sân.</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <Text className="text-base font-bold text-appText mt-6 mb-3">Phương thức thanh toán</Text>
                <View className="gap-3">
                    <View className="flex-row items-center justify-between rounded-2xl p-4 bg-white dark:bg-appSurface border border-emerald-600 shadow-sm shadow-black/5">
                        <View className="flex-row items-center gap-3">
                            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                <MaterialCommunityIcons name="wallet-outline" size={20} color="#059669" />
                            </View>
                            <View>
                                <Text className="text-sm font-bold text-appText">Ví ArenaS</Text>
                                <Text className="text-[11px] text-appText/50 mt-0.5">{isLoadingWallet ? "Đang tải..." : `Số dư: ${formatPrice(walletBalance)}`}</Text>
                            </View>
                        </View>
                        <View className="h-5 w-5 rounded-full border items-center justify-center border-emerald-600">
                            <View className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                        </View>
                    </View>
                </View>

                {/* Voucher Section */}
                <Text className="text-base font-bold text-appText mt-6 mb-3">Mã khuyến mãi</Text>
                {appliedVoucher ? (
                    <View className="flex-row items-center justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
                        <View className="flex-row items-center gap-2 flex-1">
                            <MaterialCommunityIcons name="ticket-percent" size={20} color="#059669" />
                            <View className="flex-1">
                                <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{appliedVoucher.voucher?.code}</Text>
                                <Text className="text-[11px] text-emerald-600/70">Giảm {formatPrice(discountAmount)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => { setAppliedVoucher(null); setVoucherCode(""); }}>
                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="gap-3">
                        <View className="flex-row gap-2">
                            <TextInput
                                className="flex-1 rounded-xl bg-white dark:bg-appSurface border border-appText/10 px-4 py-3 text-sm text-appText"
                                placeholder="Nhập mã voucher..."
                                placeholderTextColor="#94A3B8"
                                value={voucherCode}
                                onChangeText={setVoucherCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                onPress={() => handleValidateVoucher()}
                                disabled={isValidating || !voucherCode.trim()}
                                className={`rounded-xl px-5 justify-center ${voucherCode.trim() ? 'bg-emerald-600' : 'bg-appText/20'}`}
                            >
                                {isValidating ? <ActivityIndicator size="small" color="white" /> : <Text className="text-sm font-bold text-white">Áp dụng</Text>}
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={handleOpenVoucherModal} className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400 py-3">
                            <MaterialCommunityIcons name="tag-multiple-outline" size={18} color="#059669" />
                            <Text className="text-sm font-semibold text-emerald-600">Xem mã khuyến mãi có sẵn</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Bottom bar */}
            <View className="absolute bottom-0 left-0 right-0 border-t border-appText/10 bg-[#F8FAFC] dark:bg-appBg px-5 py-4" style={{ paddingBottom: 24 }}>
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs font-semibold text-appText/60">
                        {isMatchBooking && matchPaymentMode === 'split' ? 'Số tiền đặt cọc (50%)' : 'Tổng thanh toán'}
                    </Text>
                    <Text className="text-xl font-bold text-appText">{formatPrice(chargedAmount)}</Text>
                </View>
                {walletBalance !== null && walletBalance < chargedAmount ? (
                    <TouchableOpacity 
                        onPress={() => {
                            setDepositAmount((chargedAmount - walletBalance).toString());
                            setShowDepositModal(true);
                        }}
                        className="rounded-xl py-3.5 shadow-md flex-row items-center justify-center bg-amber-500 shadow-amber-900/20"
                    >
                        <Text className="text-base font-bold text-white text-center">NẠP THÊM TIỀN ĐỂ ĐẶT</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        onPress={handlePayment}
                        disabled={isBooking}
                        className={`rounded-xl py-3.5 shadow-md flex-row items-center justify-center ${
                            isBooking ? 'bg-emerald-600/70' 
                            : isMatchBooking && matchPaymentMode === 'split' ? 'bg-amber-500 shadow-amber-900/20'
                            : 'bg-[#007F3F] dark:bg-emerald-700 shadow-emerald-900/20'
                        }`}
                    >
                        {isBooking ? <ActivityIndicator color="white" className="mr-2" /> : null}
                        <Text className="text-base font-bold text-white text-center">
                            {isMatchBooking && matchPaymentMode === 'split' ? 'ĐẶT CỌC 50% NGAY' : 'THANH TOÁN NGAY'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Voucher List Modal */}
            <Modal visible={showVoucherModal} transparent animationType="slide" onRequestClose={() => setShowVoucherModal(false)}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-slate-800 rounded-t-3xl max-h-[70%]">
                        <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-appText/10">
                            <Text className="text-lg font-bold text-appText">Chọn mã khuyến mãi</Text>
                            <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
                                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#333"} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="px-5 py-4" contentContainerClassName="gap-3 pb-8">
                            {isLoadingVouchers ? (
                                <ActivityIndicator size="large" color="#059669" className="my-8" />
                            ) : publicVouchers.length === 0 ? (
                                <Text className="text-center text-appText/50 py-8">Hiện không có mã khuyến mãi nào</Text>
                            ) : (
                                (() => {
                                    const userPoints = user?.points || 0;
                                    const sortedVouchers = [...publicVouchers].sort((a, b) => {
                                        const aNeedsPoints = a.pointsCost > 0;
                                        const bNeedsPoints = b.pointsCost > 0;
                                        const aEnoughPoints = userPoints >= (a.pointsCost || 0);
                                        const bEnoughPoints = userPoints >= (b.pointsCost || 0);

                                        const getRank = (v, needsPoints, enough) => {
                                            if (!needsPoints) return 1; // Miễn phí, dùng được ngay
                                            if (enough) return 2; // Cần điểm, đủ điểm đổi
                                            return 3; // Cần điểm, không đủ điểm
                                        };

                                        return getRank(a, aNeedsPoints, aEnoughPoints) - getRank(b, bNeedsPoints, bEnoughPoints);
                                    });

                                    return sortedVouchers.map(v => {
                                        const discountLabel = v.discountType === 'percent' ? `Giảm ${v.discountValue}%` : `Giảm ${(v.discountValue || 0).toLocaleString("vi-VN")}đ`;
                                        const minLabel = v.minOrderValue > 0 ? `Đơn tối thiểu ${(v.minOrderValue).toLocaleString("vi-VN")}đ` : "Không yêu cầu tối thiểu";
                                        const needsPoints = v.pointsCost > 0;
                                        const notEnoughPoints = needsPoints && userPoints < v.pointsCost;

                                        // Check all disqualifying conditions
                                        const isExpired = v.expiryDate && new Date(v.expiryDate) < new Date();
                                        const isFullyUsed = v.maxUses && v.usedCount >= v.maxUses;
                                        // A free voucher is already used if isUsedByMe is true
                                        const isAlreadyUsed = v.pointsCost === 0 && v.isUsedByMe === true;
                                        const belowMinOrder = v.minOrderValue > 0 && checkoutDraft?.totalPrice < v.minOrderValue;
                                        const isGrayedOut = notEnoughPoints || isExpired || isFullyUsed || isAlreadyUsed || belowMinOrder;

                                        // Determine reason
                                        let disabledReason = '';
                                        if (isExpired) disabledReason = 'Đã hết hạn';
                                        else if (isFullyUsed) disabledReason = 'Đã hết lượt dùng';
                                        else if (isAlreadyUsed) disabledReason = 'Đã sử dụng';
                                        else if (belowMinOrder) disabledReason = `Cần tối thiểu ${(v.minOrderValue).toLocaleString("vi-VN")}đ`;
                                        else if (notEnoughPoints) disabledReason = `Cần ${v.pointsCost} pts`;

                                        return (
                                            <TouchableOpacity
                                                key={v._id || v.code}
                                                onPress={async () => {
                                                        // Points voucher: phải redeem trước rồi mới validate
                                                        if (needsPoints && !v.isUsedByMe) {
                                                            try {
                                                                await voucherApi.redeem(v._id);
                                                                // Đổi điểm thành công, giờ validate
                                                                await handleValidateVoucher(v.code);
                                                            } catch (err) {
                                                                const msg = err.response?.data?.message || 'Không thể đổi voucher này';
                                                                showModal({ type: 'error', title: 'Lỗi', message: msg });
                                                            }
                                                        } else {
                                                            handleValidateVoucher(v.code);
                                                        }
                                                    }}
                                                disabled={isGrayedOut}
                                                className={`flex-row items-center rounded-2xl bg-appSurface border p-4 gap-3 ${isGrayedOut ? 'opacity-40 border-appText/5' : 'border-appText/5'}`}
                                            >
                                                <View className={`h-12 w-12 rounded-full items-center justify-center ${isGrayedOut ? 'bg-slate-200 dark:bg-slate-800' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                                                    <MaterialCommunityIcons name="ticket-percent" size={24} color={isGrayedOut ? "#94A3B8" : "#059669"} />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className={`text-sm font-bold ${isGrayedOut ? 'text-appText/40' : 'text-appText'}`}>{v.name || v.code}</Text>
                                                    <Text className={`text-xs font-semibold ${isGrayedOut ? 'text-appText/30' : 'text-emerald-600'}`}>{discountLabel}</Text>
                                                    <Text className="text-[10px] text-appText/50 mt-0.5">{minLabel} · HSD: {v.expiryDate ? new Date(v.expiryDate).toLocaleDateString("vi-VN") : 'Vô hạn'}</Text>
                                                    {isGrayedOut && disabledReason ? (
                                                        <Text className="text-[10px] text-red-400 font-bold mt-0.5">{disabledReason}</Text>
                                                    ) : null}
                                                </View>
                                                {isGrayedOut ? (
                                                    <View className="bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                                        <Ionicons name="close-circle-outline" size={16} color="#94A3B8" />
                                                    </View>
                                                ) : needsPoints ? (
                                                    <View className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                                                        <Text className="text-xs font-bold text-amber-600">{v.pointsCost} pts</Text>
                                                    </View>
                                                ) : (
                                                    <View className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                                                        <Text className="text-xs font-bold text-emerald-600">Dùng</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    });
                                })()
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Deposit Modal */}
            <Modal
                visible={showDepositModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDepositModal(false)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-white dark:bg-appBg rounded-t-3xl px-4 py-6 shadow-lg h-[80%]">
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
                                setDepositCode("");
                                setServerQrUrl(null);
                            }}
                            editable={!depositCode}
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
                                <Text className="font-bold text-emerald-600 text-center mb-4">{formatPrice(Number(depositAmount))}</Text>
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
                                    Vui lòng giữ nguyên nội dung chuyển khoản là mã giao dịch ở trên. Hệ thống sẽ tự động cập nhật số dư và quay lại màn hình thanh toán.
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
