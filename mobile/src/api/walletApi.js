import axiosClient from "./axiosClient";

const walletApi = {
    getWallet: () => {
        return axiosClient.get("/api/wallet");
    },
    createDeposit: (amount) => {
        return axiosClient.post("/api/payment/deposit", { amount });
    }
};

export default walletApi;
