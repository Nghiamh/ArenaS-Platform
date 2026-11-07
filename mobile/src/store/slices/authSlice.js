import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../api/authApi";

// ── Async thunks ─────────────────────────────────────────
export const fetchUserProfile = createAsyncThunk(
    "auth/fetchUserProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.getProfile();
            // Assuming response.data contains the profile object
            return response.data?.profile || response.data?.user || response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tải thông tin cá nhân."
            );
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    "auth/updateUserProfile",
    async (data, { rejectWithValue }) => {
        try {
            const response = await authApi.updateProfile(data);
            return response.data?.profile || response.data?.user || response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Cập nhật thất bại."
            );
        }
    }
);

const initialState = {
    user: null,
    token: null,
    isGuest: false,
    status: "idle",
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials(state, action) {
            state.user = action.payload?.user || null;
            state.token = action.payload?.token || null;
            state.isGuest = false;
            state.status = "authenticated";
            state.error = null;
        },
        setGuestMode(state) {
            state.user = {
                id: "guest",
                name: "Khách",
            };
            state.token = null;
            state.isGuest = true;
            state.status = "guest";
            state.error = null;
        },
        setAuthLoading(state) {
            state.status = "loading";
            state.error = null;
        },
        setAuthError(state, action) {
            state.status = "error";
            state.error = action.payload || "Authentication failed";
        },
        logout() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                // We don't want to override authenticated status, so maybe just set a flag if needed
                // But for now, we can just rely on the UI to handle loading via component state or tracking
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.user = { ...state.user, ...action.payload };
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                // If profile fetch fails (e.g. 401), we might want to log out or just show error
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.user = { ...state.user, ...action.payload };
            });
    },
});

export const { setCredentials, setGuestMode, setAuthLoading, setAuthError, logout } = authSlice.actions;
export default authSlice.reducer;
