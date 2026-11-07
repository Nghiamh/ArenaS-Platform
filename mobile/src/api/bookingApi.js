import axiosClient from "./axiosClient";

const bookingApi = {
    // 1. API Lấy danh sách Slot (Công khai)
    getCourtSlots: (courtId, date) => {
        return axiosClient.get(`/api/bookings/slots/${courtId}`, { params: { date } });
    },

    // 2. API Khóa slot tạm thời (khi user chọn slot)
    lockSlots: (data) => {
        return axiosClient.post("/api/bookings/lock-slots", data);
    },

    // 3. API Mở khóa slot
    unlockSlots: (data) => {
        return axiosClient.post("/api/bookings/unlock-slots", data);
    },

    // 4. API User đặt sân (tích hợp wallet)
    userBookCourt: (data) => {
        return axiosClient.post("/api/bookings/user-book", data);
    },

    // 5. API Lấy lịch sử booking của user
    getMyBookings: (params) => {
        return axiosClient.get("/api/bookings/my-bookings", { params });
    },

    // 6. API Hủy sân
    cancelBooking: (id) => {
        return axiosClient.post(`/api/bookings/${id}/cancel`);
    },

    // 7. API Đối thủ thanh toán 50% còn lại
    opponentPayBooking: (id) => {
        return axiosClient.post(`/api/bookings/${id}/opponent-pay`);
    },

    // 8. API Lấy thông tin pending deposit
    getMatchPendingDeposit: (matchId) => {
        return axiosClient.get(`/api/bookings/match/${matchId}/pending-deposit`);
    },
};

export default bookingApi;
