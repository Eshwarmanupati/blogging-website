import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                /*
                    Split the heavy third-party libraries out of the main bundle.
                    Editor.js is only needed on /editor and Firebase only on the
                    auth pages, so most visitors never download either.
                */
                manualChunks: {
                    react: ["react", "react-dom", "react-router-dom"],
                    firebase: ["firebase/app", "firebase/auth"],
                    editor: [
                        "@editorjs/editorjs",
                        "@editorjs/header",
                        "@editorjs/image",
                        "@editorjs/list",
                        "@editorjs/quote",
                        "@editorjs/embed",
                        "@editorjs/marker",
                        "@editorjs/inline-code",
                        "@editorjs/code"
                    ],
                    motion: ["framer-motion"]
                }
            }
        }
    }
});
