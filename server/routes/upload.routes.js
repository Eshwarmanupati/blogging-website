import { Router } from "express";

import { getUploadSignature } from "../controllers/upload.controller.js";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();

router.get("/get-upload-url", verifyJWT, getUploadSignature);

export default router;
