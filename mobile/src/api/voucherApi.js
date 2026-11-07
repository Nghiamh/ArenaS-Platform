import axiosClient from "./axiosClient";

const voucherApi = {
    getPublic: () => {
        return axiosClient.get("/api/vouchers/public");
    },
    validate: (code, orderValue) => {
        return axiosClient.post("/api/vouchers/validate", { code, orderValue });
    },
    redeem: (voucherId) => {
        return axiosClient.post("/api/vouchers/redeem", { voucherId });
    },
};

export default voucherApi;
