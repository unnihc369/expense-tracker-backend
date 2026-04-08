import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

let dbReadyPromise;

function ensureDbReady() {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB();
  }
  return dbReadyPromise;
}

export default async function handler(req, res) {
  const isConnected = await ensureDbReady();

  if (!isConnected && process.env.ALLOW_START_WITHOUT_DB !== "true") {
    return res.status(503).json({
      message:
        "Database unavailable. Verify MONGO_URI or MONGODB_URI and Atlas network access.",
      code: "DB_UNAVAILABLE",
    });
  }

  return app(req, res);
}
