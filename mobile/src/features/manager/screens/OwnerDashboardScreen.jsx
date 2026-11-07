import { Text, View } from "react-native";

export default function OwnerDashboardScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-appBg px-6">
            <Text className="text-2xl font-bold text-appText">Owner dashboard</Text>
            <Text className="mt-2 text-center text-appText/70">Surface occupancy, revenue, quick actions, and venue health metrics here.</Text>
        </View>
    );
}
