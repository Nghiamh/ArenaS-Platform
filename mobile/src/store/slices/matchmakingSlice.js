import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./authSlice";

const initialState = {
    status: "IDLE", // IDLE, WAITING, MATCHED, CONFIRMED
    matchData: null,
    searchStartTime: null, // to calculate elapsed time
};

const matchmakingSlice = createSlice({
    name: "matchmaking",
    initialState,
    reducers: {
        setStatus: (state, action) => {
            state.status = action.payload;
            if (action.payload === "WAITING" && !state.searchStartTime) {
                state.searchStartTime = Date.now();
            } else if (action.payload === "IDLE") {
                state.searchStartTime = null;
                state.matchData = null;
            }
        },
        setMatchData: (state, action) => {
            state.matchData = action.payload;
        },
        resetMatchmaking: (state) => {
            state.status = "IDLE";
            state.matchData = null;
            state.searchStartTime = null;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(logout, () => {
            return initialState;
        });
    }
});

export const { setStatus, setMatchData, resetMatchmaking } = matchmakingSlice.actions;
export default matchmakingSlice.reducer;
