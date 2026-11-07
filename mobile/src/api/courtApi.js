import axiosClient from "./axiosClient";

const courtApi = {
    /**
     * Lấy danh sách sân công khai (cho user tìm & đặt sân)
     * GET /api/courts/public
     */
    getPublic: (params) => {
        return axiosClient.get("/api/courts/public", { params });
    },

    /**
     * Lấy danh sách sân của owner (cần quyền owner)
     * GET /api/courts
     */
    getAll: (params) => {
        return axiosClient.get("/api/courts", { params });
    },

    /**
     * Lấy chi tiết 1 sân theo ID
     * GET /api/courts/:id
     */
    getById: (id) => {
        return axiosClient.get(`/api/courts/public/${id}`);
    },

    /**
     * Tìm kiếm sân
     * GET /api/courts/search?keyword=...
     */
    search: (query) => {
        return axiosClient.get("/api/courts/search", { params: query });
    },
};

export default courtApi;
