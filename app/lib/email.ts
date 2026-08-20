import { Resend } from "resend";

/**
 * Outbound email.
 *
 * Every function here degrades to a no-op when RESEND_API_KEY isn't set, the
 * same way lib/push.ts handles missing VAPID keys — a missing environment
 * variable must never be able to break signing up for the newsletter or
 * publishing an article. Callers get a typed result and can tell "not
 * configured" apart from "tried and failed".
 *
 * Required environment variables to actually send:
 *   RESEND_API_KEY   an API key from resend.com
 *   EMAIL_FROM       a verified sender, e.g. "Stucci Media <news@stuccimedia.com>"
 */

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "not-configured" | "failed"; error?: string };

const FALLBACK_FROM = "Stucci Media <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** The address emails are sent from, or null when nothing is configured. */
export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || FALLBACK_FROM;
}

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { ok: false, reason: "not-configured" };

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });
    if (error) return { ok: false, reason: "failed", error: error.message };
    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      reason: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sends the same message to many recipients, one request per address.
 *
 * Deliberately not a single send with everyone in `to`: that would expose
 * the whole subscriber list in the headers of every email. Batched with a
 * small concurrency limit so a large list doesn't open hundreds of
 * simultaneous connections.
 */
export async function sendBulkEmail(params: {
  recipients: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: number; failed: number; skipped: boolean; errors: string[] }> {
  if (!isEmailConfigured()) {
    return { sent: 0, failed: 0, skipped: true, errors: [] };
  }

  const CONCURRENCY = 5;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < params.recipients.length; i += CONCURRENCY) {
    const batch = params.recipients.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((to) =>
        sendEmail({ to, subject: params.subject, html: params.html, text: params.text })
      )
    );
    for (const result of results) {
      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
        // Only keep a few — a whole list failing the same way doesn't need
        // one error string per recipient.
        if (result.error && errors.length < 3) errors.push(result.error);
      }
    }
  }

  return { sent, failed, skipped: false, errors };
}
