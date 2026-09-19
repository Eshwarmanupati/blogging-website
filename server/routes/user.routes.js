import { Router } from "express";

import { searchUsers, getProfile, updateProfileImg, updateProfile } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.post("/search-users", asyncHandler(searchUsers));
router.post("/get-profile", asyncHandler(getProfile));

router.post("/update-profile-img", verifyJWT, asyncHandler(updateProfileImg));
router.post("/update-profile", verifyJWT, asyncHandler(updateProfile));

export default router;
