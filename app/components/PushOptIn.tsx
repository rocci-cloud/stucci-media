"use client";

import { Bell, BellRing } from "lucide-react";
import { usePushSubscription } from "./usePushSubscription";

// A small header bell toggling browser Push API "Breaking News Alerts."
// Renders nothing on browsers without Push API/Service Worker support, and
// nothing at all until we know whether VAPID is actually configured — no
// dead button promising a feature the environment can't deliver.
export default function PushOptIn() {
  const { supported, subscribed, busy, toggle } = usePushSubscription();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={subscribed ? "Turn off breaking news alerts" : "Turn on breaking news alerts"}
      aria-pressed={subscribed}
      title={subscribed ? "Breaking news alerts on" : "Get breaking news alerts"}
      className={`min-w-11 min-h-11 flex items-center justify-center transition-colors ${
        subscribed ? "text-[var(--color-red-ink)]" : "text-white hover:text-white/80"
      }`}
    >
      {subscribed ? <BellRing className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
    </button>
  );
}
