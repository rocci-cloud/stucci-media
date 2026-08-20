"use server";

import { addSubscriber } from "./subscribers";
import { sendEmail } from "./email";
import { welcomeEmail } from "./email-templates";

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

  let isNew = false;
  try {
    isNew = await addSubscriber(email);
  } catch {
    return { error: "Something went wrong. Try again in a moment." };
  }

  // Only for a genuinely new signup — re-submitting an address already on
  // the list shouldn't mail them again. Fire-and-forget so a slow or
  // unconfigured mail provider can't make the form hang or fail; the
  // signup itself is already saved by this point.
  if (isNew) {
    const { subject, html, text } = welcomeEmail();
    void sendEmail({ to: email, subject, html, text }).catch(() => {});
  }

  return { success: true };
}
