import { Link, useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import EditorJS from "@editorjs/editorjs";

import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { uploadImage } from "../common/upload";
import { EditorContext } from "../pages/editor.pages";
import { getTools } from "./tools.component";
import { UserContext } from "../App";

const BlogEditor = () => {
    const { blog, blog: { title, banner, content, tags, des }, setBlog, textEditor, setTextEditor, setEditorState } =
        useContext(EditorContext);

    const { userAuth: { access_token } } = useContext(UserContext);

    const { blog_id } = useParams();
    const navigate = useNavigate();

    const bannerInputRef = useRef();

    useEffect(() => {
        if (textEditor.isReady) {
            return;
        }

        const editor = new EditorJS({
            holder: "textEditor",
            /*
                content is an array when it comes back from the API (mongoose
                stores it that way) but Editor.js wants the object itself.
            */
            data: Array.isArray(content) ? content[0] : content,
            tools: getTools(access_token),
            placeholder: "Let's write an awesome story"
        });

        setTextEditor(editor);
    }, []);

    const handleBannerUpload = async (e) => {
        const img = e.target.files[0];

        if (!img) {
            return;
        }

        const loadingToast = toast.loading("Uploading...");

        try {
            const url = await uploadImage(img, access_token);

            toast.dismiss(loadingToast);
            toast.success("Banner uploaded");

            setBlog({ ...blog, banner: url });
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.error || "Could not upload the banner");
        } finally {
            // Let the same file be picked again after a failure.
            e.target.value = "";
        }
    };

    const handleTitleKeyDown = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
        }
    };

    const handleTitleChange = (e) => {
        const input = e.target;

        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";

        setBlog({ ...blog, title: input.value });
    };

    const handleError = (e) => {
        e.target.src = defaultBanner;
    };

    const handlePublishEvent = async () => {
        if (!banner.length) {
            return toast.error("Upload a banner image to publish");
        }

        if (!title.length) {
            return toast.error("Write a blog title to publish");
        }

        if (!textEditor.isReady) {
            return;
        }

        try {
            const data = await textEditor.save();

            if (!data.blocks.length) {
                return toast.error("Write something in your blog to publish");
            }

            setBlog({ ...blog, content: data });
            setEditorState("publish");
        } catch (err) {
            console.error(err);
            toast.error("Could not read your blog content");
        }
    };

    const handleSaveDraft = async (e) => {
        if (e.target.className.includes("disable")) {
            return;
        }

        if (!title.length) {
            return toast.error("Write a blog title before saving it as a draft");
        }

        if (!textEditor.isReady) {
            return;
        }

        const loadingToast = toast.loading("Saving draft...");

        e.target.classList.add("disable");

        try {
            const savedContent = await textEditor.save();

            const blogObj = { title, banner, des, content: savedContent, tags, draft: true };

            await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
                { ...blogObj, id: blog_id },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            toast.dismiss(loadingToast);
            toast.success("Saved as draft");

            setTimeout(() => navigate("/dashboard/blogs?tab=draft"), 500);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.error || "Could not save your draft");
        } finally {
            e.target.classList.remove("disable");
        }
    };

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} alt="Home" />
                </Link>

                <p className="max-md:hidden text-black line-clamp-1 w-full">
                    {title.length ? title : "New Blog"}
                </p>

                <div className="flex gap-4 ml-auto">
                    <button className="btn-dark py-2" onClick={handlePublishEvent}>
                        Publish
                    </button>
                    <button className="btn-light py-2" onClick={handleSaveDraft}>
                        Save Draft
                    </button>
                </div>
            </nav>

            <Toaster />

            <AnimationWrapper>
                <section>
                    <div className="mx-auto max-w-[900px] w-full">
                        <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
                            <label htmlFor="uploadBanner">
                                <img
                                    src={banner.length ? banner : defaultBanner}
                                    alt="Blog banner"
                                    className="z-20 cursor-pointer"
                                    onError={handleError}
                                />
                                <input
                                    id="uploadBanner"
                                    ref={bannerInputRef}
                                    type="file"
                                    accept=".png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={handleBannerUpload}
                                />
                            </label>
                        </div>

                        <textarea
                            defaultValue={title}
                            placeholder="Blog Title"
                            className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
                            onKeyDown={handleTitleKeyDown}
                            onChange={handleTitleChange}
                        ></textarea>

                        <hr className="w-full opacity-10 my-5" />

                        <div id="textEditor" className="font-gelasio"></div>
                    </div>
                </section>
            </AnimationWrapper>
        </>
    );
};

export default BlogEditor;
