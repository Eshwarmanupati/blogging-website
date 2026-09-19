import { cloudinary, isCloudinaryEnabled } from "../config/cloudinary.js";

/*
    Returns a short-lived signature the browser uses to upload straight to
    Cloudinary. The API secret never leaves the server, and the file never passes
    through it either — which keeps uploads fast on a free hosting tier.
*/
export const getUploadSignature = (req, res) => {
    if (!isCloudinaryEnabled()) {
        return res.status(503).json({ error: "Image uploads are not configured on this server" });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = process.env.CLOUDINARY_FOLDER || "blogging-website";

    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
        signature,
        timestamp,
        folder,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadURL: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
    });
};
