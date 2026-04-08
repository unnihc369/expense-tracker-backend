import express from "express";
import {
  login,
  logout,
  refresh,
  register,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/verify/:token", verifyEmail);
router.post("/logout", authMiddleware, logout);

export default router;
