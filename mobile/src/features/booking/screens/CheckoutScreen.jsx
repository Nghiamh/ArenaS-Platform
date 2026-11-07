import { Text, View } from "react-native";

import Button from "../../../components/Button";
import { formatVND } from "../../../utils/formatVND";

export default function CheckoutScreen() {
    return (
        <View className="flex-1 bg-appBg px-6 py-8">
            <Text className="text-2xl font-bold text-appText">Checkout</Text>
            <Text className="mt-2 text-appText/70">Review booking, contact details, and payment summary.</Text>
            <Text className="mt-6 text-lg font-semibold text-appText">Total: {formatVND(250000)}</Text>
            <Button title="Confirm booking" className="mt-6" onPress={() => { }} />
        </View>
    );
}
