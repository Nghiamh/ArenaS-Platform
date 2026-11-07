import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedCourt: null,
    selectedSlot: null,
    checkoutDraft: null,
    status: "idle",
    error: null,
};

const bookingSlice = createSlice({
    name: "booking",
    initialState,
    reducers: {
        setSelectedCourt(state, action) {
            state.selectedCourt = action.payload || null;
        },
        setSelectedSlot(state, action) {
            state.selectedSlot = action.payload || null;
        },
        setCheckoutDraft(state, action) {
            state.checkoutDraft = action.payload || null;
        },
        resetBooking() {
            return initialState;
        },
    },
});

export const { setSelectedCourt, setSelectedSlot, setCheckoutDraft, resetBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
