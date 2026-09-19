import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

import AnimationWrapper from "../common/page-animation";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import { UserContext } from "../App";

const PublishForm = () => {
    const characterLimit = 200;
    const tagLimit = 10;

    const { blog, blog: { banner, title, tags, des, content }, setEditorState, setBlog } =
        useContext(EditorContext);

    const { userAuth: { access_token } } = useContext(UserContext);

    const { blog_id } = useParams();
    const navigate = useNavigate();

    const handleCloseEvent = () => {
        setEditorState("editor");
    };

    const handleBlogTitleChange = (e) => {
        setBlog({ ...blog, title: e.target.value });
    };

    const handleBlogDesChange = (e) => {
        setBlog({ ...blog, des: e.target.value });
    };

    const handleTitleKeyDown = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
        }
    };

    const handleKeyDown = (e) => {
        // Enter or comma commits the tag.
        if (e.keyCode === 13 || e.keyCode === 188) {
            e.preventDefault();

            const tag = e.target.value.trim();

            if (tags.length >= tagLimit) {
                return toast.error(`You can add a maximum of ${tagLimit} tags`);
            }

            if (tag.length && !tags.includes(tag)) {
                setBlog({ ...blog, tags: [...tags, tag] });
            }

            e.target.value = "";
        }
    };

    const publishBlog = async (e) => {
        if (e.target.className.includes("disable")) {
            return;
        }

        if (!title.length) {
            return toast.error("Write a blog title before publishing");
        }

        if (!des.length || des.length > characterLimit) {
            return toast.error(`Write a description within ${characterLimit} characters to publish`);
        }

        if (!tags.length) {
            return toast.error("Add at least 1 tag to help us rank your blog");
        }

        const loadingToast = toast.loading("Publishing...");

        e.target.classList.add("disable");

        const blogObj = { title, banner, des, content, tags, draft: false };

        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
                { ...blogObj, id: blog_id },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            toast.dismiss(loadingToast);
            toast.success("Published");

            setTimeout(() => navigate(`/blog/${data.id}`), 500);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.error || "Could not publish your blog");
        } finally {
            e.target.classList.remove("disable");
        }
    };

    return (
        <AnimationWrapper>
            <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
                <Toaster />

                <button
                    className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
                    onClick={handleCloseEvent}
                    aria-label="Back to editor"
                >
                    <i className="fi fi-br-cross"></i>
                </button>

                <div className="max-w-[550px] center">
                    <p className="text-dark-grey mb-1">Preview</p>

                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
                        <img src={banner} alt="Blog banner" />
                    </div>

                    <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">{title}</h1>

                    <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">{des}</p>
                </div>

                <div className="border-grey lg:border-l lg:pl-8">
                    <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
                    <input
                        type="text"
                        placeholder="Blog Title"
                        defaultValue={title}
                        className="input-box pl-4"
                        onChange={handleBlogTitleChange}
                    />

                    <p className="text-dark-grey mb-2 mt-9">Short description about your blog</p>

                    <textarea
                        maxLength={characterLimit}
                        defaultValue={des}
                        className="h-40 resize-none leading-7 input-box pl-4"
                        onChange={handleBlogDesChange}
                        onKeyDown={handleTitleKeyDown}
                    ></textarea>

                    <p className="mt-1 text-dark-grey text-sm text-right">
                        {characterLimit - des.length} characters left
                    </p>

                    <p className="text-dark-grey mb-2 mt-9">
                        Topics — helps with searching and ranking your blog post
                    </p>

                    <div className="relative input-box pl-2 py-2 pb-4">
                        <input
                            type="text"
                            placeholder="Topic"
                            className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
                            onKeyDown={handleKeyDown}
                        />

                        {tags.map((tag, i) => (
                            <Tag tag={tag} tagIndex={i} key={i} />
                        ))}
                    </div>

                    <p className="mt-1 mb-4 text-dark-grey text-right">{tagLimit - tags.length} tags left</p>

                    <button className="btn-dark px-8" onClick={publishBlog}>
                        Publish
                    </button>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default PublishForm;
