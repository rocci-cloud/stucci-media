import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import {
  applyUtmOverride,
  articleSlugFromPath,
  classifyReferrer,
  isBot,
  isPlausibleDuration,
  isPlausibleScrollPct,
  normalizePath,
  pageTypeFor,
  parseUserAgent,
} from "../../../lib/analytics-classify";

// This endpoint is public by necessity — it is called by every visitor's
// browser — so nothing it receives is trusted. Device, country, and the
// visitor identity are all derived server-side from request headers rather
// than read from the body; the client only gets to say which page it is on,
// how long it stayed, and how far it scrolled, and each of those is
// range-checked before it is stored.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com")
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");

/**
 * A per-day, per-visitor identifier that is not a cookie and cannot be
 * reversed into an IP.
 *
 * Salted with the app's existing SESSION_SECRET and rotated by UTC date, so
 * the same person is one visitor today and an unrelated hash tomorrow. This
 * is the standard privacy-preserving approach (Plausible and Fathom both do
 * it) and it is why this feature needs no cookie banner. The honest cost is
 * that "unique visitors" means unique-per-day and cannot be summed across
 * days without double counting, which the query layer is careful about.
 */
function visitorHashFor(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.SESSION_SECRET ?? "stucci-analytics";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

function clientIp(headers: Headers): string {
  // Vercel sets x-forwarded-for; the first entry is the real client.
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

type PageViewBody = {
  type?: "pageview";
  path?: unknown;
  referrer?: unknown;
  sessionId?: unknown;
};

type EngagementBody = {
  type?: "engagement";
  viewId?: unknown;
  durationMs?: unknown;
  scrollPct?: unknown;
};

function str(v: unknown, max = 512): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

/**
 * A cheap same-origin check.
 *
 * This is a public write endpoint, so it is worth making it awkward to
 * spam from a script. A real browser always sends Origin (fetch) or at
 * least Referer (sendBeacon) on a same-origin POST; a bare curl sends
 * neither. This does not stop a determined attacker who copies the
 * headers, and it is not pretending to: it filters out drive-by noise.
 * Genuine rate limiting needs a shared counter store, which this project
 * does not have yet.
 */
function isSameOrigin(headers: Headers): boolean {
  const candidate = headers.get("origin") ?? headers.get("referer");
  if (!candidate) return false;
  try {
    const host = new URL(candidate).hostname.replace(/^www\./, "");
    if (host === SITE_HOST.replace(/^www\./, "")) return true;
    // The tracker itself is mounted production-only (see layout.tsx), so
    // these branches are not on the normal path. They are kept so the
    // collector still works if the tracker is ever un-gated for a local
    // debugging session, rather than failing in a way that looks like a
    // bug in the collector.
    if (process.env.NODE_ENV !== "production") return host === "localhost" || host === "127.0.0.1";
    return host.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request.headers)) return new NextResponse(null, { status: 204 });

  let body: PageViewBody & EngagementBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // --- Engagement beacon: fills in duration and scroll depth on an
  // existing row. Matched on the session as well as the id so one visitor
  // cannot rewrite another's row by guessing an id.
  if (body.type === "engagement") {
    const viewId = str(body.viewId, 64);
    const sessionId = str(body.sessionId, 64);
    if (!viewId || !sessionId) return NextResponse.json({ ok: false }, { status: 400 });

    const data: { durationMs?: number; scrollPct?: number } = {};
    if (isPlausibleDuration(body.durationMs)) data.durationMs = Math.round(body.durationMs);
    if (isPlausibleScrollPct(body.scrollPct)) data.scrollPct = Math.round(body.scrollPct);
    if (Object.keys(data).length === 0) return new NextResponse(null, { status: 204 });

    try {
      await prisma.pageView.updateMany({ where: { id: viewId, sessionId }, data });
    } catch {
      // Analytics must never surface an error to a reader.
    }
    return new NextResponse(null, { status: 204 });
  }

  // --- Page view.
  const userAgent = request.headers.get("user-agent");

  // Dropped before anything is written. Counting crawlers and link-preview
  // scrapers as readers is exactly what made the old view counter useless.
  if (isBot(userAgent)) return new NextResponse(null, { status: 204 });

  const rawPath = str(body.path, 1024);
  const sessionId = str(body.sessionId, 64);
  if (!rawPath || !rawPath.startsWith("/") || !sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = normalizePath(rawPath);
  const referrer = str(body.referrer, 1024);

  // UTM values come off the URL the browser actually has, not the body.
  let utmSource: string | null = null;
  let utmMedium: string | null = null;
  let utmCampaign: string | null = null;
  const qIndex = rawPath.indexOf("?");
  if (qIndex >= 0) {
    const params = new URLSearchParams(rawPath.slice(qIndex + 1));
    utmSource = str(params.get("utm_source"), 128);
    utmMedium = str(params.get("utm_medium"), 128);
    utmCampaign = str(params.get("utm_campaign"), 128);
  }

  const { source: referrerSource, referrerDomain } = classifyReferrer(referrer, SITE_HOST);
  const source = applyUtmOverride(referrerSource, utmMedium, utmSource);
  const { device, browser, os } = parseUserAgent(userAgent ?? "");

  // Vercel resolves geo at the edge and forwards it as a header; there is no
  // IP lookup happening here and no IP stored anywhere.
  const country = request.headers.get("x-vercel-ip-country");

  const slug = articleSlugFromPath(path);

  try {
    let articleId: number | null = null;
    if (slug) {
      const article = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
      articleId = article?.id ?? null;
    }

    // Guard against double-fires: React re-mounts, a fast refresh, or a
    // back/forward navigation can all replay the same page within a second
    // or two, and each one would otherwise land as a separate view.
    const recent = await prisma.pageView.findFirst({
      where: { sessionId, path, createdAt: { gte: new Date(Date.now() - 10_000) } },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (recent) return NextResponse.json({ id: recent.id });

    const view = await prisma.pageView.create({
      data: {
        path,
        pageType: pageTypeFor(path),
        articleId,
        sessionId,
        visitorHash: visitorHashFor(clientIp(request.headers), userAgent ?? ""),
        referrer,
        referrerDomain,
        source,
        utmSource,
        utmMedium,
        utmCampaign,
        device,
        browser,
        os,
        country,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: view.id });
  } catch {
    // A failed analytics write is never worth showing a reader an error.
    return new NextResponse(null, { status: 204 });
  }
}
