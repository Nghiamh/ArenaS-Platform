import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import courtApi from "../../api/courtApi";

// ── Async thunks ─────────────────────────────────────────
export const fetchCourts = createAsyncThunk(
    "venue/fetchCourts",
    async (params, { rejectWithValue }) => {
        try {
            const response = await courtApi.getPublic(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tải danh sách sân."
            );
        }
    }
);

export const fetchCourtById = createAsyncThunk(
    "venue/fetchCourtById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await courtApi.getById(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tải thông tin sân."
            );
        }
    }
);

// ── Slice ────────────────────────────────────────────────
const initialState = {
    venues: [],
    selectedVenue: null,
    searchQuery: "",
    filters: {
        sport: null,
        district: null,
        availableToday: false,
    },
    status: "idle", // idle | loading | succeeded | failed
    error: null,
};

const venueSlice = createSlice({
    name: "venue",
    initialState,
    reducers: {
        setVenues(state, action) {
            state.venues = action.payload || [];
        },
        setSelectedVenue(state, action) {
            state.selectedVenue = action.payload || null;
        },
        setSearchQuery(state, action) {
            state.searchQuery = action.payload || "";
        },
        setVenueFilters(state, action) {
            state.filters = { ...state.filters, ...(action.payload || {}) };
        },
        clearVenueError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchCourts
            .addCase(fetchCourts.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchCourts.fulfilled, (state, action) => {
                state.status = "succeeded";
                // BE có thể trả { data: [...] } hoặc trực tiếp [...]
                const payload = action.payload;
                state.venues = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.courts)
                            ? payload.courts
                            : [];
            })
            .addCase(fetchCourts.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Lỗi không xác định";
            })
            // fetchCourtById
            .addCase(fetchCourtById.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchCourtById.fulfilled, (state, action) => {
                state.status = "succeeded";
                const payload = action.payload;
                state.selectedVenue = payload?.data || payload?.court || payload || null;
            })
            .addCase(fetchCourtById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Lỗi không xác định";
            });
    },
});

export const { setVenues, setSelectedVenue, setSearchQuery, setVenueFilters, clearVenueError } = venueSlice.actions;
export default venueSlice.reducer;
