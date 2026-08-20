"use server";

import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";
import { getAllSubscribers } from "../../lib/subscribers";
import { getTopArticlesThisWeek } from "../../lib/digest";
import { digestEmail } from "../../lib/email-templates";
import { isEmailConfigured, sendBulkEmail, sendEmail } from "../../lib/email";

export type SendDigestResult =
  | { success: true; sent: number; failed: number; test: boolean }
  | { success: false; error: string };

/**
 * Sends the general (most-read this week) digest.
 *
 * `testTo` sends a single copy to one address instead of the whole list —
 * the only safe way to check the real rendered email in a real client before
 * mailing every subscriber, so it's the default path in the UI.
 */
export async function sendDigestAction(testTo?: string): Promise<SendDigestResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "You must be signed in as an admin to do that." };

  if (!isEmailConfigured()) {
    return {
      success: false,
      error: "No email provider is configured. Set RESEND_API_KEY and EMAIL_FROM, then redeploy.",
    };
  }

  const articles = await getTopArticlesThisWeek();
  if (articles.length === 0) {
    return {
      success: false,
      error: "Nothing has been published in the last week — there's no digest to send.",
    };
  }

  const { subject, html, text } = digestEmail(articles);

  if (testTo) {
    const result = await sendEmail({ to: testTo, subject, html, text });
    if (!result.ok) {
      return {
        success: false,
        error: result.reason === "not-configured" ? "No email provider is configured." : result.error ?? "Send failed.",
      };
    }
    await logActivity({
      actor: session.user,
      action: "digest.test_sent",
      targetType: "digest",
      targetLabel: testTo,
    });
    return { success: true, sent: 1, failed: 0, test: true };
  }

  const subscribers = await getAllSubscribers();
  if (subscribers.length === 0) {
    return { success: false, error: "There are no subscribers to send to yet." };
  }

  const result = await sendBulkEmail({
    recipients: subscribers.map((s) => s.email),
    subject,
    html,
    text,
  });

  await logActivity({
    actor: session.user,
    action: "digest.sent",
    targetType: "digest",
    targetLabel: `${result.sent} sent, ${result.failed} failed`,
  });

  return { success: true, sent: result.sent, failed: result.failed, test: false };
}
