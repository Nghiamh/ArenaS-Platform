import axios from "axios";

import { API_BASE_URL, STORAGE_KEYS } from "../constants/config";
import { getItem, removeItem } from "../utils/storage";

// Import store lazily to avoid circular dependency
let _store = null;
export function injectStore(store) {
    _store = store;
}

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 12000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

axiosClient.interceptors.request.use(
    async (config) => {
        const token = await getItem(STORAGE_KEYS.authToken);

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error?.response?.status === 401) {
            // 1) Xóa token khỏi storage
            await removeItem(STORAGE_KEYS.authToken);
            // 2) Dispatch logout vào Redux → AppNavigator tự chuyển về AuthStack
            if (_store) {
                const { logout } = await import("../store/slices/authSlice");
                _store.dispatch(logout());
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
