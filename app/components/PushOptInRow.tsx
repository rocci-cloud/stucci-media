"use client";

import { Bell, BellRing } from "lucide-react";
import { usePushSubscription } from "./usePushSubscription";

// Mobile drawer's labeled equivalent of the header's PushOptIn bell —
// same subscribe/unsubscribe state machine, a row treatment to match the
// drawer's other full-width buttons instead of an icon-only control.
export default function PushOptInRow() {
  const { supported, subscribed, busy, toggle } = usePushSubscription();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={subscribed}
      className={`min-h-11 flex items-center justify-center gap-2 rounded-control border font-bold uppercase tracking-wide text-[13px] transition active:scale-[0.98] ${
        subscribed
          ? "border-[var(--color-red)] bg-[var(--color-red)]/10 text-[var(--color-red)]"
          : "border-white/20 text-white/80 hover:text-white"
      }`}
    >
      {subscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {subscribed ? "Alerts On" : "Get Breaking News Alerts"}
    </button>
  );
}
