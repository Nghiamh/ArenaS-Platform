import { ActivityIndicator, View } from "react-native";

export default function Loading({ fullScreen = false, color = "#FFB703" }) {
    return (
        <View className={fullScreen ? "flex-1 items-center justify-center" : "items-center justify-center py-4"}>
            <ActivityIndicator size="large" color={color} />
        </View>
    );
}
