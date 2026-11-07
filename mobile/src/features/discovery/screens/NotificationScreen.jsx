import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import notificationApi from "../../../api/notificationApi";

export default function NotificationScreen() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getMyNotifications();
            setNotifications(res.data?.data || res.data || []);
        } catch (error) {
            console.log("Error fetching notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.log("Error marking all read:", error);
        }
    };

    const handleRead = React.useCallback(async (id) => {
        try {
            await notificationApi.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.log("Error marking read:", error);
        }
    }, []);

    const renderItem = React.useCallback(({ item }) => (
        <TouchableOpacity 
            onPress={() => handleRead(item._id)}
            className={`p-4 border-b border-appText/5 flex-row gap-3 ${item.isRead ? 'bg-appBg' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}
        >
            <View className={`h-12 w-12 rounded-full items-center justify-center ${item.isRead ? 'bg-slate-200 dark:bg-slate-800' : 'bg-emerald-200 dark:bg-emerald-700'}`}>
                <Ionicons name="notifications" size={24} color={item.isRead ? "#94A3B8" : "#059669"} />
            </View>
            <View className="flex-1">
                <Text className={`text-base ${item.isRead ? 'text-appText/70' : 'text-appText font-bold'}`}>{item.title}</Text>
                <Text className="text-sm text-appText/60 mt-1">{item.message}</Text>
                <Text className="text-xs text-appText/40 mt-2">{new Date(item.createdAt).toLocaleString("vi-VN")}</Text>
            </View>
        </TouchableOpacity>
    ), [handleRead]);

    return (
        <View className="flex-1 bg-appBg">
            <View className="flex-row items-center justify-between px-4 pb-3 pt-12 bg-white dark:bg-appSurface border-b border-appText/5">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#059669" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-emerald-700 dark:text-emerald-500">Thông báo</Text>
                <TouchableOpacity onPress={handleMarkAllRead} className="p-2 -mr-2">
                    <Ionicons name="checkmark-done-circle-outline" size={24} color="#059669" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : notifications.length === 0 ? (
                <View className="flex-1 justify-center items-center p-6">
                    <Ionicons name="notifications-off-outline" size={60} color="#94A3B8" />
                    <Text className="text-appText/50 mt-4 text-center">Bạn chưa có thông báo nào</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
                    renderItem={renderItem}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
                />
            )}
        </View>
    );
}
