import { Router } from "express";
import {
	createCurrentUserSkill,
	deleteCurrentUserSkill,
	getCurrentUserSkills,
	updateCurrentUserSkill,
} from "../controllers/userSkillController.js";

const userSkillRoutes = Router();

userSkillRoutes.get("/", getCurrentUserSkills);
userSkillRoutes.post("/", createCurrentUserSkill);
userSkillRoutes.put("/:skillId", updateCurrentUserSkill);
userSkillRoutes.delete("/:skillId", deleteCurrentUserSkill);

export default userSkillRoutes;