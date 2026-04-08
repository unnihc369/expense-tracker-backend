import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

const isConnected = await connectDB();
if (!isConnected) {
  if (process.env.ALLOW_START_WITHOUT_DB === "true") {
    console.warn(
      "WARNING: Server starting without MongoDB (ALLOW_START_WITHOUT_DB=true). API will error until DB is available."
    );
  } else {
    console.error(
      "Exiting: could not connect to MongoDB. Set MONGO_URI or MONGODB_URI, verify the URI, network, and Atlas IP access list."
    );
    process.exit(1);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
