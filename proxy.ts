import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Cheap, edge-safe check: does a session cookie exist at all? This can't
// verify the session or role (that needs a DB round trip, which the edge
// runtime here isn't set up for) — the real ADMIN-role check happens in
// app/admin/layout.tsx via auth.api.getSession(). A signed-out visitor is
// redirected here; a signed-in non-admin is redirected there.
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
