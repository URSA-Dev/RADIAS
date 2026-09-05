/**
 * POST /api/login  { email, password }  ->  sets the session cookie.
 *
 * The credentials live in environment variables and are compared here, on the
 * server. Neither value is ever sent to the browser.
 */

import { buildCookie, buildUserCookie, safeEqual, signToken, MAX_AGE_SECONDS } from "./_session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { AUTH_EMAIL, AUTH_PASSWORD, AUTH_SECRET } = process.env;
  if (!AUTH_EMAIL || !AUTH_PASSWORD || !AUTH_SECRET) {
    console.error("login: missing AUTH_EMAIL, AUTH_PASSWORD or AUTH_SECRET");
    return res.status(503).json({ error: "Authentication is not configured." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  // Compare both, always, so the response time does not reveal which was wrong.
  const emailOk = safeEqual(email, AUTH_EMAIL.trim().toLowerCase());
  const passOk = safeEqual(password, AUTH_PASSWORD);

  if (!emailOk || !passOk) {
    // One message for every failure mode — do not disclose which field was wrong.
    return res.status(401).json({ error: "That email and password combination was not recognised." });
  }

  const token = await signToken(AUTH_SECRET, Date.now() + MAX_AGE_SECONDS * 1000);
  res.setHeader("Set-Cookie", [
    buildCookie(token, MAX_AGE_SECONDS),
    buildUserCookie(AUTH_EMAIL, MAX_AGE_SECONDS),
  ]);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true, email: AUTH_EMAIL });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
