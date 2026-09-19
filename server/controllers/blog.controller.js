import { nanoid } from "nanoid";

import Blog from "../Schema/Blog.js";
import User from "../Schema/User.js";
import Notification from "../Schema/Notification.js";
import Comment from "../Schema/Comment.js";

const MAX_LIMIT = 5;

const AUTHOR_FIELDS = "personal_info.profile_img personal_info.username personal_info.fullname -_id";

/* Builds the mongo query shared by the search page and its matching count route. */
const buildSearchQuery = ({ tag, query, author, eliminate_blog }) => {
    if (tag) {
        const findQuery = { tags: tag, draft: false };

        // The "similar blogs" strip on a blog page excludes the post you are reading.
        if (eliminate_blog) {
            findQuery.blog_id = { $ne: eliminate_blog };
        }

        return findQuery;
    }

    if (query) {
        return { draft: false, title: new RegExp(query, "i") };
    }

    if (author) {
        return { author, draft: false };
    }

    return { draft: false };
};

export const latestBlogs = async (req, res) => {
    const { page = 1 } = req.body;

    const blogs = await Blog.find({ draft: false })
        .populate("author", AUTHOR_FIELDS)
        .sort({ publishedAt: -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * MAX_LIMIT)
        .limit(MAX_LIMIT);

    return res.status(200).json({ blogs });
};

export const allLatestBlogsCount = async (req, res) => {
    const count = await Blog.countDocuments({ draft: false });

    return res.status(200).json({ totalDocs: count });
};

export const trendingBlogs = async (req, res) => {
    const blogs = await Blog.find({ draft: false })
        .populate("author", AUTHOR_FIELDS)
        .sort({ "activity.total_reads": -1, "activity.total_likes": -1, publishedAt: -1 })
        .select("blog_id title publishedAt -_id")
        .limit(MAX_LIMIT);

    return res.status(200).json({ blogs });
};

export const searchBlogs = async (req, res) => {
    const { page = 1, limit, eliminate_blog } = req.body;

    const findQuery = buildSearchQuery(req.body);
    const maxLimit = limit || 2;

    const blogs = await Blog.find(findQuery)
        .populate("author", AUTHOR_FIELDS)
        .sort({ publishedAt: -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit);

    return res.status(200).json({ blogs });
};

export const searchBlogsCount = async (req, res) => {
    const findQuery = buildSearchQuery(req.body);

    const count = await Blog.countDocuments(findQuery);

    return res.status(200).json({ totalDocs: count });
};

export const createBlog = async (req, res) => {
    const authorId = req.user;

    let { title, des, banner, tags, content, draft, id } = req.body;

    if (!title || !title.length) {
        return res.status(403).json({ error: "You must provide a title" });
    }

    if (!draft) {
        if (!des || !des.length || des.length > 200) {
            return res.status(403).json({ error: "You must provide a description under 200 characters" });
        }

        if (!banner || !banner.length) {
            return res.status(403).json({ error: "You must provide a banner to publish a blog" });
        }

        if (!content || !content.blocks || !content.blocks.length) {
            return res.status(403).json({ error: "There must be some blog content to publish" });
        }

        if (!tags || !tags.length || tags.length > 10) {
            return res.status(403).json({ error: "Provide between 1 and 10 tags in order to publish" });
        }
    }

    tags = (tags || []).map((tag) => tag.toLowerCase());

    /*
        The editor reuses this route to update an existing post, in which case the
        client sends back the blog_id it is editing.
    */
    if (id) {
        const existing = await Blog.findOne({ blog_id: id });

        if (!existing) {
            return res.status(404).json({ error: "Blog not found" });
        }

        if (existing.author.toString() !== authorId) {
            return res.status(403).json({ error: "You can only edit your own blogs" });
        }

        await Blog.findOneAndUpdate(
            { blog_id: id },
            { title, des, banner, content, tags, draft: Boolean(draft) }
        );

        return res.status(200).json({ id });
    }

    const blog_id =
        title
            .replace(/[^a-zA-Z0-9]/g, " ")
            .replace(/\s+/g, "-")
            .trim()
            .toLowerCase() +
        "-" +
        nanoid(8);

    const blog = new Blog({
        title,
        des,
        banner,
        content,
        tags,
        author: authorId,
        blog_id,
        draft: Boolean(draft)
    });

    const saved = await blog.save();

    const incrementVal = draft ? 0 : 1;

    await User.findOneAndUpdate(
        { _id: authorId },
        { $inc: { "account_info.total_posts": incrementVal }, $push: { blogs: saved._id } }
    );

    return res.status(200).json({ id: saved.blog_id });
};

export const getBlog = async (req, res) => {
    const { blog_id, draft, mode } = req.body;

    // Opening a blog in the editor should not inflate its read count.
    const incrementVal = mode === "edit" ? 0 : 1;

    // `new: true` so the response carries the incremented count, not the stale one.
    const blog = await Blog.findOneAndUpdate(
        { blog_id },
        { $inc: { "activity.total_reads": incrementVal } },
        { new: true }
    )
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .select("title des content banner activity publishedAt blog_id tags draft");

    if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.draft && !draft) {
        return res.status(500).json({ error: "You cannot access a draft blog" });
    }

    await User.findOneAndUpdate(
        { "personal_info.username": blog.author.personal_info.username },
        { $inc: { "account_info.total_reads": incrementVal } }
    );

    return res.status(200).json({ blog });
};

export const likeBlog = async (req, res) => {
    const user_id = req.user;
    const { _id, islikedByUser } = req.body;

    const incrementVal = islikedByUser ? -1 : 1;

    const blog = await Blog.findOneAndUpdate(
        { _id },
        { $inc: { "activity.total_likes": incrementVal } },
        { new: true }
    );

    if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
    }

    if (!islikedByUser) {
        const like = new Notification({
            type: "like",
            blog: _id,
            notification_for: blog.author,
            user: user_id
        });

        await like.save();
    } else {
        await Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" });
    }

    return res.status(200).json({ liked_by_user: !islikedByUser, total_likes: blog.activity.total_likes });
};

