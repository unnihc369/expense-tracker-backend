/**
 * Public origin of this Express API (no trailing slash).
 * Used for links in emails and logs — NOT the Next.js app URL (CLIENT_URL).
 */
export function getBackendPublicOrigin() {
  const explicit = process.env.BACKEND_PUBLIC_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const port = process.env.PORT || 8080;
  return `http://localhost:${port}`;
}
