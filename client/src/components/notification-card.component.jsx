import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import { getDay } from "../common/date";
import { UserContext } from "../App";
import NotificationCommentField from "./notification-comment-field.component";

const NotificationCard = ({ data, index, notificationState }) => {
    const {
        type,
        seen,
        reply,
        comment,
        replied_on_comment,
        user,
        user: { personal_info: { profile_img, fullname, username } },
        blog: { _id: blog_id, blog_id: blog_slug, title },
        createdAt,
        _id: notification_id
    } = data;

    const [isReplying, setReplying] = useState(false);

    const { userAuth: { username: author_username, profile_img: author_profile_img, access_token } } =
        useContext(UserContext);

    const { notifications, notifications: { results, totalDocs }, setNotifications } = notificationState;

    const handleReplyClick = () => {
        setReplying((preVal) => !preVal);
    };

    const handleDelete = async (commentId, target, targetEl) => {
        targetEl.setAttribute("disabled", true);

        try {
            await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/delete-comment",
                { _id: commentId },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            if (target === "comment") {
                results.splice(index, 1);
            } else {
                delete results[index].reply;
            }

            setNotifications({
                ...notifications,
                results,
                totalDocs: totalDocs - 1,
                deletedDocCount: (notifications.deletedDocCount || 0) + 1
            });

            toast.success("Deleted");
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not delete");
        } finally {
            targetEl.removeAttribute("disabled");
        }
    };

    const actionText = type === "like" ? "liked your blog" : type === "comment" ? "commented on" : "replied on";

    return (
        <div className={"p-6 border-b border-grey border-l-black " + (!seen ? "border-l-2" : "")}>
            <div className="flex gap-5 mb-3">
                <img src={profile_img} alt={fullname} className="w-14 h-14 flex-none rounded-full" />

                <div className="w-full">
                    <h1 className="font-medium text-xl text-dark-grey">
                        <span className="lg:inline-block hidden capitalize">{fullname}</span>
                        <Link to={`/user/${username}`} className="mx-1 text-black underline">
                            @{username}
                        </Link>
                        <span className="font-normal">{actionText}</span>
                    </h1>

                    {type === "reply" ? (
                        <div className="p-4 mt-4 rounded-md bg-grey">
                            <p>{replied_on_comment?.comment}</p>
                        </div>
                    ) : (
                        <Link
                            to={`/blog/${blog_slug}`}
                            className="font-medium text-dark-grey hover:underline line-clamp-1"
                        >
                            {`"${title}"`}
                        </Link>
                    )}
                </div>
            </div>

            {type !== "like" ? <p className="ml-14 pl-5 font-gelasio text-xl my-5">{comment?.comment}</p> : null}

            <div className="ml-14 pl-5 mt-3 text-dark-grey flex gap-8">
                <p>{getDay(createdAt)}</p>

                {type !== "like" ? (
                    <>
                        {!reply ? (
                            <button className="underline hover:text-black" onClick={handleReplyClick}>
                                Reply
                            </button>
                        ) : null}

                        <button
                            className="underline hover:text-black"
                            onClick={(e) => handleDelete(comment._id, "comment", e.target)}
                        >
                            Delete
                        </button>
                    </>
                ) : null}
            </div>

            {isReplying ? (
                <div className="mt-8">
                    <NotificationCommentField
                        _id={blog_id}
                        blog_author={user}
                        index={index}
                        replyingTo={comment._id}
                        setReplying={setReplying}
                        notification_id={notification_id}
                        notificationData={notificationState}
                    />
                </div>
            ) : null}

            {reply ? (
                <div className="ml-20 p-5 bg-grey mt-5 rounded-md">
                    <div className="flex gap-3 mb-3">
                        <img src={author_profile_img} alt={author_username} className="w-8 h-8 rounded-full" />

                        <div>
                            <h1 className="font-medium text-xl text-dark-grey">
                                <Link to={`/user/${author_username}`} className="mx-1 text-black underline">
                                    @{author_username}
                                </Link>
                                <span className="font-normal">replied to</span>
                                <Link to={`/user/${username}`} className="mx-1 text-black underline">
                                    @{username}
                                </Link>
                            </h1>
                        </div>
                    </div>

                    <p className="ml-14 font-gelasio text-xl my-2">{reply.comment}</p>

                    <button
                        className="underline hover:text-black ml-14 mt-2 text-dark-grey"
                        onClick={(e) => handleDelete(reply._id, "reply", e.target)}
                    >
                        Delete
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default NotificationCard;
