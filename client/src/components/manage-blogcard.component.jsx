import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import { getDay } from "../common/date";
import { UserContext } from "../App";

const BlogStats = ({ stats }) => {
    return (
        <div className="flex gap-2 max-lg:mb-6 max-lg:pb-6 border-grey max-lg:border-b">
            {Object.keys(stats)
                .filter((key) => !key.includes("parent"))
                .map((key, i) => {
                    return (
                        <div
                            key={i}
                            className={
                                "flex flex-col items-center w-full h-full justify-center p-4 px-6 " +
                                (i !== 0 ? " border-grey border-l " : "")
                            }
                        >
                            <h1 className="text-xl lg:text-2xl mb-2">{stats[key].toLocaleString()}</h1>
                            <p className="max-lg:text-dark-grey capitalize">{key.split("_")[1]}</p>
                        </div>
                    );
                })}
        </div>
    );
};

/* Shared by both dashboard tabs; a draft has no stats and a different action row. */
const deleteBlog = async (blog, access_token, target, onDeleted) => {
    target.setAttribute("disabled", true);

    try {
        await axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + "/delete-blog",
            { blog_id: blog.blog_id },
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        toast.success("Blog deleted");
        onDeleted();
    } catch (err) {
        toast.error(err.response?.data?.error || "Could not delete the blog");
    } finally {
        target.removeAttribute("disabled");
    }
};

export const ManagePublishedBlogCard = ({ blog, onDeleted }) => {
    const { banner, blog_id, title, publishedAt, activity } = blog;

    const { userAuth: { access_token } } = useContext(UserContext);

    const [showStat, setShowStat] = useState(false);

    return (
        <>
            <div className="flex gap-10 border-b mb-6 max-md:px-4 border-grey pb-6 items-center">
                <img
                    src={banner}
                    alt={title}
                    className="max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover"
                />

                <div className="flex flex-col justify-between py-2 w-full min-w-[300px]">
                    <div>
                        <Link to={`/blog/${blog_id}`} className="blog-title mb-4 hover:underline">
                            {title}
                        </Link>

                        <p className="line-clamp-1">Published on {getDay(publishedAt)}</p>
                    </div>

                    <div className="flex gap-6 mt-3">
                        <Link to={`/editor/${blog_id}`} className="pr-4 py-2 underline">
                            Edit
                        </Link>

                        <button
                            className="lg:hidden pr-4 py-2 underline"
                            onClick={() => setShowStat((preVal) => !preVal)}
                        >
                            Stats
                        </button>

                        <button
                            onClick={(e) => deleteBlog(blog, access_token, e.target, onDeleted)}
                            className="pr-4 py-2 underline text-red"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div className="max-lg:hidden">
                    <BlogStats stats={activity} />
                </div>
            </div>

            {showStat ? (
                <div className="lg:hidden">
                    <BlogStats stats={activity} />
                </div>
            ) : null}
        </>
    );
};

export const ManageDraftBlogPost = ({ blog, index, onDeleted }) => {
    const { title, des, blog_id } = blog;

    const { userAuth: { access_token } } = useContext(UserContext);

    return (
        <div className="flex gap-5 lg:gap-10 pb-6 border-b mb-6 border-grey">
            <h1 className="blog-index text-center pl-4 md:pl-6 flex-none">
                {index < 10 ? "0" + index : index}
            </h1>

            <div>
                <h1 className="blog-title mb-3">{title}</h1>

                <p className="line-clamp-2 font-gelasio">{des.length ? des : "No description"}</p>

                <div className="flex gap-6 mt-3">
                    <Link to={`/editor/${blog_id}`} className="pr-4 py-2 underline">
                        Edit
                    </Link>

                    <button
                        onClick={(e) => deleteBlog(blog, access_token, e.target, onDeleted)}
                        className="pr-4 py-2 underline text-red"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
