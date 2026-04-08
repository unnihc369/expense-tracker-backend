import mongoose from "mongoose";

/** Supports both common env names so `.env` matches Atlas/docs examples. */
export function getMongoUri() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  return typeof uri === "string" ? uri.trim() : "";
}

/**
 * Connects to MongoDB. Call once at process startup before accepting HTTP traffic.
 * @returns {Promise<boolean>}
 */
export const connectDB = async () => {
  const uri = getMongoUri();
  if (!uri) {
    console.error(
      "MongoDB: missing connection string. Set MONGO_URI or MONGODB_URI in .env"
    );
    return false;
  }

  // Fail fast on queries if disconnected instead of buffering ~10s then timing out.
  mongoose.set("bufferCommands", false);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
    });
    console.log("MongoDB Connected");
    return true;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    return false;
  }
};
