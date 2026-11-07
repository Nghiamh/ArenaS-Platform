import { ActivityIndicator, Pressable, Text } from "react-native";

const variantClasses = {
    primary: "bg-appPrimary",
    secondary: "bg-appSurface border border-appPrimary",
    ghost: "bg-transparent",
};

const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-5 py-4",
};

export default function Button({
    title,
    onPress,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    className = "",
    textClassName = "",
}) {
    const isDisabled = disabled || loading;
    const textTone = variant === "secondary" || variant === "ghost" ? "text-appText" : "text-appBg";

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            className={`flex-row items-center justify-center rounded-2xl ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? "opacity-60" : "active:opacity-90"} ${className}`}
        >
            {loading ? <ActivityIndicator color={variant === "primary" ? "#08101F" : "#F5F7FA"} /> : null}
            {loading ? null : <Text className={`font-semibold ${textTone} ${textClassName}`}>{title}</Text>}
        </Pressable>
    );
}
