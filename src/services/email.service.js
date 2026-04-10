import nodemailer from "nodemailer";
import { getBackendPublicOrigin } from "../config/public-url.js";

export function isEmailTransportConfigured() {
  return Boolean(trimEnv(process.env.EMAIL_USER) && normalizeGmailAppPassword(process.env.EMAIL_PASS));
}

function trimEnv(v) {
  return typeof v === "string" ? v.trim().replace(/^["']|["']$/g, "") : "";
}

/** Gmail app passwords are 16 chars; Google often shows them with spaces — strip spaces and quotes. */
function normalizeGmailAppPassword(pass) {
  if (!pass || typeof pass !== "string") return "";
  let p = pass.trim();
  if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
    p = p.slice(1, -1);
  }
  return p.replace(/\s+/g, "");
}

function getClientOrigin() {
  const origin = trimEnv(process.env.CLIENT_URL);
  return origin ? origin.replace(/\/$/, "") : "";
}

/**
 * Sends email verification link with raw token (only the hash is stored in DB).
 * Does not throw: returns { sent, reason? } so registration can still succeed.
 */
export async function sendVerificationEmail(email, rawVerificationToken) {
  const user = trimEnv(process.env.EMAIL_USER);
  const pass = normalizeGmailAppPassword(process.env.EMAIL_PASS);

  if (!user || !pass) {
    return {
      sent: false,
      reason: "Email is not configured (set EMAIL_USER and EMAIL_PASS)",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    const clientOrigin = getClientOrigin();
    const backendOrigin = getBackendPublicOrigin();
    const url = clientOrigin
      ? `${clientOrigin}/verify/${rawVerificationToken}`
      : `${backendOrigin}/api/auth/verify/${rawVerificationToken}`;

    await transporter.sendMail({
      to: email,
      subject: "Verify your email",
      html: `<h3>Click to verify</h3><p><a href="${url}">${url}</a></p>`,
    });

    return { sent: true };
  } catch (e) {
    const reason = e?.message || "Failed to send verification email";
    console.error("[email] sendVerificationEmail:", reason);
    return { sent: false, reason };
  }
}
