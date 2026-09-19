import mongoose from "mongoose";

export const connectDB = async () => {
    const uri = process.env.DB_LOCATION;

    if (!uri) {
        throw new Error("DB_LOCATION is not set. Copy .env.example to .env and fill it in.");
    }

    await mongoose.connect(uri, { autoIndex: true });

    console.log("✅ MongoDB connected");
};
