import bcrypt from "bcrypt";
import { getAuth } from "firebase-admin/auth";

import User from "../Schema/User.js";
import { isGoogleAuthEnabled } from "../config/firebase.js";
import { emailRegex, passwordRegex, formatDataToSend, generateUsername } from "../utils/auth.utils.js";

export const signup = async (req, res) => {
    const { fullname, email, password } = req.body;

    if (!fullname || fullname.length < 3) {
        return res.status(403).json({ error: "Fullname must be at least 3 characters long" });
    }

    if (!email || !email.length) {
        return res.status(403).json({ error: "Enter an email" });
    }

    if (!emailRegex.test(email)) {
        return res.status(403).json({ error: "Email is invalid" });
    }

    if (!password || !passwordRegex.test(password)) {
        return res.status(403).json({
            error: "Password must be 6-20 characters, with at least 1 number, 1 lowercase and 1 uppercase letter"
        });
    }

    const hashed_password = await bcrypt.hash(password, 10);
    const username = await generateUsername(email);

    const user = new User({
        personal_info: { fullname, email, password: hashed_password, username }
    });

    try {
        const saved = await user.save();
        return res.status(200).json(formatDataToSend(saved));
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Email already exists" });
        }
        throw err;
    }
};

export const signin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ "personal_info.email": email });

    if (!user) {
        return res.status(403).json({ error: "Email is not registered" });
    }

    if (user.google_auth) {
        return res.status(403).json({
            error: "This account was created with Google. Log in with Google instead."
        });
    }

    const matches = await bcrypt.compare(password, user.personal_info.password);

    if (!matches) {
        return res.status(403).json({ error: "Password is incorrect" });
    }

    return res.status(200).json(formatDataToSend(user));
};

export const googleAuth = async (req, res) => {
    if (!isGoogleAuthEnabled()) {
        return res.status(503).json({ error: "Google sign-in is not configured on this server" });
    }

    const { access_token } = req.body;

    let decodedToken;

    try {
        decodedToken = await getAuth().verifyIdToken(access_token);
    } catch (err) {
        return res.status(403).json({ error: "Could not verify you with Google. Try another account." });
    }

    const { email, name, picture } = decodedToken;
    const profile_img = picture ? picture.replace("s96-c", "s384-c") : undefined;

    let user = await User.findOne({ "personal_info.email": email }).select(
        "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
    );

    if (user) {
        if (!user.google_auth) {
            return res.status(403).json({
                error: "This email signed up without Google. Log in with your password instead."
            });
        }
    } else {
        const username = await generateUsername(email);

        user = new User({
            personal_info: { fullname: name, email, profile_img, username },
            google_auth: true
        });

        user = await user.save();
    }

    return res.status(200).json(formatDataToSend(user));
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
        return res.status(403).json({
            error: "Passwords must be 6-20 characters, with at least 1 number, 1 lowercase and 1 uppercase letter"
        });
    }

    const user = await User.findById(req.user);

    if (user.google_auth) {
        return res.status(403).json({
            error: "You signed up with Google, so there is no password to change"
        });
    }

    const matches = await bcrypt.compare(currentPassword, user.personal_info.password);

    if (!matches) {
        return res.status(403).json({ error: "Your current password is incorrect" });
    }

    const hashed_password = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(req.user, { "personal_info.password": hashed_password });

    return res.status(200).json({ status: "Password changed" });
};
