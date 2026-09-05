/** POST /api/logout — expires the session cookie. */

import { buildCookie, buildUserCookie } from "./_session.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", [buildCookie("", 0), buildUserCookie("", 0)]);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true });
}
