import express from "express";
import {
  createCreditCard,
  deleteCreditCard,
  getCreditCardById,
  getCreditCards,
  updateCreditCard,
} from "../controllers/creditCard.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createCreditCard);
router.get("/", getCreditCards);
router.get("/:id", getCreditCardById);
router.put("/:id", updateCreditCard);
router.delete("/:id", deleteCreditCard);

export default router;