export const isLikedByUser = async (req, res) => {
    const user_id = req.user;
    const { _id } = req.body;

    const result = await Notification.exists({ user: user_id, type: "like", blog: _id });

    return res.status(200).json({ result: Boolean(result) });
};

export const userWrittenBlogs = async (req, res) => {
    const user_id = req.user;
    const { page = 1, draft, query, deletedDocCount = 0 } = req.body;

    const maxLimit = 5;
    const skipDocs = (page - 1) * maxLimit - deletedDocCount;

    const blogs = await Blog.find({ author: user_id, draft, title: new RegExp(query || "", "i") })
        .skip(skipDocs < 0 ? 0 : skipDocs)
        .limit(maxLimit)
        .sort({ publishedAt: -1 })
        .select("title banner publishedAt blog_id activity des draft -_id");

    return res.status(200).json({ blogs });
};

export const userWrittenBlogsCount = async (req, res) => {
    const user_id = req.user;
    const { draft, query } = req.body;

    const count = await Blog.countDocuments({ author: user_id, draft, title: new RegExp(query || "", "i") });

    return res.status(200).json({ totalDocs: count });
};

export const deleteBlog = async (req, res) => {
    const user_id = req.user;
    const { blog_id } = req.body;

    const blog = await Blog.findOne({ blog_id });

    if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.author.toString() !== user_id) {
        return res.status(403).json({ error: "You can only delete your own blogs" });
    }

    await Blog.findOneAndDelete({ blog_id });
    await Notification.deleteMany({ blog: blog._id });
    await Comment.deleteMany({ blog_id: blog._id });

    await User.findOneAndUpdate(
        { _id: user_id },
        { $pull: { blogs: blog._id }, $inc: { "account_info.total_posts": blog.draft ? 0 : -1 } }
    );

    return res.status(200).json({ status: "done" });
};
