import rateLimit from "express-rate-limit";

function hasBearerToken(req) {
  const auth = req.headers.authorization;
  return Boolean(auth && auth.startsWith("Bearer "));
}

function ms(name, fallback) {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function max(name, fallback) {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function buildLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => hasBearerToken(req),
    message: {
      message,
      code: "RATE_LIMITED",
    },
  });
}

export const publicApiRateLimiter = buildLimiter({
  windowMs: ms("PUBLIC_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: max("PUBLIC_RATE_LIMIT_MAX", 120),
  message: "Too many unauthenticated requests. Please try again later.",
});

export const authRateLimiter = buildLimiter({
  windowMs: ms("AUTH_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: max("AUTH_RATE_LIMIT_MAX", 20),
  message: "Too many auth requests. Please wait before trying again.",
});
