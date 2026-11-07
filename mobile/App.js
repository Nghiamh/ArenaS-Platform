import "react-native-gesture-handler";
import "./global.css";

import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { useColorScheme } from "nativewind";
import { useFonts } from "expo-font";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { store } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import MatchmakingOverlay from "./src/components/MatchmakingOverlay";
import { themeTokens } from "./src/constants/theme";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Disable Reanimated strict mode to hide "Writing to `value` during component render" 
// warnings caused by NativeWind v4 updating shared values during render.
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

export default function App() {
    // Explicitly load icon fonts — required for APK/production builds
    // (Expo Go pre-loads them, but standalone builds do not)
    const [fontsLoaded] = useFonts({
        ...Ionicons.font,
        ...MaterialCommunityIcons.font,
    });

    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const navigationRef = useNavigationContainerRef();
    const [currentRoute, setCurrentRoute] = useState("");
    const [isNavReady, setIsNavReady] = useState(false);

    // Show nothing (or splash) until icon fonts are ready
    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#08101F" : "#F5F7FA" }}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    const navigationTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: isDark ? themeTokens.dark.bg : themeTokens.light.bg,
            card: isDark ? themeTokens.dark.surface : themeTokens.light.surface,
            text: isDark ? themeTokens.dark.text : themeTokens.light.text,
            border: isDark ? "#1F2937" : "#E2E8F0",
            primary: isDark ? themeTokens.dark.primary : themeTokens.light.primary,
            notification: isDark ? themeTokens.dark.accent : themeTokens.light.accent,
        },
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <Provider store={store}>
                    <View style={{ flex: 1 }}>
                        <NavigationContainer 
                            theme={navigationTheme}
                            ref={navigationRef}
                            onReady={() => {
                                setCurrentRoute(navigationRef.getCurrentRoute()?.name);
                                setIsNavReady(true);
                            }}
                            onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
                        >
                            <StatusBar style={isDark ? "light" : "dark"} />
                            <AppNavigator />
                        </NavigationContainer>
                        {isNavReady && (
                            <MatchmakingOverlay currentRoute={currentRoute} navigationRef={navigationRef} />
                        )}
                    </View>
                </Provider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
