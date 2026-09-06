"use server";

import { site } from "@/content/site";
import { ISSUE_OPTIONS } from "@/content/form-options";

export type ConsultationState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field-level errors, keyed by input name. */
  errors?: Record<string, string>;
};

const MAX_FILES = 5;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function str(form: FormData, key: string, max = 2000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export async function submitConsultation(
  _prev: ConsultationState,
  form: FormData,
): Promise<ConsultationState> {
  // Honeypot. A real person never fills a hidden field; this replaces the
  // reCAPTCHA the old site used, with no third-party script and no friction.
  if (str(form, "company")) {
    return { status: "success", message: "Thanks — I'll be in touch within one business day." };
  }

  const name = str(form, "name", 120);
  const email = str(form, "email", 200);
  const phone = str(form, "phone", 40);
  const address = str(form, "address", 300);
  const issues = form.getAll("issues").map((v) => String(v)).slice(0, ISSUE_OPTIONS.length);
  const details = str(form, "details", 4000);
  const referral = str(form, "referral", 120);

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please add your name so I know who I'm talking to.";
  if (!email && !phone) {
    errors.email = "Add an email or a phone number so I can get back to you.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "That email address doesn't look right.";
  }
  if (!address) errors.address = "Where is the property? A road name or nearest cross street is enough.";
  if (issues.length === 0) errors.issues = "Pick at least one — or choose “Not sure”.";

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "A couple of things need fixing.", errors };
  }

  // Photos, attached directly to the email. Video is deliberately not accepted
  // here — the files are too large to attach and the fastest path for a
  // homeowner standing on their driveway is to text it.
  const photos: { filename: string; content: string }[] = [];
  let totalBytes = 0;
  for (const entry of form.getAll("photos")) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    if (photos.length >= MAX_FILES) break;
    if (!ALLOWED_IMAGE_TYPES.includes(entry.type)) {
      return {
        status: "error",
        message: `“${entry.name}” isn't an image I can accept. JPG, PNG, WebP, or HEIC — or text photos and video to ${site.phone}.`,
        errors: { photos: "Unsupported file type." },
      };
    }
    if (entry.size > MAX_FILE_BYTES) {
      return {
        status: "error",
        message: `“${entry.name}” is over 4MB. Send the smaller version, or text it to ${site.phone}.`,
        errors: { photos: "File too large." },
      };
    }
    totalBytes += entry.size;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return {
        status: "error",
        message: `Those photos add up to more than 15MB. Send a few of the worst spots, or text the rest to ${site.phone}.`,
        errors: { photos: "Total attachment size too large." },
      };
    }
    photos.push({
      filename: entry.name,
      content: Buffer.from(await entry.arrayBuffer()).toString("base64"),
    });
  }

  const lines = [
    `Name: ${name}`,
    `Email: ${email || "—"}`,
    `Phone: ${phone || "—"}`,
    `Property: ${address}`,
    "",
    `Main issues: ${issues.join(", ")}`,
    "",
    "Details:",
    details || "—",
    "",
    `Heard about DDG via: ${referral || "—"}`,
    `Photos attached: ${photos.length}`,
  ];

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONSULTATION_TO_EMAIL || site.email;
  const from = process.env.CONSULTATION_FROM_EMAIL;

  if (!apiKey || !from) {
    // Fail loudly in the log rather than showing a fake success. A lead that
    // silently evaporates is worse than one that never got submitted.
    console.error(
      "[consultation] RESEND_API_KEY and CONSULTATION_FROM_EMAIL are not set — request NOT delivered.",
      { name, email, phone, address, issues },
    );
    return {
      status: "error",
      message: `Something went wrong sending that. Please call or text Doug directly at ${site.phone} — he'll pick it up right away.`,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email || undefined,
        subject: `Driveway consultation — ${name} (${address})`,
        text: lines.join("\n"),
        attachments: photos.length > 0 ? photos : undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[consultation] Resend rejected the request", res.status, body);
      return {
        status: "error",
        message: `Something went wrong sending that. Please call or text Doug directly at ${site.phone}.`,
      };
    }
  } catch (err) {
    console.error("[consultation] delivery threw", err);
    return {
      status: "error",
      message: `Something went wrong sending that. Please call or text Doug directly at ${site.phone}.`,
    };
  }

  return {
    status: "success",
    message: "Got it. I review every request personally and I'll get back to you within one business day.",
  };
}
