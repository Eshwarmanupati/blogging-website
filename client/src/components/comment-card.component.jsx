import { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { getDay } from "../common/date";
import { UserContext } from "../App";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";

const CommentCard = ({ index, leftVal, commentData }) => {
    const {
        commented_by: { personal_info: { profile_img, fullname, username: commented_by_username } },
        commentedAt,
        comment,
        _id,
        children
    } = commentData;

    const { userAuth: { access_token, username } } = useContext(UserContext);

    const {
        blog,
        blog: { comments, comments: { results: commentsArr } = {}, activity, activity: { total_parent_comments } = {}, author: { personal_info: { username: blog_author } } = { personal_info: {} } },
        setBlog,
        setTotalParentCommentsLoaded
    } = useContext(BlogContext);

    const [isReplying, setReplying] = useState(false);

    /* Walks back up the flattened list to find where this comment's subtree ends. */
    const getParentIndex = () => {
        let startingPoint = index - 1;

        try {
            while (commentsArr[startingPoint].childrenLevel >= commentData.childrenLevel) {
                startingPoint--;
            }
        } catch {
            startingPoint = undefined;
        }

        return startingPoint;
    };

    const removeCommentsCards = (startingPoint, isDelete = false) => {
        if (commentsArr[startingPoint]) {
            while (commentsArr[startingPoint].childrenLevel > commentData.childrenLevel) {
                commentsArr.splice(startingPoint, 1);

                if (!commentsArr[startingPoint]) {
                    break;
                }
            }
        }

        if (isDelete) {
            const parentIndex = getParentIndex();

            if (parentIndex !== undefined) {
                commentsArr[parentIndex].children = commentsArr[parentIndex].children.filter(
                    (child) => child !== _id
                );

                if (!commentsArr[parentIndex].children.length) {
                    commentsArr[parentIndex].isReplyLoaded = false;
                }
            }

            commentsArr.splice(index, 1);
        }

        if (commentData.childrenLevel === 0 && isDelete) {
            setTotalParentCommentsLoaded((preVal) => preVal - 1);
        }

        setBlog({
            ...blog,
            comments: { results: commentsArr },
            activity: {
                ...activity,
                total_parent_comments:
                    total_parent_comments - (commentData.childrenLevel === 0 && isDelete ? 1 : 0)
            }
        });
    };

    const loadReplies = async ({ skip = 0, currentIndex = index }) => {
        if (!commentsArr[currentIndex].children.length) {
            return;
        }

        hideReplies();

        try {
            const { data: { replies } } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/get-replies",
                { _id: commentsArr[currentIndex]._id, skip }
            );

            commentsArr[currentIndex].isReplyLoaded = true;

            replies.forEach((reply, i) => {
                reply.childrenLevel = commentsArr[currentIndex].childrenLevel + 1;

                commentsArr.splice(currentIndex + 1 + i + skip, 0, reply);
            });

            setBlog({ ...blog, comments: { ...comments, results: commentsArr } });
        } catch (err) {
            toast.error("Could not load replies");
        }
    };

    const hideReplies = () => {
        commentData.isReplyLoaded = false;

        removeCommentsCards(index + 1);
    };

    const handleReplyClick = () => {
        if (!access_token) {
            return toast.error("Sign in to leave a reply");
        }

        setReplying((preVal) => !preVal);
    };

    const deleteComment = async (e) => {
        e.target.setAttribute("disabled", true);

        try {
            await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/delete-comment",
                { _id },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            removeCommentsCards(index + 1, true);
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not delete the comment");
        } finally {
            e.target.removeAttribute("disabled");
        }
    };

    return (
        <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
            <div className="my-5 p-6 rounded-md border border-grey">
                <div className="flex gap-3 items-center mb-8">
                    <img src={profile_img} alt={fullname} className="w-6 h-6 rounded-full" />
                    <p className="line-clamp-1">
                        {fullname} @{commented_by_username}
                    </p>
                    <p className="min-w-fit">{getDay(commentedAt)}</p>
                </div>

                <p className="font-gelasio text-xl ml-3 whitespace-pre-line">{comment}</p>

                <div className="flex gap-5 items-center mt-5">
                    {commentData.isReplyLoaded ? (
                        <button
                            onClick={hideReplies}
                            className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
                        >
                            <i className="fi fi-rs-comment-dots"></i> Hide reply
                        </button>
                    ) : children.length ? (
                        <button
                            onClick={loadReplies}
                            className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
                        >
                            <i className="fi fi-rs-comment-dots"></i>
                            {children.length} {children.length === 1 ? "reply" : "replies"}
                        </button>
                    ) : null}

                    <button className="underline" onClick={handleReplyClick}>
                        Reply
                    </button>

                    {/* Your own comment, or any comment on a blog you wrote. */}
                    {username === commented_by_username || username === blog_author ? (
                        <button
                            onClick={deleteComment}
                            className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red flex items-center"
                        >
                            <i className="fi fi-rr-trash pointer-events-none"></i>
                        </button>
                    ) : null}
                </div>

                {isReplying ? (
                    <div className="mt-8">
                        <CommentField
                            action="Reply"
                            index={index}
                            replyingTo={_id}
                            setReplying={setReplying}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default CommentCard;
