import express from "express";
import cors from "cors";
import dbCheckRoute from "./routes/dbCheckRoute.js";
import mailTestRoute from "./routes/mailTestRoute.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import accountRoutes from "./routes/account.routes.js";
import creditCardRoutes from "./routes/creditCard.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import loanRoutes from "./routes/loan.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import {
  authRateLimiter,
  publicApiRateLimiter,
} from "./middleware/rate-limit.middleware.js";

const app = express();

const clientUrl = process.env.CLIENT_URL?.trim().replace(/\/$/, "");
const defaultBrowserOrigins = [
  clientUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);
const extraOrigins =
  process.env.CORS_ORIGIN?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
const allowedOrigins = new Set([...defaultBrowserOrigins, ...extraOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", publicApiRateLimiter, (_req, res) => {
  res.status(200).json({ message: "Expense Tracker API running" });
});

app.get("/api/ping", publicApiRateLimiter, (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "pong",
    service: "expense-tracker-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", publicApiRateLimiter, dbCheckRoute);
app.use("/api", publicApiRateLimiter, mailTestRoute);
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/bank-accounts", accountRoutes);
app.use("/api/credit-cards", creditCardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
