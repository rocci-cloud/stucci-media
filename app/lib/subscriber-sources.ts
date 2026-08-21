/**
 * Newsletter capture points, and the validation for them.
 *
 * Split out of subscribers.ts (which imports the Prisma client at module
 * scope) so this can be unit tested without a database, and so a client
 * component could import the labels without dragging Prisma into the
 * browser bundle. Same reason banner-placements.ts exists.
 */

export const SUBSCRIBER_SOURCE_LABELS: Record<string, string> = {
  modal: "Newsletter popup",
  article: "Article page",
  "homepage-strip": "Homepage strip",
  sidebar: "Sidebar",
  "subscribe-page": "Subscribe page",
  unknown: "Unknown",
};

/**
 * Validate a client-supplied source against the allowlist.
 *
 * Uses Object.hasOwn, NOT the `in` operator. `in` walks the prototype
 * chain, so `"toString" in SUBSCRIBER_SOURCE_LABELS` is true and a form
 * post of `source=toString` would sail through the allowlist. The stored
 * value then made subscriberSourceLabel return Object.prototype.toString
 * itself — a function — which React cannot render, taking down the admin
 * subscribers page for anyone who opened it. Any visitor could have done
 * that from the public newsletter form.
 */
export function normalizeSubscriberSource(raw: unknown): string {
  if (typeof raw !== "string") return "unknown";
  const value = raw.trim();
  return Object.hasOwn(SUBSCRIBER_SOURCE_LABELS, value) ? value : "unknown";
}

/**
 * Display label for a stored source.
 *
 * Also guarded with Object.hasOwn rather than a bare lookup, so that even a
 * row written before the validation above (or by hand) renders as a string
 * instead of returning an inherited function and crashing the page.
 */
export function subscriberSourceLabel(source: string | null): string {
  if (!source) return "Before tracking";
  return Object.hasOwn(SUBSCRIBER_SOURCE_LABELS, source) ? SUBSCRIBER_SOURCE_LABELS[source] : source;
}
