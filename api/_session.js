/**
 * Signed session token — shared by the middleware gate and the login route.
 *
 * The token is `<expiry>.<hmac>` where the HMAC covers the expiry, keyed on
 * AUTH_SECRET. That is enough for this job: nothing is stored server-side, the
 * cookie cannot be forged without the secret, and it expires on its own.
 *
 * Uses Web Crypto (globalThis.crypto.subtle) so the same code runs in the Edge
 * runtime the middleware uses and the Node runtime the API routes use.
 */

export const COOKIE_NAME = "radias_session";
/* Display-only, readable by page scripts. Carries no authority — the
   HttpOnly session cookie above is the only thing the gate trusts. */
export const USER_COOKIE_NAME = "radias_user";
export const MAX_AGE_SECONDS = 8 * 60 * 60; // one working day

const enc = new TextEncoder();

async function key(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string compare. Avoids leaking how much of a value matched. */
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signToken(secret, expiresAtMs) {
  const payload = String(expiresAtMs);
  const sig = toHex(await crypto.subtle.sign("HMAC", await key(secret), enc.encode(payload)));
  return `${payload}.${sig}`;
}

/** Returns true only for a well-formed, unexpired, correctly signed token. */
export async function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = toHex(await crypto.subtle.sign("HMAC", await key(secret), enc.encode(payload)));
  return safeEqual(sig, expected);
}

export function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export function buildCookie(value, maxAge) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

/** Display-only cookie. Deliberately NOT HttpOnly so the app can show the user. */
export function buildUserCookie(value, maxAge) {
  return [
    `${USER_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${maxAge}`,
  ].join("; ");
}
