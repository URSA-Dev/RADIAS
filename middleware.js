/**
 * The gate. Runs before the CDN cache on every request that could serve the app.
 *
 * Without a valid session cookie the request is rewritten to /login.html, so
 * index.html is never sent. This is the part that makes the protection real:
 * the previous in-app gate shipped the whole application to every visitor and
 * only hid it with CSS.
 *
 * The matcher deliberately lets through the login page, the auth routes and the
 * assets the login page needs — otherwise nobody could ever sign in.
 */

import { next, rewrite } from "@vercel/functions";
import { COOKIE_NAME, readCookie, verifyToken } from "./api/_session.js";

export default async function middleware(request) {
  const secret = process.env.AUTH_SECRET;

  // Fail closed. A missing secret must not silently disable the gate.
  if (!secret) {
    return new Response(
      "Authentication is not configured: AUTH_SECRET is not set on this deployment.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const token = readCookie(request.headers.get("cookie"), COOKIE_NAME);
  if (await verifyToken(token, secret)) return next();

  return rewrite(new URL("/login.html", request.url));
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *   api/          - login and logout must be reachable while signed out
     *   login.html    - the gate would rewrite the login page to itself
     *   assets/       - the login page's logo
     *   favicon.ico, _vercel/  - platform and browser noise
     */
    "/((?!api/|login\.html|assets/|favicon\.ico|_vercel/).*)",
  ],
};
