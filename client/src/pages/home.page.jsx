import { useEffect, useState } from "react";
import axios from "axios";

import AnimationWrapper from "../common/page-animation";
import InPageNavigation, { activeTabRef } from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

const HomePage = () => {
    const [blogs, setBlogs] = useState(null);
    const [trendingBlogs, setTrendingBlogs] = useState(null);
    const [pageState, setPageState] = useState("home");

    const categories = [
        "programming",
        "tech",
        "technology",
        "travel",
        "social media",
        "cooking",
        "finance",
        "film making",
        "design"
    ];

    const fetchLatestBlogs = async ({ page = 1 }) => {
        try {
            const { data } = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs", { page });

            const formatted = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page,
                countRoute: "/all-latest-blogs-count"
            });

            setBlogs(formatted);
        } catch (err) {
            console.error(err);
            setBlogs({ results: [], page: 1, totalDocs: 0 });
        }
    };

    const fetchBlogsByCategory = async ({ page = 1 }) => {
        try {
            const { data } = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
                tag: pageState,
                page,
                limit: 5
            });

            const formatted = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page,
                countRoute: "/search-blogs-count",
                data_to_send: { tag: pageState }
            });

            setBlogs(formatted);
        } catch (err) {
            console.error(err);
            setBlogs({ results: [], page: 1, totalDocs: 0 });
        }
    };

    const fetchTrendingBlogs = async () => {
        try {
            const { data } = await axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs");

            setTrendingBlogs(data.blogs);
        } catch (err) {
            console.error(err);
            setTrendingBlogs([]);
        }
    };

    const loadBlogByCategory = (e) => {
        const category = e.target.innerText.toLowerCase();

        setBlogs(null);

        // Clicking the active category clears the filter.
        setPageState(pageState === category ? "home" : category);
    };

    useEffect(() => {
        if (activeTabRef.current) {
            activeTabRef.current.click();
        }

        if (pageState === "home") {
            fetchLatestBlogs({ page: 1 });
        } else {
            fetchBlogsByCategory({ page: 1 });
        }

        if (!trendingBlogs) {
            fetchTrendingBlogs();
        }
    }, [pageState]);

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                <div className="w-full">
                    <InPageNavigation
                        routes={[pageState, "trending blogs"]}
                        defaultHidden={["trending blogs"]}
                    >
                        <>
                            {blogs === null ? (
                                <Loader />
                            ) : blogs.results.length === 0 ? (
                                <NoDataMessage message="No blogs published" />
                            ) : (
                                blogs.results.map((blog, i) => (
                                    <AnimationWrapper
                                        transition={{ duration: 0.4, delay: i * 0.06 }}
                                        key={i}
                                    >
                                        <BlogPostCard
                                            content={blog}
                                            author={blog.author.personal_info}
                                        />
                                    </AnimationWrapper>
                                ))
                            )}

                            <LoadMoreDataBtn
                                state={blogs}
                                fetchDataFun={pageState === "home" ? fetchLatestBlogs : fetchBlogsByCategory}
                            />
                        </>

                        {trendingBlogs === null ? (
                            <Loader />
                        ) : trendingBlogs.length === 0 ? (
                            <NoDataMessage message="No trending blogs" />
                        ) : (
                            trendingBlogs.map((blog, i) => (
                                <AnimationWrapper transition={{ duration: 0.4, delay: i * 0.06 }} key={i}>
                                    <MinimalBlogPost blog={blog} index={i} />
                                </AnimationWrapper>
                            ))
                        )}
                    </InPageNavigation>
                </div>

                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories from all interests</h1>

                            <div className="flex gap-3 flex-wrap">
                                {categories.map((category, i) => (
                                    <button
                                        onClick={loadBlogByCategory}
                                        className={"tag " + (pageState === category ? "bg-black text-white" : "")}
                                        key={i}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h1 className="font-medium text-xl mb-8">
                                Trending <i className="fi fi-rr-arrow-trend-up"></i>
                            </h1>

                            {trendingBlogs === null ? (
                                <Loader />
                            ) : trendingBlogs.length === 0 ? (
                                <NoDataMessage message="No trending blogs" />
                            ) : (
                                trendingBlogs.map((blog, i) => (
                                    <AnimationWrapper
                                        transition={{ duration: 0.4, delay: i * 0.06 }}
                                        key={i}
                                    >
                                        <MinimalBlogPost blog={blog} index={i} />
                                    </AnimationWrapper>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default HomePage;
