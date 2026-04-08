import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sha256Hex, randomTokenHex } from "../utils/hash.js";
import { signAccessToken } from "../utils/jwt.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { getBackendPublicOrigin } from "../config/public-url.js";
import { HttpError } from "../utils/http-error.js";

const VERIFICATION_TTL_MS = Number(process.env.VERIFICATION_TOKEN_TTL_MS) || 48 * 60 * 60 * 1000;
const REFRESH_TTL_MS = Number(process.env.REFRESH_TOKEN_TTL_MS) || 7 * 24 * 60 * 60 * 1000;

function buildAuthResponse(user, accessToken, refreshToken) {
  return {
    accessToken,
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  };
}

function verificationUrlForLogs(rawVerificationToken) {
  return `${getBackendPublicOrigin()}/api/auth/verify/${rawVerificationToken}`;
}

export const register = async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new HttpError(400, "Name is required", { code: "VALIDATION_ERROR" });
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new HttpError(400, "Email is required", { code: "VALIDATION_ERROR" });
  }
  if (!password || typeof password !== "string") {
    throw new HttpError(400, "Password is required", { code: "VALIDATION_ERROR" });
  }
  if (password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters", {
      code: "VALIDATION_ERROR",
    });
  }

  const emailNorm = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: emailNorm });
  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists", {
      code: "EMAIL_EXISTS",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const rawVerificationToken = randomTokenHex(32);
  const verificationTokenHash = sha256Hex(rawVerificationToken);
  const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TTL_MS);

  const user = await User.create({
    name: name.trim(),
    email: emailNorm,
    password: hashedPassword,
    verificationTokenHash,
    verificationTokenExpiry,
    verificationToken: null,
  });

  const sendResult = await sendVerificationEmail(user.email, rawVerificationToken);

  if (sendResult.sent) {
    return res.status(201).json({
      message: "User registered. Check your email to verify your account.",
      emailSent: true,
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  const relaxVerify = !isProd || process.env.DEV_AUTO_VERIFY === "true";

  if (relaxVerify) {
    user.isVerified = true;
    await user.save();
    const link = verificationUrlForLogs(rawVerificationToken);
    console.warn(
      `[auth] Verification email not sent (${sendResult.reason || "unknown"}). Account auto-verified for non-production. If you fix SMTP, manual verify URL: ${link}`
    );
    return res.status(201).json({
      message:
        "Account created. You can sign in now (local/staging: email not sent or SMTP failed — account verified automatically).",
      emailSent: false,
      devAutoVerified: true,
    });
  }

  return res.status(201).json({
    message:
      "Account created but the verification email could not be sent. Try again later or contact support.",
    emailSent: false,
    emailFailureCode: "EMAIL_DELIVERY_FAILED",
    reason: sendResult.reason,
  });
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    throw new HttpError(400, "Verification token is required", { code: "VALIDATION_ERROR" });
  }

  const hash = sha256Hex(token);
  let user = await User.findOne({
    verificationTokenHash: hash,
    verificationTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    user = await User.findOne({ verificationToken: token });
  }

  if (!user) {
    throw new HttpError(400, "Invalid or expired verification link", {
      code: "INVALID_VERIFICATION_TOKEN",
    });
  }

  user.isVerified = true;
  user.verificationTokenHash = null;
  user.verificationTokenExpiry = null;
  user.verificationToken = null;
  await user.save();

  return res.json({ message: "Email verified successfully" });
};

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== "string" || !email.trim()) {
    throw new HttpError(400, "Email is required", { code: "VALIDATION_ERROR" });
  }
  if (!password || typeof password !== "string") {
    throw new HttpError(400, "Password is required", { code: "VALIDATION_ERROR" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  }

  if (!user.isVerified) {
    throw new HttpError(403, "Please verify your email before signing in", {
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  }

  const accessToken = signAccessToken(user);
  const rawRefresh = randomTokenHex(48);
  user.refreshTokenHash = sha256Hex(rawRefresh);
  user.refreshTokenExpiry = new Date(Date.now() + REFRESH_TTL_MS);
  await user.save();

  return res.json(buildAuthResponse(user, accessToken, rawRefresh));
};

export const refresh = async (req, res) => {
  const refreshToken = req.body?.refreshToken;
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new HttpError(400, "refreshToken is required", { code: "VALIDATION_ERROR" });
  }

  const hash = sha256Hex(refreshToken);
  const user = await User.findOne({
    refreshTokenHash: hash,
    refreshTokenExpiry: { $gt: new Date() },
    isVerified: true,
  });
  if (!user) {
    throw new HttpError(401, "Invalid or expired refresh token", { code: "INVALID_REFRESH_TOKEN" });
  }

  const accessToken = signAccessToken(user);
  const rawRefresh = randomTokenHex(48);
  user.refreshTokenHash = sha256Hex(rawRefresh);
  user.refreshTokenExpiry = new Date(Date.now() + REFRESH_TTL_MS);
  await user.save();

  return res.json(buildAuthResponse(user, accessToken, rawRefresh));
};

export const logout = async (req, res) => {
  await User.updateOne(
    { _id: req.user.id },
    { $set: { refreshTokenHash: null, refreshTokenExpiry: null } }
  );
  return res.json({ message: "Logged out" });
};
