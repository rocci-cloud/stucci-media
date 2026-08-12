import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const CANONICAL_HOST = "stuccimedia.com";

// `www.stuccimedia.com` and `stuccimedia.com` turned out to both be live,
// independent hosts on Vercel with no platform-level redirect tying them
// together — discovered when a real admin login on the apex domain
// landed back on the www domain afterward, with the just-set session
// cookie left behind (a cookie is only ever visible to the host it was
// actually set on). Canonicalizing every request to the apex host here,
// before anything else runs, means the two domains can never again
// silently diverge mid-flow and strand a signed-in session — and it
// closes a duplicate-content SEO gap the same way, since `metadataBase`
// (app/layout.tsx) and the hardcoded auth origin (app/lib/auth.ts) both
// already assume the apex domain is the one true URL.
//
// Cheap, edge-safe admin check: does a session cookie exist at all? This
// can't verify the session or role (that needs a DB round trip, which
// the edge runtime here isn't set up for) — the real ADMIN-role check
// happens in app/admin/layout.tsx via auth.api.getSession(). A
// signed-out visitor is redirected here; a signed-in non-admin is
// redirected there.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host");

  if (host === `www.${CANONICAL_HOST}`) {
    return NextResponse.redirect(new URL(`https://${CANONICAL_HOST}${pathname}${search}`), 308);
  }

  if (pathname.startsWith("/admin") && !getSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
