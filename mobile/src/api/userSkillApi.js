import axiosClient from "./axiosClient";

const userSkillApi = {
    getCurrentUserSkills: () => axiosClient.get("/api/profile/skills"),
    createCurrentUserSkill: (data) => axiosClient.post("/api/profile/skills", data),
    updateCurrentUserSkill: (skillId, data) => axiosClient.put(`/api/profile/skills/${skillId}`, data),
    deleteCurrentUserSkill: (skillId) => axiosClient.delete(`/api/profile/skills/${skillId}`),
};

export default userSkillApi;
