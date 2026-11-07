import { io } from "socket.io-client";
import { getItem } from "./storage";
import { STORAGE_KEYS } from "../constants/config";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "https://arenas-miby.onrender.com";

let socketInstance = null;

/**
 * Get or create a singleton socket connection.
 * Authenticates with the stored JWT token.
 */
export async function getSocket() {
    if (socketInstance?.connected) {
        return socketInstance;
    }

    const token = await getItem(STORAGE_KEYS.authToken);
    if (!token) {
        console.warn("[Socket] No auth token found, cannot connect.");
        return null;
    }

    socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
    });

    socketInstance.on("connect", () => {
        console.log("[Socket] Connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
        console.warn("[Socket] Connection error:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
    });

    return socketInstance;
}

/**
 * Disconnect and cleanup the socket instance.
 */
export function disconnectSocket() {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
}
