"use server";

import { addSubscriber } from "./subscribers";

export type SubscribeFormState = { error?: string; success?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeAction(
  _prevState: SubscribeFormState,
  formData: FormData
): Promise<SubscribeFormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  try {
    await addSubscriber(email);
  } catch {
    return { error: "Something went wrong. Try again in a moment." };
  }

  return { success: true };
}
