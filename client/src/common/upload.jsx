import axios from "axios";

/*
    Uploads go straight from the browser to Cloudinary. The server only hands out
    a short-lived signature, so the API secret stays on the server and the image
    bytes never travel through it.
*/
export const uploadImage = async (img, access_token) => {
    const { data: signature } = await axios.get(
        import.meta.env.VITE_SERVER_DOMAIN + "/get-upload-url",
        { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const formData = new FormData();

    formData.append("file", img);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", signature.timestamp);
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);

    const { data } = await axios.post(signature.uploadURL, formData);

    return data.secure_url;
};
