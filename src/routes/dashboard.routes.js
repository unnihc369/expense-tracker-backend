import express from "express";
import {
  getCategoryBreakdown,
  getSummary,
  getTrends,
} from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", getSummary);
router.get("/trends", getTrends);
router.get("/category-breakdown", getCategoryBreakdown);

export default router;
