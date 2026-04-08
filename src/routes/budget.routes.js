import express from "express";
import {
  getBudget,
  listBudgetMonths,
  upsertBudget,
} from "../controllers/budget.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getBudget);
router.get("/months", listBudgetMonths);
router.put("/", upsertBudget);
router.post("/", upsertBudget);

export default router;
