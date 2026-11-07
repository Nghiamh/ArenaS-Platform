import axiosClient from "./axiosClient";

const notificationApi = {
    getMyNotifications: () => axiosClient.get("/api/notifications"),
    getUnreadCount: () => axiosClient.get("/api/notifications/unread-count"),
    markAllNotificationsRead: () => axiosClient.put("/api/notifications/read-all"),
    markNotificationRead: (id) => axiosClient.put(`/api/notifications/${id}/read`),
};

export default notificationApi;
