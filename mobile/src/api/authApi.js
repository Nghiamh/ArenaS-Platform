import axiosClient from "./axiosClient";

const authApi = {
    login: (credentials) => {
        return axiosClient.post("/api/auth/login", credentials);
    },
    register: (data) => {
        return axiosClient.post("/api/auth/register", data);
    },
    forgotPassword: (data) => {
        return axiosClient.post("/api/auth/forgot-password", data);
    },
    getProfile: () => {
        return axiosClient.get("/api/profile/me");
    },
    updateProfile: (data) => {
        return axiosClient.put("/api/profile/me", data);
    },
    googleLogin: (data) => {
        return axiosClient.post("/api/auth/google", data);
    },
};

export default authApi;
