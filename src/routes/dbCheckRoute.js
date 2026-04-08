import express from "express";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

const router = express.Router();

router.get("/db-check", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "Database is not connected",
      });
    }

    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      success: true,
      message: "Database is connected",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Database is not connected",
      error: error.message,
    });
  }
});

export default router;
