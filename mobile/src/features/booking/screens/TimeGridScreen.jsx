import { Text, View } from "react-native";

export default function TimeGridScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-appBg px-6">
            <Text className="text-2xl font-bold text-appText">Time grid</Text>
            <Text className="mt-2 text-center text-appText/70">Render an hourly schedule with blocked, locked, and available slots.</Text>
        </View>
    );
}
