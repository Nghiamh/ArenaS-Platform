import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

import HomeScreen from "../features/discovery/screens/HomeScreen";
import SearchResultScreen from "../features/discovery/screens/SearchResultScreen";
import CourtDetailScreen from "../features/booking/screens/CourtDetailScreen";
import ProfileScreen from "../features/discovery/screens/ProfileScreen";
import EditProfileScreen from "../features/discovery/screens/EditProfileScreen";
import WalletScreen from "../features/discovery/screens/WalletScreen";
import PaymentScreen from "../features/booking/screens/PaymentScreen";
import MapScreen from "../features/discovery/screens/MapScreen";
import MatchmakingScreen from "../features/discovery/screens/MatchmakingScreen";
import NotificationScreen from "../features/discovery/screens/NotificationScreen";
import UserSkillScreen from "../features/discovery/screens/UserSkillScreen";
import ChatScreen from "../features/discovery/screens/ChatScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                headerStyle: { backgroundColor: isDark ? "#08101F" : "#F5F7FA" },
                headerTintColor: isDark ? "#F5F7FA" : "#0F172A",
                tabBarStyle: {
                    backgroundColor: isDark ? "#111827" : "#FFFFFF",
                    borderTopColor: isDark ? "#1F2937" : "#E2E8F0"
                },
                tabBarActiveTintColor: isDark ? "#FFFFFF" : "#000000",
                tabBarInactiveTintColor: isDark ? "#94A3B8" : "#64748B",
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === "Trang chủ") {
                        iconName = focused ? "home" : "home-outline";
                    } else if (route.name === "Tìm Sân") {
                        iconName = focused ? "search" : "search-outline";
                    } else if (route.name === "Bản đồ") {
                        iconName = focused ? "map" : "map-outline";
                    } else if (route.name === "Ghép Kèo") {
                        iconName = focused ? "people" : "people-outline";
                    } else if (route.name === "Hồ sơ") {
                        iconName = focused ? "person" : "person-outline";
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Trang chủ" component={HomeScreen} />
            <Tab.Screen name="Tìm Sân" component={SearchResultScreen} />
            <Tab.Screen name="Bản đồ" component={MapScreen} />
            <Tab.Screen name="Ghép Kèo" component={MatchmakingScreen} />
            <Tab.Screen name="Hồ sơ" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function MainTab() {
    return (
        <Stack.Navigator 
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="BottomTabs" component={BottomTabs} />
            
            {/* These screens were previously hidden tabs, which caused context loss on re-render */}
            <Stack.Screen name="Đặt lịch" component={CourtDetailScreen} />
            <Stack.Screen name="Thanh toán" component={PaymentScreen} />
            <Stack.Screen name="Chỉnh sửa hồ sơ" component={EditProfileScreen} />
            <Stack.Screen name="Ví tiền" component={WalletScreen} />
            <Stack.Screen name="Thông báo" component={NotificationScreen} />
            <Stack.Screen name="Kỹ năng" component={UserSkillScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
    );
}
