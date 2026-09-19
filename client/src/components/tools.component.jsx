import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Code from "@editorjs/code";

import { uploadImage } from "../common/upload";

/*
    Editor.js instantiates its tools once, before any React context is available,
    so the access token is passed in when the editor is constructed rather than
    read from a hook.
*/
export const getTools = (access_token) => {
    const uploadImageByFile = async (file) => {
        try {
            const url = await uploadImage(file, access_token);

            return { success: 1, file: { url } };
        } catch (err) {
            console.error(err);
            return { success: 0 };
        }
    };

    const uploadImageByURL = async (url) => {
        return { success: 1, file: { url } };
    };

    return {
        embed: Embed,
        list: {
            class: List,
            inlineToolbar: true
        },
        image: {
            class: Image,
            config: {
                uploader: {
                    uploadByUrl: uploadImageByURL,
                    uploadByFile: uploadImageByFile
                }
            }
        },
        header: {
            class: Header,
            config: {
                placeholder: "Type a heading...",
                levels: [2, 3, 4],
                defaultLevel: 2
            }
        },
        quote: {
            class: Quote,
            inlineToolbar: true
        },
        code: Code,
        marker: Marker,
        inlineCode: InlineCode
    };
};
