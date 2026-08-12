import webpush from "web-push";
import { prisma } from "./prisma";

// Browser Push API delivery for "Breaking News Alerts" — a real published
// article can trigger a push to every stored subscription (see
// sendPushToAllSubscribers below, called from admin/articles/actions.ts on
// publish). Requires VAPID_PRIVATE_KEY/NEXT_PUBLIC_VAPID_PUBLIC_KEY/
// VAPID_SUBJECT to be set (generate a keypair with
// `npx web-push generate-vapid-keys`) — every function here degrades to a
// safe no-op when they're missing rather than throwing, since a missing
// env var shouldn't be able to break publishing an article.
function vapidConfigured() {
  return Boolean(process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_SUBJECT);
}

let configured = false;
function ensureConfigured() {
  if (configured || !vapidConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export async function saveSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userId: string | null
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userId },
    update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userId },
  });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function hasSubscription(endpoint: string): Promise<boolean> {
  const row = await prisma.pushSubscription.findUnique({ where: { endpoint }, select: { id: true } });
  return Boolean(row);
}

// Fire-and-forget from the article publish action — never awaited by the
// caller, so a slow/failed push send can't delay or break saving the
// article. A subscription whose endpoint has gone stale (410/404 from the
// push service — the browser unsubscribed, uninstalled, etc.) is deleted
// so it stops being retried forever.
export async function sendPushToAllSubscribers(payload: { title: string; body: string; url: string }): Promise<void> {
  if (!vapidConfigured()) return;
  ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany();
  const json = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          json
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
