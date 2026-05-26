import { Router } from "express";
import {
	createCurrentUserSkill,
	deleteCurrentUserSkill,
	getCurrentUserSkills,
	updateCurrentUserSkill,
} from "../controllers/userSkillController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const userSkillRoutes = Router();
const userRole = requireRole({
	role: "user",
	error: "skills_disabled_for_role",
	message: "skills are only available for regular users",
});

userSkillRoutes.get("/", requireAuth, userRole, getCurrentUserSkills);
userSkillRoutes.post("/", requireAuth, userRole, createCurrentUserSkill);
userSkillRoutes.put("/:skillId", requireAuth, userRole, updateCurrentUserSkill);
userSkillRoutes.delete("/:skillId", requireAuth, userRole, deleteCurrentUserSkill);

export default userSkillRoutes;