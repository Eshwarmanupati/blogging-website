import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

import User from "../Schema/User.js";

export const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
export const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

/* The payload every auth route returns: a signed token plus the bits the UI shows. */
export const formatDataToSend = (user) => {
    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY, { expiresIn: "7d" });

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    };
};

/* Derives a username from the email, appending a random suffix if it is taken. */
export const generateUsername = async (email) => {
    let username = email.split("@")[0];

    const isTaken = await User.exists({ "personal_info.username": username });

    if (isTaken) {
        username += nanoid().substring(0, 5);
    }

    return username;
};
