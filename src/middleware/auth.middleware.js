import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing Authorization header. Use: Bearer <access_token>",
        code: "AUTH_HEADER_MISSING",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Bearer token is empty",
        code: "AUTH_TOKEN_EMPTY",
      });
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    return next();
  } catch (err) {
    const expired = err?.name === "TokenExpiredError";
    return res.status(401).json({
      message: expired ? "Access token has expired" : "Invalid or expired access token",
      code: expired ? "TOKEN_EXPIRED" : "INVALID_ACCESS_TOKEN",
    });
  }
};
