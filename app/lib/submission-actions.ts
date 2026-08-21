"use server";

import { createSubmission, countRecentFromEmail, type SubmissionKind } from "./submissions";
import { sendEmail } from "./email";
import { submissionNotificationEmail, submissionReceiptEmail } from "./email-templates";
import { getSiteSettings } from "./settings";

export type SubmissionFormState = { error?: string; success?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  name: 100,
  email: 200,
  contact: 200,
  subject: 150,
  showName: 150,
  feedUrl: 500,
  message: 4000,
};

/** Per-email ceiling in one hour — see countRecentFromEmail for why email. */
const MAX_PER_HOUR = 3;

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function submitToInboxAction(
  _prev: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const rawKind = String(formData.get("kind") || "GENERAL");
  const kind = (
    rawKind === "PODCAST" || rawKind === "FEATURE_ARTICLE" ? rawKind : "GENERAL"
  ) as SubmissionKind;

  // Honeypot: a field hidden from people but not from most bots. Anything
  // that fills it gets the success screen and nothing gets stored, so a
  // scripted submitter has no signal that it was rejected.
  if (String(formData.get("website") || "").trim() !== "") {
    return { success: true };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const contact = String(formData.get("contact") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const showName = String(formData.get("showName") || "").trim();
  const feedUrl = String(formData.get("feedUrl") || "").trim();

  if (!name) return { error: "Enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!message) {
    return {
      error: kind === "PODCAST" ? "Tell us about your show." : "Enter a message.",
    };
  }

  if (
    tooLong(name, LIMITS.name) ||
    tooLong(email, LIMITS.email) ||
    tooLong(contact, LIMITS.contact) ||
    tooLong(subject, LIMITS.subject) ||
    tooLong(showName, LIMITS.showName) ||
    tooLong(feedUrl, LIMITS.feedUrl) ||
    tooLong(message, LIMITS.message)
  ) {
    return { error: "That's longer than we can accept — please shorten it." };
  }

  if (kind === "PODCAST") {
    if (!showName) return { error: "Enter the name of your show." };
    if (!feedUrl) return { error: "Enter your show's RSS feed URL." };
    if (!isHttpUrl(feedUrl)) {
      return { error: "Your RSS feed needs to be a full http:// or https:// URL." };
    }
  }

  // The feature-article questionnaire asks a handful of extra questions.
  // They're folded into the message body with labels rather than given
  // their own columns: they're free text an editor reads once, not
  // structured data anything queries, and a table shaped around one form
  // ages badly.
  let composedMessage = message;
  if (kind === "FEATURE_ARTICLE") {
    const answers: [string, string][] = [
      ["Business / subject", String(formData.get("business") || "").trim()],
      ["Website or social", String(formData.get("businessUrl") || "").trim()],
      ["What they do", String(formData.get("about") || "").trim()],
      ["What to highlight", message],
      ["Timing", String(formData.get("timing") || "").trim()],
    ];
    composedMessage = answers
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}:\n${value}`)
      .join("\n\n")
      .slice(0, LIMITS.message);
  }

  try {
    if ((await countRecentFromEmail(email)) >= MAX_PER_HOUR) {
      return {
        error: "You've already sent us a few messages — give us a little time to read those first.",
      };
    }

    const submission = await createSubmission({
      kind,
      name,
      email,
      contact: contact || null,
      subject: subject || null,
      message: composedMessage,
      showName: showName || null,
      feedUrl: feedUrl || null,
    });

    // Both fire-and-forget: the submission is already saved, and a mail
    // provider that's slow, down or simply unconfigured must not turn a
    // successful submission into an error the sender sees.
    const settings = await getSiteSettings().catch(() => null);
    const owner = settings?.contactEmail || process.env.EMAIL_FROM || "";
    if (owner) {
      const mail = submissionNotificationEmail(submission);
      void sendEmail({ to: owner, subject: mail.subject, html: mail.html, text: mail.text, replyTo: email }).catch(
        () => {}
      );
    }
    const receipt = submissionReceiptEmail(submission);
    void sendEmail({ to: email, subject: receipt.subject, html: receipt.html, text: receipt.text }).catch(
      () => {}
    );

    return { success: true };
  } catch {
    return { error: "Something went wrong sending that. Try again in a moment." };
  }
}
