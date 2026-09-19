import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";

import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import NoDataMessage from "../components/nodata.component";
import AnimationWrapper from "../common/page-animation";
import { filterPaginationData } from "../common/filter-pagination-data";
import { UserContext } from "../App";
import { ManagePublishedBlogCard, ManageDraftBlogPost } from "../components/manage-blogcard.component";
import LoadMoreDataBtn from "../components/load-more.component";

const ManageBlogs = () => {
    const [blogs, setBlogs] = useState(null);
    const [drafts, setDrafts] = useState(null);
    const [query, setQuery] = useState("");

    const activeTab = useSearchParams()[0].get("tab");

    const { userAuth: { access_token } } = useContext(UserContext);

    const getBlogs = async ({ page, draft, deletedDocCount = 0 }) => {
        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/user-written-blogs",
                { page, draft, query, deletedDocCount },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            const formatted = await filterPaginationData({
                state: draft ? drafts : blogs,
                data: data.blogs,
                page,
                user: access_token,
                countRoute: "/user-written-blogs-count",
                data_to_send: { draft, query }
            });

            if (draft) {
                setDrafts(formatted);
            } else {
                setBlogs(formatted);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!access_token) {
            return;
        }

        if (blogs === null) {
            getBlogs({ page: 1, draft: false });
        }

        if (drafts === null) {
            getBlogs({ page: 1, draft: true });
        }
    }, [access_token, blogs, drafts, query]);

    const handleSearch = (e) => {
        const searchQuery = e.target.value;

        setQuery(searchQuery);

        if (e.keyCode === 13) {
            // Null both lists so the effect above refetches with the new query.
            setBlogs(null);
            setDrafts(null);
        }
    };

    const handleChange = (e) => {
        if (!e.target.value.length) {
            setQuery("");
            setBlogs(null);
            setDrafts(null);
        }
    };

    return (
        <>
            <h1 className="max-md:hidden">Manage Blogs</h1>

            <Toaster />

            <div className="relative max-md:mt-5 md:mt-8 mb-10">
                <input
                    type="search"
                    className="w-full bg-grey p-4 pl-12 pr-6 rounded-full placeholder:text-dark-grey"
                    placeholder="Search blogs"
                    onChange={handleChange}
                    onKeyDown={handleSearch}
                />

                <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
            </div>

            <InPageNavigation
                routes={["Published blogs", "Drafts"]}
                defaultActiveIndex={activeTab !== "draft" ? 0 : 1}
            >
                {blogs === null ? (
                    <Loader />
                ) : blogs.results.length ? (
                    <>
                        {blogs.results.map((blog, i) => (
                            <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                <ManagePublishedBlogCard blog={blog} onDeleted={() => setBlogs(null)} />
                            </AnimationWrapper>
                        ))}

                        <LoadMoreDataBtn
                            state={blogs}
                            fetchDataFun={getBlogs}
                            additionalParam={{ draft: false, deletedDocCount: 0 }}
                        />
                    </>
                ) : (
                    <NoDataMessage message="No published blogs" />
                )}

                {drafts === null ? (
                    <Loader />
                ) : drafts.results.length ? (
                    <>
                        {drafts.results.map((blog, i) => (
                            <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                <ManageDraftBlogPost
                                    blog={blog}
                                    index={i + 1}
                                    onDeleted={() => setDrafts(null)}
                                />
                            </AnimationWrapper>
                        ))}

                        <LoadMoreDataBtn
                            state={drafts}
                            fetchDataFun={getBlogs}
                            additionalParam={{ draft: true, deletedDocCount: 0 }}
                        />
                    </>
                ) : (
                    <NoDataMessage message="No draft blogs" />
                )}
            </InPageNavigation>
        </>
    );
};

export default ManageBlogs;
