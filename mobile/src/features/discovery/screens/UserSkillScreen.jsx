import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput } from "react-native";
import { useAppModal } from "../../../components/AppModal";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import userSkillApi from "../../../api/userSkillApi";
import { useColorScheme } from "nativewind";

const SPORTS = [
    { id: "Bóng đá", icon: "football", emoji: "⚽", color: "#16a34a", bg: "#dcfce7", darkBg: "#14532d", gradient: ["#16a34a", "#15803d"] },
    { id: "Cầu lông", icon: "tennisball", emoji: "🏸", color: "#2563eb", bg: "#dbeafe", darkBg: "#1e3a8a", gradient: ["#2563eb", "#1d4ed8"] },
    { id: "Tennis", icon: "tennisball-outline", emoji: "🎾", color: "#d97706", bg: "#fef3c7", darkBg: "#78350f", gradient: ["#d97706", "#b45309"] },
    { id: "Pickleball", icon: "reload-circle", emoji: "🏓", color: "#7c3aed", bg: "#ede9fe", darkBg: "#4c1d95", gradient: ["#7c3aed", "#6d28d9"] },
];

const LEVELS = [
    { val: 1, label: "Mới chơi", desc: "Vừa bắt đầu làm quen" },
    { val: 2, label: "Cơ bản", desc: "Nắm được kỹ thuật cơ bản" },
    { val: 3, label: "Trung bình", desc: "Chơi ổn định, có kinh nghiệm" },
    { val: 4, label: "Khá", desc: "Kỹ thuật tốt, chiến thuật rõ" },
    { val: 5, label: "Chuyên nghiệp", desc: "Thi đấu giải, trình độ cao" },
];

const VIBES = [
    { id: "casual", emoji: "😄", label: "Xả stress", desc: "Vui vẻ, thoải mái là chính", color: "#16a34a" },
    { id: "balanced", emoji: "⚖️", label: "Cân bằng", desc: "Vừa vui vừa có tính đối kháng", color: "#2563eb" },
    { id: "competitive", emoji: "🔥", label: "Try-hard", desc: "Đá giải, thắng thua rõ ràng", color: "#dc2626" },
];

const FREQS = [
    { id: 1, emoji: "🌙", label: "Thỉnh thoảng", sub: "1–2 lần/tháng" },
    { id: 2, emoji: "☀️", label: "Bình thường", sub: "1–2 lần/tuần" },
    { id: 3, emoji: "⚡", label: "Cuồng thể thao", sub: "3+ lần/tuần" },
];

function getSportInfo(sport) {
    return SPORTS.find(s =>
        s.id === sport ||
        (sport === "football_5" && s.id === "Bóng đá") ||
        (sport === "badminton" && s.id === "Cầu lông") ||
        (sport === "tennis" && s.id === "Tennis") ||
        (sport === "pickleball" && s.id === "Pickleball")
    ) || SPORTS[0];
}

function getLevelInfo(val) {
    return LEVELS.find(l => l.val === val) || LEVELS[2];
}

