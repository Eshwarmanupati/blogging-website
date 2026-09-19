import { Router } from "express";

import {
    latestBlogs,
    allLatestBlogsCount,
    trendingBlogs,
    searchBlogs,
    searchBlogsCount,
    createBlog,
    getBlog,
    likeBlog,
    isLikedByUser,
    userWrittenBlogs,
    userWrittenBlogsCount,
    deleteBlog
} from "../controllers/blog.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.post("/latest-blogs", asyncHandler(latestBlogs));
router.post("/all-latest-blogs-count", asyncHandler(allLatestBlogsCount));
router.get("/trending-blogs", asyncHandler(trendingBlogs));
router.post("/search-blogs", asyncHandler(searchBlogs));
router.post("/search-blogs-count", asyncHandler(searchBlogsCount));
router.post("/get-blog", asyncHandler(getBlog));

router.post("/create-blog", verifyJWT, asyncHandler(createBlog));
router.post("/like-blog", verifyJWT, asyncHandler(likeBlog));
router.post("/isliked-by-user", verifyJWT, asyncHandler(isLikedByUser));
router.post("/user-written-blogs", verifyJWT, asyncHandler(userWrittenBlogs));
router.post("/user-written-blogs-count", verifyJWT, asyncHandler(userWrittenBlogsCount));
router.post("/delete-blog", verifyJWT, asyncHandler(deleteBlog));

export default router;
