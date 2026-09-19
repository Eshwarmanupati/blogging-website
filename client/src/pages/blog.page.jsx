import { createContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";

import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer, { fetchComments } from "../components/comments.component";
import PageNotFound from "./404.page";

export const blogStructure = {
    title: "",
    des: "",
    content: [],
    tags: [],
    author: { personal_info: {} },
    banner: "",
    publishedAt: ""
};

export const BlogContext = createContext({});

const BlogPage = () => {
    const { blog_id } = useParams();

    const [blog, setBlog] = useState(blogStructure);
    const [similarBlogs, setSimilarBlogs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isLikedByUser, setLikedByUser] = useState(false);
    const [commentsWrapper, setCommentsWrapper] = useState(false);
    const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);

    const {
        title,
        content,
        banner,
        author: { personal_info: { fullname, username: author_username, profile_img } },
        publishedAt
    } = blog;

    useEffect(() => {
        // Reset between blogs, otherwise the previous post flashes in.
        setBlog(blogStructure);
        setSimilarBlogs(null);
        setLoading(true);
        setNotFound(false);
        setLikedByUser(false);
        setCommentsWrapper(false);
        setTotalParentCommentsLoaded(0);

        let cancelled = false;

        const fetchBlog = async () => {
            try {
                const { data: { blog: fetched } } = await axios.post(
                    import.meta.env.VITE_SERVER_DOMAIN + "/get-blog",
                    { blog_id }
                );

                if (cancelled) {
                    return;
                }

                fetched.comments = await fetchComments({
                    blog_id: fetched._id,
                    setParentCommentCountFun: setTotalParentCommentsLoaded
                });

                if (cancelled) {
                    return;
                }

                setBlog(fetched);

                const tag = fetched.tags?.[0];

                if (tag) {
                    const { data } = await axios.post(
                        import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs",
                        { tag, limit: 6, eliminate_blog: blog_id }
                    );

                    if (!cancelled) {
                        setSimilarBlogs(data.blogs);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setNotFound(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchBlog();

        return () => {
            cancelled = true;
        };
    }, [blog_id]);

    if (loading) {
        return <Loader />;
    }

    if (notFound) {
        return <PageNotFound />;
    }

    return (
        <AnimationWrapper>
            <BlogContext.Provider
                value={{
                    blog,
                    setBlog,
                    isLikedByUser,
                    setLikedByUser,
                    commentsWrapper,
                    setCommentsWrapper,
                    totalParentCommentsLoaded,
                    setTotalParentCommentsLoaded
                }}
            >
                <CommentsContainer />

                <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
                    <img src={banner} alt={title} className="aspect-video rounded-md" />

                    <div className="mt-12">
                        <h2>{title}</h2>

                        <div className="flex max-sm:flex-col justify-between my-8">
                            <div className="flex gap-5 items-start">
                                <img src={profile_img} alt={fullname} className="w-12 h-12 rounded-full" />

                                <p>
                                    <span className="capitalize">{fullname}</span>
                                    <br />@
                                    <Link
                                        to={`/user/${author_username}`}
                                        className="underline normal-case"
                                    >
                                        {author_username}
                                    </Link>
                                </p>
                            </div>

                            <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                                Published on {getDay(publishedAt)}
                            </p>
                        </div>
                    </div>

                    <BlogInteraction />

                    <div className="my-12 font-gelasio blog-page-content">
                        {content[0]?.blocks?.map((block, i) => {
                            return (
                                <div className="my-4 md:my-8" key={i}>
                                    <BlogContent block={block} />
                                </div>
                            );
                        })}
                    </div>

                    <BlogInteraction />

                    {similarBlogs !== null && similarBlogs.length ? (
                        <>
                            <h1 className="text-2xl mt-14 mb-10 font-medium">Similar blogs</h1>

                            {similarBlogs.map((similar, i) => {
                                return (
                                    <AnimationWrapper key={i} transition={{ duration: 0.4, delay: i * 0.05 }}>
                                        <BlogPostCard
                                            content={similar}
                                            author={similar.author.personal_info}
                                        />
                                    </AnimationWrapper>
                                );
                            })}
                        </>
                    ) : null}
                </div>

                <Toaster />
            </BlogContext.Provider>
        </AnimationWrapper>
    );
};

export default BlogPage;
