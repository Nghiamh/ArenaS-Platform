/**
 * AppModal – Custom modal thay thế Alert.alert toàn app ArenaS.
 *
 * Cách dùng:
 *   const { showModal, ModalComponent } = useAppModal();
 *   showModal({ type: 'success'|'error'|'warning'|'info'|'confirm', title, message, buttons });
 *   // Render <ModalComponent /> ở cuối JSX của screen.
 */
import React, { useState, useRef, useCallback } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// ── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
    success: { bg: "#007F3F", light: "#E8F5EE", icon: "checkmark-circle", tint: "#22C55E" },
    error:   { bg: "#DC2626", light: "#FEF2F2", icon: "close-circle",     tint: "#EF4444" },
    warning: { bg: "#D97706", light: "#FFFBEB", icon: "warning",           tint: "#F59E0B" },
    info:    { bg: "#0EA5E9", light: "#F0F9FF", icon: "information-circle", tint: "#38BDF8" },
    confirm: { bg: "#475569", light: "#F8FAFC", icon: "help-circle",       tint: "#64748B" },
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useAppModal() {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState({
        type: "info",
        title: "",
        message: "",
        buttons: [],
    });
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const showModal = useCallback(({ type = "info", title, message, buttons }) => {
        setConfig({ type, title, message, buttons: buttons || [{ text: "OK" }] });
        setVisible(true);
        scaleAnim.setValue(0.85);
        opacityAnim.setValue(0);
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 200 }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start();
    }, [scaleAnim, opacityAnim]);

    const hideModal = useCallback((onPress) => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            setVisible(false);
            if (onPress) onPress();
        });
    }, [scaleAnim, opacityAnim]);

    const ModalComponent = useCallback(() => {
        const palette = COLORS[config.type] || COLORS.info;
        const isConfirm = config.type === "confirm";

        return (
            <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
                <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                    <Animated.View
                        style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
                    >
                        {/* Icon header */}
                        <View style={[styles.iconWrap, { backgroundColor: palette.light }]}>
                            <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
                                <Ionicons name={palette.icon} size={28} color="#fff" />
                            </View>
                        </View>

                        {/* Accent bar */}
                        <View style={[styles.accentBar, { backgroundColor: palette.tint }]} />

                        {/* Content */}
                        <View style={styles.content}>
                            <Text style={styles.title}>{config.title}</Text>
                            {!!config.message && (
                                <Text style={styles.message}>{config.message}</Text>
                            )}
                        </View>

                        {/* Buttons */}
                        <View style={[styles.btnRow, isConfirm && styles.btnRowMulti]}>
                            {config.buttons.map((btn, i) => {
                                const isDestructive = btn.style === "destructive";
                                const isCancel = btn.style === "cancel";
                                const isPrimary = !isCancel && !isDestructive;

                                return (
                                    <TouchableOpacity
                                        key={i}
                                        activeOpacity={0.82}
                                        style={[
                                            styles.btn,
                                            isConfirm && styles.btnFlex,
                                            isPrimary && { backgroundColor: palette.bg },
                                            isCancel && styles.btnCancel,
                                            isDestructive && styles.btnDestructive,
                                        ]}
                                        onPress={() => hideModal(btn.onPress)}
                                    >
                                        <Text
                                            style={[
                                                styles.btnText,
                                                isCancel && styles.btnTextCancel,
                                                isDestructive && styles.btnTextDestructive,
                                            ]}
                                        >
                                            {btn.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        );
    }, [visible, config, scaleAnim, opacityAnim, hideModal]);

    return { showModal, ModalComponent };
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    card: {
        width: width * 0.84,
        maxWidth: 360,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
    },
    iconWrap: {
        alignItems: "center",
        paddingTop: 28,
        paddingBottom: 12,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    accentBar: {
        height: 3,
        marginHorizontal: 24,
        borderRadius: 2,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 8,
        alignItems: "center",
    },
    title: {
        fontSize: 17,
        fontWeight: "800",
        color: "#0F172A",
        textAlign: "center",
        letterSpacing: -0.3,
    },
    message: {
        marginTop: 8,
        fontSize: 13.5,
        color: "#475569",
        textAlign: "center",
        lineHeight: 20,
    },
    btnRow: {
        padding: 16,
        gap: 10,
    },
    btnRowMulti: {
        flexDirection: "row",
    },
    btn: {
        alignSelf: "stretch",
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: "center",
    },
    btnFlex: {
        flex: 1,
    },
    btnCancel: {
        backgroundColor: "#F1F5F9",
    },
    btnDestructive: {
        backgroundColor: "#FEF2F2",
    },
    btnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    btnTextCancel: {
        color: "#64748B",
    },
    btnTextDestructive: {
        color: "#DC2626",
    },
});
