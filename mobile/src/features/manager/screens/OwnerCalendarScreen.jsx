import { Text, View } from "react-native";

export default function OwnerCalendarScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-appBg px-6">
            <Text className="text-2xl font-bold text-appText">Owner calendar</Text>
            <Text className="mt-2 text-center text-appText/70">Manage recurring blocks, maintenance windows, and special events.</Text>
        </View>
    );
}
