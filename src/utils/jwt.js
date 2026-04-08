import jwt from "jsonwebtoken";

export function getAccessSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not configured");
  return s;
}

export function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || getAccessSecret();
}

export function signAccessToken(user) {
  const payload = { id: String(user._id), email: user.email };
  return jwt.sign(payload, getAccessSecret(), {
    // Use e.g. 15m in production; 7d keeps local dev aligned with older clients.
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret());
}

/** Used if you prefer signed refresh JWTs; primary flow uses opaque + DB hash. */
export function signRefreshJwt(user) {
  return jwt.sign({ id: String(user._id), typ: "refresh" }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

export function verifyRefreshJwt(token) {
  return jwt.verify(token, getRefreshSecret());
}
