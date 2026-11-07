import { Modal, Pressable, Text, View } from "react-native";

import Button from "../../../components/Button";

export default function QuickLockModal({ visible, onClose, onConfirm }) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 items-center justify-center bg-black/60 px-6">
                <View className="w-full rounded-3xl bg-appSurface p-5">
                    <Text className="text-xl font-bold text-appText">Quick lock slot</Text>
                    <Text className="mt-2 text-appText/70">Temporarily block a court for maintenance or private use.</Text>

                    <View className="mt-5 flex-row gap-3">
                        <Button title="Cancel" variant="secondary" className="flex-1" onPress={onClose} />
                        <Button title="Confirm" className="flex-1" onPress={onConfirm} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
