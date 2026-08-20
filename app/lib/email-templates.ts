import type { DigestArticle } from "./digest";
import type { Submission } from "./submissions";

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

// Email clients strip <style> blocks and ignore most modern CSS, so every
// rule here is inline and the layout is a table. Colours match the site's
// tokens by value rather than by var() for the same reason.
const NAVY = "#0a1628";
const RED = "#c8102e";
const TEXT = "#14181f";
const GRAY = "#55606c";
const HAIRLINE = "#dde1e9";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(bodyHtml: string, preheader: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef1f6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${HAIRLINE};">
        <tr><td style="background:${NAVY};padding:22px 24px;text-align:center;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:bold;letter-spacing:-0.4px;color:#ffffff;text-transform:uppercase;">
            STUCCI<span style="color:${RED};">MEDIA</span>
          </div>
        </td></tr>
        ${bodyHtml}
        <tr><td style="border-top:1px solid ${HAIRLINE};padding:18px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:${GRAY};">
          You're receiving this because you subscribed at
          <a href="${siteUrl}" style="color:${RED};text-decoration:none;">stuccimedia.com</a>.<br>
          <a href="${siteUrl}/unsubscribe" style="color:${GRAY};">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function welcomeEmail(): { subject: string; html: string; text: string } {
  const subject = "You're on the list — Stucci Media";
  const body = `
    <tr><td style="padding:28px 24px 8px;font-family:Arial,Helvetica,sans-serif;">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:${TEXT};">Welcome to Stucci Media.</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${GRAY};">
        You'll get the stories mainstream media won't run — politics, investigations, veterans,
        crime, and the social fights shaping the country. No corporate spin, no filler.
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${GRAY};">
        Nothing to do now. The next brief lands in your inbox.
      </p>
      <a href="${siteUrl}" style="display:inline-block;background:${RED};color:#ffffff;font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;text-decoration:none;padding:13px 24px;">
        Read today's stories
      </a>
    </td></tr>
    <tr><td style="height:28px;"></td></tr>`;
  const text = `Welcome to Stucci Media.

You'll get the stories mainstream media won't run — politics, investigations,
veterans, crime, and the social fights shaping the country. No corporate spin,
no filler.

Read today's stories: ${siteUrl}`;
  return { subject, html: shell(body, "The stories mainstream media won't run."), text };
}

export function digestEmail(articles: DigestArticle[]): {
  subject: string;
  html: string;
  text: string;
} {
  const lead = articles[0];
  const subject = lead ? `This week: ${lead.headline}` : "Your weekly brief from Stucci Media";

  const items = articles
    .map(
      (a, i) => `
      <tr><td style="padding:18px 24px;border-top:1px solid ${HAIRLINE};font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:${RED};">
          ${i + 1} &middot; ${escapeHtml(a.category)}
        </div>
        <a href="${siteUrl}/articles/${encodeURIComponent(a.slug)}" style="display:block;margin:6px 0 6px;font-size:17px;font-weight:bold;line-height:1.3;color:${TEXT};text-decoration:none;">
          ${escapeHtml(a.headline)}
        </a>
        <p style="margin:0;font-size:14px;line-height:1.55;color:${GRAY};">${escapeHtml(a.dek)}</p>
      </td></tr>`
    )
    .join("");

  const body = `
    <tr><td style="padding:24px 24px 4px;font-family:Arial,Helvetica,sans-serif;">
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${GRAY};">
        Your Weekly Brief
      </div>
    </td></tr>
    ${items}
    <tr><td style="padding:22px 24px 28px;font-family:Arial,Helvetica,sans-serif;">
      <a href="${siteUrl}" style="display:inline-block;background:${RED};color:#ffffff;font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;text-decoration:none;padding:13px 24px;">
        Read everything
      </a>
    </td></tr>`;

  const text = [
    "YOUR WEEKLY BRIEF — STUCCI MEDIA",
    "",
    ...articles.map(
      (a, i) =>
        `${i + 1}. ${a.headline}\n   ${a.dek}\n   ${siteUrl}/articles/${encodeURIComponent(a.slug)}`
    ),
    "",
    `Read everything: ${siteUrl}`,
  ].join("\n");

  return {
    subject,
    html: shell(body, lead?.dek ?? "This week's reporting from Stucci Media."),
    text,
  };
}


/** Sent to the site owner when someone writes in. */
export function submissionNotificationEmail(submission: Submission): {
  subject: string;
  html: string;
  text: string;
} {
  const isPodcast = submission.kind === "PODCAST";
  const subject = isPodcast
    ? `Podcast pitch: ${submission.showName ?? submission.name}`
    : `Contact form: ${submission.subject || submission.name}`;

  const rows: Array<[string, string]> = [
    ["From", `${submission.name} <${submission.email}>`],
    ...(submission.contact ? ([["Contact", submission.contact]] as Array<[string, string]>) : []),
    ...(submission.showName ? ([["Show", submission.showName]] as Array<[string, string]>) : []),
    ...(submission.feedUrl ? ([["RSS feed", submission.feedUrl]] as Array<[string, string]>) : []),
    ...(submission.subject ? ([["Subject", submission.subject]] as Array<[string, string]>) : []),
  ];

  const body = `
    <tr><td style="padding:26px 24px 6px;font-family:Arial,Helvetica,sans-serif;">
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${RED};">
        ${isPodcast ? "Podcast pitch" : "New message"}
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;width:100%;">
        ${rows
          .map(
            ([label, value]) => `<tr>
              <td style="padding:5px 12px 5px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:5px 0;font-size:14px;color:${TEXT};">${escapeHtml(value)}</td>
            </tr>`
          )
          .join("")}
      </table>
      <div style="margin-top:18px;padding:14px 16px;background:#f2f4f8;border-left:3px solid ${NAVY};font-size:14px;line-height:1.6;color:${TEXT};white-space:pre-wrap;">${escapeHtml(
        submission.message
      )}</div>
      <p style="margin:18px 0 0;font-size:13px;color:${GRAY};">
        Reply straight to this email to answer them, or open it in
        <a href="${siteUrl}/admin/inbox" style="color:${RED};">the admin inbox</a>.
      </p>
    </td></tr>
    <tr><td style="height:24px;"></td></tr>`;

  const text = [
    isPodcast ? "PODCAST PITCH" : "NEW MESSAGE",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    submission.message,
    "",
    `Admin inbox: ${siteUrl}/admin/inbox`,
  ].join("\n");

  return { subject, html: shell(body, submission.message.slice(0, 120)), text };
}

/** Sent back to whoever submitted, so they know it arrived. */
export function submissionReceiptEmail(submission: Submission): {
  subject: string;
  html: string;
  text: string;
} {
  const isPodcast = submission.kind === "PODCAST";
  const subject = isPodcast
    ? "We got your podcast submission"
    : "We got your message";

  const lead = isPodcast
    ? `Thanks for sending over ${escapeHtml(submission.showName ?? "your show")}. Every show is reviewed by hand before it goes on the site, so this isn't automatic — we'll be in touch either way.`
    : "Thanks for writing in. We read everything that comes through and we'll get back to you.";

  const body = `
    <tr><td style="padding:28px 24px 10px;font-family:Arial,Helvetica,sans-serif;">
      <h1 style="margin:0 0 12px;font-size:21px;line-height:1.25;color:${TEXT};">${
        isPodcast ? "Your submission is in." : "Message received."
      }</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${GRAY};">${lead}</p>
      <div style="padding:14px 16px;background:#f2f4f8;border-left:3px solid ${NAVY};font-size:14px;line-height:1.6;color:${TEXT};white-space:pre-wrap;">${escapeHtml(
        submission.message
      )}</div>
    </td></tr>
    <tr><td style="height:26px;"></td></tr>`;

  const text = `${isPodcast ? "Your submission is in." : "Message received."}

${isPodcast ? `Thanks for sending over ${submission.showName ?? "your show"}. Every show is reviewed by hand before it goes on the site, so this isn't automatic — we'll be in touch either way.` : "Thanks for writing in. We read everything that comes through and we'll get back to you."}

What you sent:
${submission.message}`;

  return { subject, html: shell(body, lead.slice(0, 120)), text };
}
