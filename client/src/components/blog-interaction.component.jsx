import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import { BlogContext } from "../pages/blog.page";
import { UserContext } from "../App";

const BlogInteraction = () => {
    const {
        blog,
        blog: {
            _id,
            blog_id,
            title,
            activity,
            activity: { total_likes, total_comments } = {},
            author: { personal_info: { username: author_username } } = { personal_info: {} }
        },
        setBlog,
        isLikedByUser,
        setLikedByUser,
        setCommentsWrapper
    } = useContext(BlogContext);

    const { userAuth: { username, access_token } } = useContext(UserContext);

    useEffect(() => {
        if (!access_token) {
            return;
        }

        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user",
                { _id },
                { headers: { Authorization: `Bearer ${access_token}` } }
            )
            .then(({ data: { result } }) => setLikedByUser(Boolean(result)))
            .catch((err) => console.error(err));
    }, [_id, access_token, setLikedByUser]);

    const handleLike = async () => {
        if (!access_token) {
            return toast.error("Sign in to like this blog");
        }

        // Flip immediately so the heart feels instant, then reconcile with the server.
        const previouslyLiked = isLikedByUser;

        setLikedByUser(!previouslyLiked);
        setBlog({
            ...blog,
            activity: { ...activity, total_likes: total_likes + (previouslyLiked ? -1 : 1) }
        });

        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/like-blog",
                { _id, islikedByUser: previouslyLiked },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            setLikedByUser(data.liked_by_user);
            setBlog({ ...blog, activity: { ...activity, total_likes: data.total_likes } });
        } catch (err) {
            // Roll the optimistic update back.
            setLikedByUser(previouslyLiked);
            setBlog({ ...blog, activity: { ...activity, total_likes } });
            toast.error("Could not register your like");
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
    };

    return (
        <>
            <hr className="border-grey my-2" />

            <div className="flex gap-6 justify-between">
                <div className="flex gap-3 items-center">
                    <button
                        onClick={handleLike}
                        aria-label={isLikedByUser ? "Unlike this blog" : "Like this blog"}
                        className={
                            "w-10 h-10 rounded-full flex items-center justify-center " +
                            (isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80")
                        }
                    >
                        <i className={"fi " + (isLikedByUser ? "fi-sr-heart" : "fi-rr-heart")}></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>

                    <button
                        onClick={() => setCommentsWrapper((preVal) => !preVal)}
                        aria-label="Open comments"
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
                    >
                        <i className="fi fi-rr-comment-dots"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>

                <div className="flex gap-6 items-center">
                    {username === author_username ? (
                        <Link to={`/editor/${blog_id}`} className="underline hover:text-purple">
                            Edit
                        </Link>
                    ) : null}

                    <button onClick={copyLink} aria-label="Copy link to this blog">
                        <i className="fi fi-rr-link-alt text-xl hover:text-purple"></i>
                    </button>

                    <Link
                        to={`https://twitter.com/intent/tweet?text=Read ${encodeURIComponent(title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on Twitter"
                    >
                        <i className="fi fi-brands-twitter text-xl hover:text-twitter"></i>
                    </Link>
                </div>
            </div>

            <hr className="border-grey my-2" />
        </>
    );
};

export default BlogInteraction;
