import { Router } from "express";

import { newNotification, notifications, allNotificationsCount } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/new-notification", verifyJWT, asyncHandler(newNotification));
router.post("/notifications", verifyJWT, asyncHandler(notifications));
router.post("/all-notifications-count", verifyJWT, asyncHandler(allNotificationsCount));

export default router;
