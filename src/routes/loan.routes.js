import express from "express";
import {
  createLoan,
  deleteLoan,
  getLoanById,
  getLoans,
  recordLoanPayment,
  updateLoan,
} from "../controllers/loan.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createLoan);
router.get("/", getLoans);
router.post("/:id/payment", recordLoanPayment);
router.get("/:id", getLoanById);
router.put("/:id", updateLoan);
router.delete("/:id", deleteLoan);

export default router;
