import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, PanResponder } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import matchmakingApi from "../api/matchmakingApi";
import { setStatus, setMatchData } from "../store/slices/matchmakingSlice";

export default function MatchmakingOverlay({ currentRoute, navigationRef }) {
    const { status, searchStartTime } = useSelector(state => state.matchmaking);
    const dispatch = useDispatch();
    
    const isMatchmakingScreen = currentRoute === "Ghép Kèo" || currentRoute === "Chat";

    // Fetch initial status on mount
    useEffect(() => {
        checkStatus();
    }, []);

    // Polling logic
    useEffect(() => {
        let interval;
        if (status === "WAITING") {
            interval = setInterval(() => {
                checkStatus();
            }, 3000); // Polling 3s
        }
        return () => clearInterval(interval);
    }, [status]);

    const checkStatus = async () => {
        try {
            const res = await matchmakingApi.getStatus();
            if (res.data?.status === "WAITING") {
                dispatch(setStatus("WAITING"));
            } else if (res.data?.status === "MATCHED") {
                const match = res.data?.ticket?.match_id;
                if (match?.status === "CONFIRMED") {
                    dispatch(setStatus("CONFIRMED"));
                } else {
                    dispatch(setStatus("MATCHED"));
                }
                if (match) dispatch(setMatchData(match));
            } else {
                dispatch(setStatus("IDLE"));
            }
        } catch (err) {
            // console.log("Overlay check status error:", err);
        }
    };

    // Elapsed time calculation
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        let timer;
        if (status === "WAITING" && searchStartTime) {
            timer = setInterval(() => {
                setElapsed(Math.floor((Date.now() - searchStartTime) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(timer);
    }, [status, searchStartTime]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const pan = useRef(new Animated.ValueXY()).current;
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only start drag if moved more than 5px to avoid conflict with tap
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                pan.extractOffset();
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            }
        })
    ).current;

    if (status === "IDLE" || isMatchmakingScreen) {
        return null; // Don't show if idle or already on the matchmaking screen
    }

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                    position: 'absolute',
                    top: 100,
                    right: 16,
                    zIndex: 1000,
                    elevation: 10,
                }
            ]}
        >
            <TouchableOpacity 
                onPress={() => navigationRef?.navigate("BottomTabs", { screen: "Ghép Kèo" })}
                className="bg-white dark:bg-appSurface items-center justify-center border-2 border-emerald-500 shadow-lg shadow-black/20"
                style={{ width: 64, height: 64, borderRadius: 32 }}
                activeOpacity={0.8}
            >
                {/* Pulse dot indicator */}
                <View className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse border-2 border-white dark:border-appSurface z-10" />
                
                {/* Icon based on status */}
                <Ionicons 
                    name={status === "WAITING" ? "search" : status === "MATCHED" ? "people" : "checkmark-done"} 
                    size={22} 
                    color="#059669" 
                />
                
                {/* Short text or timer */}
                <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 text-center w-full px-1" numberOfLines={1}>
                    {status === "WAITING" ? formatTime(elapsed) : status === "MATCHED" ? "Đã thấy" : "Đã chốt"}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}
