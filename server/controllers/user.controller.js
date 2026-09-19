import User from "../Schema/User.js";

const bioLimit = 200;

export const searchUsers = async (req, res) => {
    const { query } = req.body;

    const users = await User.find({ "personal_info.username": new RegExp(query, "i") })
        .limit(50)
        .select("personal_info.fullname personal_info.username personal_info.profile_img -_id");

    return res.status(200).json({ users });
};

export const getProfile = async (req, res) => {
    const { username } = req.body;

    const user = await User.findOne({ "personal_info.username": username }).select(
        "-personal_info.password -google_auth -updatedAt -blogs"
    );

    if (!user) {
        return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json(user);
};

export const updateProfileImg = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(403).json({ error: "No image url provided" });
    }

    await User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url });

    return res.status(200).json({ profile_img: url });
};

export const updateProfile = async (req, res) => {
    const { username, bio, social_links } = req.body;

    if (!username || username.length < 3) {
        return res.status(403).json({ error: "Username must be at least 3 characters long" });
    }

    if (bio && bio.length > bioLimit) {
        return res.status(403).json({ error: `Bio should not be more than ${bioLimit} characters` });
    }

    /*
        Every social link has to be a real URL, and everything except "website"
        has to point at the site it claims to — otherwise the profile page would
        render a YouTube icon linking somewhere else entirely.
    */
    const socialLinksArr = Object.keys(social_links || {});

    for (const key of socialLinksArr) {
        if (!social_links[key].length) {
            continue;
        }

        try {
            const hostname = new URL(social_links[key]).hostname;

            if (!hostname.includes(`${key}.com`) && key !== "website") {
                return res.status(403).json({ error: `${key} link is invalid — enter a full ${key}.com URL` });
            }
        } catch (err) {
            return res.status(403).json({ error: "Social links must be full URLs, including https://" });
        }
    }

    try {
        await User.findOneAndUpdate(
            { _id: req.user },
            { "personal_info.username": username, "personal_info.bio": bio, social_links },
            { runValidators: true }
        );

        return res.status(200).json({ username });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "That username is already taken" });
        }
        throw err;
    }
};
