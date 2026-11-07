import { forwardRef } from "react";
import { Text, TextInput, View } from "react-native";

const Input = forwardRef(function Input(
    { label, error, className = "", containerClassName = "", ...props },
    ref
) {
    return (
        <View className={containerClassName}>
            {label ? <Text className="mb-2 text-sm font-medium text-appText">{label}</Text> : null}
            <TextInput
                ref={ref}
                placeholderTextColor="#94A3B8"
                className={`min-h-[52px] rounded-2xl border border-white/10 bg-appSurface px-4 text-appText ${className}`}
                {...props}
            />
            {error ? <Text className="mt-2 text-xs text-red-400">{error}</Text> : null}
        </View>
    );
});

export default Input;
