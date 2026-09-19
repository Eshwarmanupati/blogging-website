import jwt from "jsonwebtoken";

/* Rejects the request unless a valid bearer token is present. */
export const verifyJWT = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "No access token" });
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Access token is invalid" });
        }

        req.user = user.id;
        next();
    });
};

/*
    Same check, but a missing or bad token is not fatal — req.user is simply left
    undefined. Used by routes that return extra data for signed-in visitors, such
    as a blog page that also reports whether you already liked the post.
*/
export const optionalJWT = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (!err) {
            req.user = user.id;
        }
        next();
    });
};