function SkillCard({ skill, onPress, onDelete }) {
    const sport = getSportInfo(skill.sport);
    const levelVal = skill.skillLevel || skill.level || 3;
    const levelInfo = getLevelInfo(levelVal);
    const vibe = VIBES.find(v => v.id === skill.play_vibe) || VIBES[1];

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}
            className="mb-4 rounded-2xl overflow-hidden shadow-md shadow-black/10">
            <View style={{ backgroundColor: sport.color }} className="px-4 pt-4 pb-3">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="h-11 w-11 rounded-2xl items-center justify-center">
                            <Text style={{ fontSize: 22 }}>{sport.emoji}</Text>
                        </View>
                        <View>
                            <Text className="text-white font-black text-lg">{sport.id}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)' }} className="text-xs font-medium">{levelInfo.label}</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="rounded-full px-3 py-1">
                            <Text className="text-white text-xs font-bold">{vibe.emoji} {vibe.label}</Text>
                        </View>
                        <TouchableOpacity onPress={onDelete}
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            className="h-8 w-8 rounded-full items-center justify-center">
                            <Ionicons name="trash-outline" size={15} color="rgba(255,255,255,0.9)" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Level bar */}
                <View className="mb-1">
                    <View className="flex-row justify-between mb-1">
                        <Text style={{ color: 'rgba(255,255,255,0.7)' }} className="text-xs">Trình độ</Text>
                        <Text className="text-white text-xs font-bold">{levelVal}/5</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="h-2 rounded-full overflow-hidden">
                        <View className="h-full bg-white rounded-full" style={{ width: `${(levelVal / 5) * 100}%` }} />
                    </View>
                </View>

                {/* Stars row */}
                <View className="flex-row gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons key={s} name={s <= levelVal ? "star" : "star-outline"} size={14}
                            color={s <= levelVal ? "#FEF08A" : "rgba(255,255,255,0.4)"} />
                    ))}
                    {skill.note ? (
                        <Text style={{ color: 'rgba(255,255,255,0.6)' }} className="text-xs ml-2 flex-1" numberOfLines={1}>
                            · {skill.note}
                        </Text>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function UserSkillScreen() {
    const { showModal, ModalComponent } = useAppModal();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const navigation = useNavigation();

    const [skills, setSkills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [sport, setSport] = useState("Bóng đá");
    const [level, setLevel] = useState(3);
    const [playVibe, setPlayVibe] = useState("balanced");
    const [playFrequency, setPlayFrequency] = useState(2);
    const [note, setNote] = useState("");
    const [editingSkillId, setEditingSkillId] = useState(null);

    useEffect(() => { fetchSkills(); }, []);

    const fetchSkills = async () => {
        try {
            const res = await userSkillApi.getCurrentUserSkills();
            let arr = [];
            if (Array.isArray(res.data)) arr = res.data;
            else if (Array.isArray(res.data?.data)) arr = res.data.data;
            else if (Array.isArray(res.data?.skills)) arr = res.data.skills;
            setSkills(arr);
        } catch (_) { }
        finally { setIsLoading(false); }
    };

    const openAddModal = () => {
        setEditingSkillId(null); setSport("Bóng đá"); setLevel(3);
        setPlayVibe("balanced"); setPlayFrequency(2); setNote("");
        setIsModalVisible(true);
    };

    const openEditModal = (skill) => {
        setEditingSkillId(skill._id || skill.id);
        setSport(getSportInfo(skill.sport).id);
        setLevel(skill.level || 3);
        setPlayVibe(skill.play_vibe || "balanced");
        setPlayFrequency(skill.play_frequency || 2);
        setNote(skill.note || "");
        setIsModalVisible(true);
    };

    const handleSubmit = async () => {
        try {
            setIsSaving(true);
            const data = { sport, level, rating_score: level, play_vibe: playVibe, play_frequency: playFrequency, note: note.trim() };
            let targetId = editingSkillId;
            if (!targetId) {
                const existing = skills.find(s => getSportInfo(s.sport).id === sport);
                if (existing) targetId = existing._id || existing.id;
            }
            if (targetId) {
                await userSkillApi.updateCurrentUserSkill(targetId, data);
            } else {
                await userSkillApi.createCurrentUserSkill(data);
            }
            setIsModalVisible(false);
            fetchSkills();
        } catch (e) {
            showModal({ type: "error", title: "Lỗi", message: e.response?.data?.message || e.message });
        } finally { setIsSaving(false); }
    };

    const handleDelete = (skillId) => {
        showModal({
            type: "confirm",
            title: "Xóa kỹ năng",
            message: "Bạn chắc chắn muốn xóa kỹ năng này?",
            buttons: [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa", style: "destructive", onPress: async () => {
                        try { await userSkillApi.deleteCurrentUserSkill(skillId); fetchSkills(); }
                        catch (_) { showModal({ type: "error", title: "Lỗi", message: "Không thể xóa kỹ năng" }); }
                    }
                }
            ],
        });
    };

    const currentLevelInfo = getLevelInfo(level);

    return (
        <View className="flex-1 bg-appBg">

            {/* Header */}
            <View className="flex-row items-center px-4 pt-12 pb-3 border-b border-appText/10 bg-appSurface">
                <TouchableOpacity onPress={() => navigation.goBack()}
                    className="h-9 w-9 rounded-full bg-appBg items-center justify-center mr-3">
                    <Ionicons name="arrow-back" size={20} color={isDark ? '#fff' : '#111'} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-lg font-black text-appText">Kỹ năng của tôi</Text>
                    <Text className="text-xs text-appText/50">Giúp AI ghép đối thủ phù hợp hơn</Text>
                </View>
                <Text style={{ fontSize: 22 }}>🧠</Text>
            </View>

        <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false}>
            {/* Info banner */}
            <View className="flex-row items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-5">
                <Ionicons name="sparkles" size={20} color="#2563eb" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-xs text-blue-700 dark:text-blue-300 leading-5">
                    Khai báo chính xác giúp AI tìm đối thủ <Text className="font-bold">vừa sức</Text>. Trình độ sẽ được hệ thống tự điều chỉnh sau mỗi trận.
                </Text>
            </View>

            {isLoading ? (
                <View className="items-center py-16">
                    <ActivityIndicator size="large" color="#059669" />
                    <Text className="text-appText/50 text-sm mt-3">Đang tải kỹ năng...</Text>
                </View>
            ) : (
                <>
                    {skills.length > 0 ? (
                        <>
                            <Text className="text-sm font-bold text-appText/50 uppercase tracking-widest mb-3">Kỹ năng của bạn</Text>
                            {skills.map((skill, idx) => (
                                <SkillCard
                                    key={skill._id || idx}
                                    skill={skill}
                                    onPress={() => openEditModal(skill)}
                                    onDelete={() => handleDelete(skill._id || skill.id)}
                                />
                            ))}
                        </>
                    ) : (
                        <View className="items-center justify-center py-12">
                            <View className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center mb-4">
                                <Text style={{ fontSize: 44 }}>🏅</Text>
                            </View>
                            <Text className="text-appText font-bold text-lg mb-1">Chưa có kỹ năng nào</Text>
                            <Text className="text-appText/50 text-sm text-center px-8">
                                Khai báo kỹ năng để AI có thể ghép bạn với đối thủ phù hợp nhất!
                            </Text>
                        </View>
                    )}

                    {skills.length < 4 && (
                        <TouchableOpacity onPress={openAddModal} activeOpacity={0.85} className="mb-8"
                            style={{
                                backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16,
                                alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8
                            }}>
                            <Ionicons name="add-circle" size={22} color="white" />
                            <Text className="text-white font-black text-base">Thêm kỹ năng mới</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
            <View className="h-6" />
        </ScrollView>

            {/* Modal */ }
    <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
            <View className="bg-appBg rounded-t-3xl" style={{ height: '92%' }}>
                {/* Modal Handle */}
                <View className="items-center pt-3 pb-1">
                    <View className="h-1 w-10 rounded-full bg-appText/20" />
                </View>

                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-5 py-3 border-b border-appText/8">
                    <TouchableOpacity onPress={() => setIsModalVisible(false)}
                        className="h-9 w-9 rounded-full bg-appSurface items-center justify-center">
                        <Ionicons name="close" size={20} color={isDark ? "#fff" : "#000"} />
                    </TouchableOpacity>
                    <Text className="text-base font-black text-appText">
                        {editingSkillId ? "Chỉnh sửa kỹ năng" : "Khai báo kỹ năng"}
                    </Text>
                    <View className="w-9" />
                </View>

                <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {/* Step 1: Sport */}
                    <View className="mt-5 mb-5">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className="h-6 w-6 rounded-full bg-emerald-600 items-center justify-center">
                                <Text className="text-white text-xs font-black">1</Text>
                            </View>
                            <Text className="text-base font-bold text-appText">Môn thể thao</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                            {SPORTS.map((s) => (
                                <TouchableOpacity key={s.id} onPress={() => setSport(s.id)} activeOpacity={0.8}
                                    style={sport === s.id ? { backgroundColor: s.color } : {}}
                                    className={`flex-row items-center gap-2 px-4 py-2.5 rounded-2xl border ${sport === s.id ? "border-transparent" : "border-appText/15 bg-appSurface"
                                        }`}>
                                    <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
                                    <Text className={`font-bold text-sm ${sport === s.id ? "text-white" : "text-appText"}`}>{s.id}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Step 2: Level */}
                    <View className="mb-5">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className="h-6 w-6 rounded-full bg-emerald-600 items-center justify-center">
                                <Text className="text-white text-xs font-black">2</Text>
                            </View>
                            <Text className="text-base font-bold text-appText">Trình độ kinh nghiệm</Text>
                        </View>

                        {/* Selected level display */}
                        <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-3">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-emerald-700 dark:text-emerald-400 font-black text-lg">{currentLevelInfo.label}</Text>
                                <View className="flex-row gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Ionicons key={s} name={s <= level ? "star" : "star-outline"} size={16}
                                            color={s <= level ? "#F59E0B" : "#CBD5E1"} />
                                    ))}
                                </View>
                            </View>
                            <Text className="text-emerald-600/70 dark:text-emerald-500 text-xs">{currentLevelInfo.desc}</Text>
                        </View>

                        <View className="gap-2">
                            {LEVELS.map((l) => (
                                <TouchableOpacity key={l.val} onPress={() => setLevel(l.val)} activeOpacity={0.8}
                                    className={`flex-row items-center gap-3 p-3 rounded-xl border ${level === l.val
                                            ? "bg-amber-50 border-amber-400 dark:bg-amber-900/20 dark:border-amber-600"
                                            : "bg-appSurface border-appText/10"
                                        }`}>
                                    <View className="flex-row gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Ionicons key={s} name={s <= l.val ? "star" : "star-outline"} size={13}
                                                color={s <= l.val ? "#F59E0B" : "#CBD5E1"} />
                                        ))}
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`text-sm font-bold ${level === l.val ? "text-amber-700 dark:text-amber-400" : "text-appText"}`}>{l.label}</Text>
                                        <Text className="text-xs text-appText/50">{l.desc}</Text>
                                    </View>
                                    {level === l.val && <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Step 3: Vibe */}
                    <View className="mb-5">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className="h-6 w-6 rounded-full bg-emerald-600 items-center justify-center">
                                <Text className="text-white text-xs font-black">3</Text>
                            </View>
                            <Text className="text-base font-bold text-appText">Phong cách chơi</Text>
                        </View>
                        <View className="gap-2">
                            {VIBES.map((v) => (
                                <TouchableOpacity key={v.id} onPress={() => setPlayVibe(v.id)} activeOpacity={0.8}
                                    className={`flex-row items-center gap-3 p-4 rounded-xl border ${playVibe === v.id ? "border-transparent" : "bg-appSurface border-appText/10"
                                        }`}
                                    style={playVibe === v.id ? { backgroundColor: v.color + "18", borderColor: v.color + "60", borderWidth: 1 } : {}}>
                                    <Text style={{ fontSize: 24 }}>{v.emoji}</Text>
                                    <View className="flex-1">
                                        <Text className="font-bold text-appText text-sm">{v.label}</Text>
                                        <Text className="text-appText/50 text-xs mt-0.5">{v.desc}</Text>
                                    </View>
                                    {playVibe === v.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={v.color} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Step 4: Frequency */}
                    <View className="mb-5">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className="h-6 w-6 rounded-full bg-emerald-600 items-center justify-center">
                                <Text className="text-white text-xs font-black">4</Text>
                            </View>
                            <Text className="text-base font-bold text-appText">Tần suất chơi</Text>
                        </View>
                        <View className="flex-row gap-2">
                            {FREQS.map((f) => (
                                <TouchableOpacity key={f.id} onPress={() => setPlayFrequency(f.id)} activeOpacity={0.8}
                                    className={`flex-1 py-4 rounded-2xl items-center border ${playFrequency === f.id
                                            ? "bg-emerald-600 border-emerald-600"
                                            : "bg-appSurface border-appText/10"
                                        }`}>
                                    <Text style={{ fontSize: 20 }}>{f.emoji}</Text>
                                    <Text className={`text-xs font-bold mt-1 text-center ${playFrequency === f.id ? "text-white" : "text-appText"}`}>{f.label}</Text>
                                    <Text className={`text-[10px] text-center mt-0.5 ${playFrequency === f.id ? "text-white/70" : "text-appText/40"}`}>{f.sub}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Step 5: Note */}
                    <View className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className="h-6 w-6 rounded-full bg-appText/20 items-center justify-center">
                                <Text className="text-appText text-xs font-black">5</Text>
                            </View>
                            <Text className="text-base font-bold text-appText">Ghi chú <Text className="text-appText/40 font-normal text-sm">(tuỳ chọn)</Text></Text>
                        </View>
                        <TextInput
                            className="w-full bg-appSurface border border-appText/10 rounded-2xl p-4 text-appText"
                            placeholder="Ví dụ: Sở trường đá cánh trái, thuận tay phải..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            textAlignVertical="top"
                            style={{ minHeight: 80 }}
                            value={note}
                            onChangeText={setNote}
                        />
                    </View>
                    <View className="h-4" />
                </ScrollView>

                {/* Save button */}
                <View className="px-5 pb-8 pt-3 border-t border-appText/8 bg-appBg">
                    <TouchableOpacity onPress={handleSubmit} disabled={isSaving} activeOpacity={0.85}
                        style={{
                            backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16,
                            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
                            opacity: isSaving ? 0.7 : 1
                        }}>
                        {isSaving
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Ionicons name="checkmark-circle" size={20} color="white" />
                        }
                        <Text className="text-white font-black text-base">
                            {isSaving ? "Đang lưu..." : "Lưu kỹ năng"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        </Modal>
        <ModalComponent />
        </View>
    );
}
