import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios";

import { UserContext } from "../App";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import Loader from "../components/loader.component";

const blogStructure = {
    title: "",
    banner: "",
    content: [],
    tags: [],
    des: "",
    author: { personal_info: {} }
};

export const EditorContext = createContext({});

const Editor = () => {
    const { blog_id } = useParams();

    const [blog, setBlog] = useState(blogStructure);
    const [editorState, setEditorState] = useState("editor");
    const [textEditor, setTextEditor] = useState({ isReady: false });
    const [loading, setLoading] = useState(true);

    const { userAuth: { access_token } } = useContext(UserContext);

    useEffect(() => {
        // /editor with no id is a new post; nothing to load.
        if (!blog_id) {
            return setLoading(false);
        }

        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", {
                blog_id,
                draft: true,
                mode: "edit"
            })
            .then(({ data: { blog: fetched } }) => {
                setBlog(fetched);
            })
            .catch((err) => {
                console.error(err);
                setBlog(null);
            })
            .finally(() => setLoading(false));
    }, [blog_id]);

    if (access_token === null) {
        return <Navigate to="/signin" />;
    }

    // Still restoring the session from sessionStorage.
    if (access_token === undefined) {
        return <Loader />;
    }

    if (loading) {
        return <Loader />;
    }

    return (
        <EditorContext.Provider
            value={{ blog, setBlog, editorState, setEditorState, textEditor, setTextEditor }}
        >
            {editorState === "editor" ? <BlogEditor /> : <PublishForm />}
        </EditorContext.Provider>
    );
};

export default Editor;
