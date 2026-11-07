import axiosClient from "./axiosClient";

const reviewApi = {
    // Lấy danh sách đánh giá của một sân
    getCourtReviews: (courtId) => {
        return axiosClient.get(`/api/reviews/court/${courtId}`);
    },

    // Kiểm tra xem người dùng có thể đánh giá sân này không
    checkCanReview: (courtId) => {
        return axiosClient.get(`/api/reviews/can-review/${courtId}`);
    },

    // Lấy đánh giá của chính mình tại sân này
    getMyReview: (courtId) => {
        return axiosClient.get(`/api/reviews/my-review/${courtId}`);
    },

    // Tạo mới đánh giá
    createReview: (data) => {
        return axiosClient.post("/api/reviews", data);
    },

    // Cập nhật đánh giá
    updateReview: (reviewId, data) => {
        return axiosClient.put(`/api/reviews/${reviewId}`, data);
    },

    // Xóa đánh giá
    deleteReview: (reviewId) => {
        return axiosClient.delete(`/api/reviews/${reviewId}`);
    },
};

export default reviewApi;
