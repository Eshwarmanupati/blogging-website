import { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { UserContext } from "../App";

const NotificationCommentField = ({
    _id,
    blog_author,
    index = undefined,
    replyingTo = undefined,
    setReplying,
    notification_id,
    notificationData
}) => {
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { _id: user_id } = blog_author;

    const { userAuth: { access_token } } = useContext(UserContext);
    const { notifications, notifications: { results }, setNotifications } = notificationData;

    const handleComment = async () => {
        if (!comment.length) {
            return toast.error("Write something to leave a reply");
        }

        setSubmitting(true);

        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/add-comment",
                { _id, blog_author: user_id, comment, replying_to: replyingTo, notification_id },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            setReplying(false);

            results[index].reply = { comment, _id: data._id };

            setNotifications({ ...notifications, results });

            setComment("");
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not post your reply");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a reply..."
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
            ></textarea>

            <button className="btn-dark mt-5 px-10" onClick={handleComment} disabled={submitting}>
                {submitting ? "Replying..." : "Reply"}
            </button>
        </>
    );
};

export default NotificationCommentField;
