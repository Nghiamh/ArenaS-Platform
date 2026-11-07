import axiosClient from "./axiosClient";

const chatApi = {
    /** GET /api/chat/:matchId/history?page=1&limit=50 */
    getHistory: (matchId, { page = 1, limit = 50 } = {}) =>
        axiosClient.get(`/api/chat/${matchId}/history`, { params: { page, limit } }),

    /** POST /api/chat/:matchId/send  — gửi message qua REST (fallback khi socket fail) */
    sendMessage: (matchId, message) =>
        axiosClient.post(`/api/chat/${matchId}/send`, { message }),
};

export default chatApi;
