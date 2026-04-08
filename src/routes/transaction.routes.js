import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionsByUserEmail,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/user/:email", getTransactionsByUserEmail);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
