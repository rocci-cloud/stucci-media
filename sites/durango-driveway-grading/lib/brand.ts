import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Is the reversed brand lockup actually on disk?
 *
 * It is pulled from the legacy WordPress library by scripts/fetch-images.mjs,
 * so it can legitimately be absent — a failed fetch, or the old site finally
 * going offline. Rendering a broken <img> where the brand name should be is
 * worse than the type-set wordmark it replaced.
 *
 * Server-only: this touches disk, and every page is statically prerendered, so
 * it resolves once at build time rather than per request. Never import it from
 * a "use client" module — Turbopack will try to bundle node:fs for the browser
 * and the build panics rather than failing gracefully.
 */
export function hasDarkLockup() {
  return existsSync(path.join(process.cwd(), "public", "images/brand/ddg-logo-dark-bg.png"));
}
