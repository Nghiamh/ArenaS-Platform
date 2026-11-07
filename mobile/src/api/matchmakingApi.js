import axiosClient from "./axiosClient";

const matchmakingApi = {
    joinQueue: (data) => axiosClient.post("/api/matchmaking/join", data),
    cancelQueue: () => axiosClient.post("/api/matchmaking/cancel"),
    // data: { sport, longitude, latitude, courtId }
    getStatus: () => axiosClient.get("/api/matchmaking/status"),
    acceptMatch: (matchId) => axiosClient.post(`/api/matchmaking/match/${matchId}/accept`),
    declineMatch: (matchId) => axiosClient.post(`/api/matchmaking/match/${matchId}/decline`),
    checkInMatch: (matchId) => axiosClient.post(`/api/matchmaking/match/${matchId}/check-in`),
    completeMatch: (matchId) => axiosClient.post(`/api/matchmaking/match/${matchId}/complete`),
    submitFeedback: (matchId, data) => axiosClient.post(`/api/matchmaking/match/${matchId}/feedback`, data),
    reportOpponent: (matchId, data) => axiosClient.post(`/api/matchmaking/match/${matchId}/report`, data),
};

export default matchmakingApi;
