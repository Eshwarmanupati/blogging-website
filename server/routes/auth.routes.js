import { Router } from "express";

import { signup, signin, googleAuth, changePassword } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/signin", asyncHandler(signin));
router.post("/google-auth", asyncHandler(googleAuth));
router.post("/change-password", verifyJWT, asyncHandler(changePassword));

export default router;
