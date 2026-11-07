import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { updateUserProfile } from "../../../store/slices/authSlice";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function EditProfileScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || user.userName || "");
            setAvatarUrl(user.avatarUrl || user.avatar || user.profilePicture || "");
            setPhone(user.phone || "");
            setAddress(user.address || "");
            // BE returns ISO string like 2000-01-01T00:00:00.000Z, get the YYYY-MM-DD part
            setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : "");
        }
    }, [user]);



    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tên hiển thị");
            return;
        }

        setIsLoading(true);
        try {
            const updateData = { 
                name: name.trim(), 
                avatarUrl: avatarUrl.trim(),
                phone: phone.trim(),
                address: address.trim(),
            };
            if (dateOfBirth.trim()) {
                updateData.dateOfBirth = dateOfBirth.trim();
            }
            await dispatch(updateUserProfile(updateData)).unwrap();
            Alert.alert("Thành công", "Cập nhật thông tin thành công!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert("Lỗi", error || "Có lỗi xảy ra khi cập nhật thông tin");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-appBg">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-12 pb-4 bg-appSurface border-b border-appText/10">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-appText">Chỉnh sửa hồ sơ</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading} className="p-2 -mr-2">
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#059669" />
                    ) : (
                        <Text className="text-emerald-600 font-bold text-base">Lưu</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-6" keyboardShouldPersistTaps="handled">
                {/* Avatar Section */}
                <View className="items-center mb-8">
                    <View className="relative">
                        <Image
                            source={{ uri: avatarUrl || "https://i.pravatar.cc/150?img=11" }}
                            className="h-24 w-24 rounded-full bg-slate-200"
                        />
                        <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-emerald-600 border-2 border-appBg">
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </View>
                    <Text className="mt-3 text-xs text-appText/40">Chạm vào ảnh để thay đổi (Sắp ra mắt)</Text>
                </View>

                {/* Info Section */}
                <View className="gap-5">
                    <View>
                        <Text className="text-sm font-semibold text-appText/80 mb-2 ml-1">Tên hiển thị</Text>
                        <TextInput
                            className="w-full rounded-xl bg-appSurface border border-appText/10 px-4 py-3 text-appText text-base"
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor="#94A3B8"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-appText/80 mb-2 ml-1">Số điện thoại</Text>
                        <TextInput
                            className="w-full rounded-xl bg-appSurface border border-appText/10 px-4 py-3 text-appText text-base"
                            placeholder="Nhập số điện thoại"
                            placeholderTextColor="#94A3B8"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-appText/80 mb-2 ml-1">Địa chỉ</Text>
                        <TextInput
                            className="w-full rounded-xl bg-appSurface border border-appText/10 px-4 py-3 text-appText text-base"
                            placeholder="Nhập địa chỉ"
                            placeholderTextColor="#94A3B8"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-appText/80 mb-2 ml-1">Ngày sinh</Text>
                        <TouchableOpacity 
                            onPress={() => setShowDatePicker(true)}
                            className="w-full rounded-xl bg-appSurface border border-appText/10 px-4 py-3"
                        >
                            <Text className={`text-base ${dateOfBirth ? 'text-appText' : 'text-appText/40'}`}>
                                {dateOfBirth || "Chọn ngày sinh"}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                                mode="date"
                                display="spinner"
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) {
                                        // Adjust timezone offset locally if needed, or just format
                                        const year = selectedDate.getFullYear();
                                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                        const day = String(selectedDate.getDate()).padStart(2, '0');
                                        setDateOfBirth(`${year}-${month}-${day}`);
                                    }
                                }}
                            />
                        )}
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-appText/80 mb-2 ml-1">Email</Text>
                        <TextInput
                            className="w-full rounded-xl bg-appSurface border border-appText/10 px-4 py-3 text-appText/50 text-base"
                            value={user?.email || "Chưa cập nhật email"}
                            editable={false}
                        />
                        <Text className="mt-1 ml-1 text-xs text-appText/40">Email không thể thay đổi</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
