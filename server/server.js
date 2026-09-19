import express from "express";
import cors from "cors";
import "dotenv/config";

import { connectDB } from "./config/db.js";
import { initFirebase } from "./config/firebase.js";
import { initCloudinary } from "./config/cloudinary.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import userRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

/*
    In production only the deployed frontend may call the API. CLIENT_URL takes a
    comma separated list so a preview deployment can be allowed alongside it.
*/
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true
    })
);

app.use(express.json({ limit: "1mb" }));

initFirebase();
initCloudinary();

// Free hosting tiers idle the server out; this is what uptime pings hit.
app.get("/health", (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

app.use("/", authRoutes);
app.use("/", blogRoutes);
app.use("/", userRoutes);
app.use("/", commentRoutes);
app.use("/", notificationRoutes);
app.use("/", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (err) {
        console.error("❌ Failed to start server:", err.message);
        process.exit(1);
    }
};

start();
