import { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { UserContext } from "../App";
import { BlogContext } from "../pages/blog.page";

const CommentField = ({ action, index = undefined, replyingTo = undefined, setReplying }) => {
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { userAuth: { access_token, username, fullname, profile_img } } = useContext(UserContext);

    const {
        blog,
        blog: { _id, author: { _id: blog_author }, comments, comments: { results: commentsArr } = {}, activity, activity: { total_comments, total_parent_comments } = {} },
        setBlog,
        setTotalParentCommentsLoaded
    } = useContext(BlogContext);

    const handleComment = async () => {
        if (!access_token) {
            return toast.error("Sign in first to leave a comment");
        }

        if (!comment.length) {
            return toast.error("Write something to leave a comment");
        }

        setSubmitting(true);

        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/add-comment",
                { _id, blog_author, comment, replying_to: replyingTo },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            setComment("");

            data.commented_by = { personal_info: { username, profile_img, fullname } };

            let newCommentArr;

            if (replyingTo) {
                /*
                    A reply is spliced in directly beneath its parent and tagged
                    with childrenLevel so the indentation and the "hide reply"
                    toggle keep working without refetching the thread.
                */
                commentsArr[index].children.push(data._id);

                data.childrenLevel = commentsArr[index].childrenLevel + 1;
                data.parentIndex = index;

                commentsArr[index].isReplyLoaded = true;

                commentsArr.splice(index + 1, 0, data);

                newCommentArr = commentsArr;

                setReplying(false);
            } else {
                data.childrenLevel = 0;

                newCommentArr = [data, ...commentsArr];
            }

            const parentCommentIncrementVal = replyingTo ? 0 : 1;

            setBlog({
                ...blog,
                comments: { ...comments, results: newCommentArr },
                activity: {
                    ...activity,
                    total_comments: total_comments + 1,
                    total_parent_comments: total_parent_comments + parentCommentIncrementVal
                }
            });

            setTotalParentCommentsLoaded((preVal) => preVal + parentCommentIncrementVal);
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not post your comment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Leave a ${action.toLowerCase()}...`}
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
            ></textarea>

            <button className="btn-dark mt-5 px-10" onClick={handleComment} disabled={submitting}>
                {submitting ? "Posting..." : action}
            </button>
        </>
    );
};

export default CommentField;
