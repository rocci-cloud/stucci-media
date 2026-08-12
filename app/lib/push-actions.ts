"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { saveSubscription, removeSubscription } from "./push";

export type PushActionResult = { success: true } | { success: false; error: string };

// Anonymous-friendly by design — a signed-out visitor can still opt into
// browser push alerts for the device they're on, same as most news sites'
// push prompts don't require an account. If a session does exist, the
// subscription is tied to it too (not currently used for anything, but
// keeps the door open for a future "manage your alerts" account page).
export async function subscribeToPushAction(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<PushActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    await saveSubscription(subscription, session?.user.id ?? null);
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't save your subscription." };
  }
}

export async function unsubscribeFromPushAction(endpoint: string): Promise<PushActionResult> {
  try {
    await removeSubscription(endpoint);
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't remove your subscription." };
  }
}
