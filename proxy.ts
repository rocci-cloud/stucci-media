import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Cheap, edge-safe check: does a session cookie exist at all? This can't
// verify the session or role (that needs a DB round trip, which the edge
// runtime here isn't set up for) — the real ADMIN-role check happens in
// app/admin/layout.tsx via auth.api.getSession(). A signed-out visitor is
// redirected here; a signed-in non-admin is redirected there.
//
// A previous version of this file also redirected www.stuccimedia.com to
// the apex domain, on the mistaken assumption that apex was the site's
// actual canonical host. It turned out Vercel's own domain configuration
// already redirects the apex domain to www at the platform edge, ahead
// of this middleware ever running — so that redirect fought Vercel's,
// producing an infinite redirect loop that took the whole site down.
// www is the real canonical host (see PRODUCTION_URL in app/lib/auth.ts
// and siteUrl in app/layout.tsx, app/robots.ts, app/sitemap.ts — all
// updated to match), so no in-app redirect is needed here at all.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
