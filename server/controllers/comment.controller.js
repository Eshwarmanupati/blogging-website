import Blog from "../Schema/Blog.js";
import Comment from "../Schema/Comment.js";
import Notification from "../Schema/Notification.js";

export const addComment = async (req, res) => {
    const user_id = req.user;
    const { _id, comment, blog_author, replying_to, notification_id } = req.body;

    if (!comment || !comment.length) {
        return res.status(403).json({ error: "Write something to leave a comment" });
    }

    const commentObj = {
        blog_id: _id,
        blog_author,
        comment,
        commented_by: user_id
    };

    if (replying_to) {
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }

    const commentFile = await new Comment(commentObj).save();

    const { comment: commentText, commentedAt, children } = commentFile;

    await Blog.findOneAndUpdate(
        { _id },
        {
            $push: { comments: commentFile._id },
            $inc: {
                "activity.total_comments": 1,
                // Only top-level comments count towards the "N comments" heading.
                "activity.total_parent_comments": replying_to ? 0 : 1
            }
        }
    );

    const notificationObj = {
        type: replying_to ? "reply" : "comment",
        blog: _id,
        notification_for: blog_author,
        user: user_id,
        comment: commentFile._id
    };

    if (replying_to) {
        const replyingToComment = await Comment.findOneAndUpdate(
            { _id: replying_to },
            { $push: { children: commentFile._id } }
        );

        // The reply notifies the author of the comment being replied to, not the blog author.
        notificationObj.replied_on_comment = replying_to;
        notificationObj.notification_for = replyingToComment.commented_by;

        if (notification_id) {
            await Notification.findOneAndUpdate({ _id: notification_id }, { reply: commentFile._id });
        }
    }

    // Do not notify yourself about your own comment.
    if (notificationObj.notification_for.toString() !== user_id) {
        await new Notification(notificationObj).save();
    }

    return res.status(200).json({
        comment: commentText,
        commentedAt,
        _id: commentFile._id,
        user_id,
        children
    });
};

export const getBlogComments = async (req, res) => {
    const { blog_id, skip = 0 } = req.body;

    const maxLimit = 5;

    const comments = await Comment.find({ blog_id, isReply: { $ne: true } })
        .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
        .skip(skip)
        .limit(maxLimit)
        .sort({ commentedAt: -1 });

    return res.status(200).json(comments);
};

export const getReplies = async (req, res) => {
    const { _id, skip = 0 } = req.body;

    const maxLimit = 5;

    const doc = await Comment.findOne({ _id })
        .populate({
            path: "children",
            options: { limit: maxLimit, skip, sort: { commentedAt: -1 } },
            populate: {
                path: "commented_by",
                select: "personal_info.profile_img personal_info.fullname personal_info.username"
            },
            select: "-blog_id -updatedAt"
        })
        .select("children");

    return res.status(200).json({ replies: doc ? doc.children : [] });
};

/* Removes a comment, its notifications, and — recursively — every reply beneath it. */
const deleteCommentTree = async (_id) => {
    const comment = await Comment.findOneAndDelete({ _id });

    if (!comment) {
        return 0;
    }

    if (comment.parent) {
        await Comment.findOneAndUpdate({ _id: comment.parent }, { $pull: { children: _id } });
    }

    await Notification.findOneAndDelete({ comment: _id });
    await Notification.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 } });

    let removed = 1;

    for (const childId of comment.children) {
        removed += await deleteCommentTree(childId);
    }

    await Blog.findOneAndUpdate(
        { _id: comment.blog_id },
        {
            $pull: { comments: _id },
            $inc: {
                "activity.total_comments": -1,
                "activity.total_parent_comments": comment.parent ? 0 : -1
            }
        }
    );

    return removed;
};

export const deleteComment = async (req, res) => {
    const user_id = req.user;
    const { _id } = req.body;

    const comment = await Comment.findOne({ _id });

    if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
    }

    // Either the person who wrote it or the blog's author may remove it.
    if (user_id !== comment.commented_by.toString() && user_id !== comment.blog_author.toString()) {
        return res.status(403).json({ error: "You cannot delete this comment" });
    }

    await deleteCommentTree(_id);

    return res.status(200).json({ status: "done" });
};
