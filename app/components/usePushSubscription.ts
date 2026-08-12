import { useEffect, useState } from "react";
import { subscribeToPushAction, unsubscribeFromPushAction } from "../lib/push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Shared Push API subscribe/unsubscribe logic behind the header bell
// (PushOptIn) and the mobile drawer's labeled row (PushOptInRow) — same
// state machine, two different visual treatments.
export function usePushSubscription() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        const existing = await registration.pushManager.getSubscription();
        setSubscribed(Boolean(existing));
      })
      .catch(() => {});
  }, []);

  async function toggle() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || busy) return;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (subscribed) {
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await unsubscribeFromPushAction(existing.endpoint);
          await existing.unsubscribe();
        }
        setSubscribed(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
      await subscribeToPushAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setSubscribed(true);
    } catch {
      // Permission denial, an unsupported browser mid-flow, etc.
    } finally {
      setBusy(false);
    }
  }

  return { supported, subscribed, busy, toggle };
}
