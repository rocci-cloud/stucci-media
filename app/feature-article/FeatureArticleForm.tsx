"use client";

import { useActionState, useId } from "react";
import { Send } from "lucide-react";
import { submitToInboxAction, type SubmissionFormState } from "../lib/submission-actions";

const initialState: SubmissionFormState = {};

/**
 * The questionnaire.
 *
 * Reuses submitToInboxAction rather than adding a second intake path, so
 * enquiries land in the same admin Inbox as everything else, with the same
 * honeypot, the same per-email rate limit, and the same notification and
 * receipt emails already wired up. Only the kind differs, which is what
 * lets the Inbox filter sales enquiries away from tips and corrections.
 */
export default function FeatureArticleForm({
  hasPaymentLink = false,
  turnaround = "72 hours",
}: {
  hasPaymentLink?: boolean;
  turnaround?: string;
}) {
  const [state, formAction, pending] = useActionState(submitToInboxAction, initialState);
  const id = useId();

  if (state.success) {
    return (
      <div className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-surface)] p-7 text-center shadow-card">
        <p className="font-headline text-[24px] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-[var(--color-text)]">
          Got it. Check your inbox.
        </p>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-[var(--color-gray)]">
          We&apos;ve sent you a confirmation and Rocci will follow up personally to confirm the details and get
          your article started. Most articles publish within {turnaround} of us having what we need.
        </p>
      </div>
    );
  }

  const field =
    "min-h-11 w-full rounded-control border border-[var(--color-field-border)] bg-[var(--color-surface)] px-4 py-2.5 font-sans text-[15px] text-[var(--color-text)] transition-colors focus:border-[var(--color-navy)]";
  const label =
    "font-sans text-[11.5px] font-bold uppercase tracking-[0.04em] text-[var(--color-gray)]";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value="FEATURE_ARTICLE" />
      {/* Honeypot — hidden from people, not from most bots. */}
      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className={label}>
            Your name
          </label>
          <input id={`${id}-name`} name="name" type="text" required maxLength={100} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className={label}>
            Email
          </label>
          <input id={`${id}-email`} name="email" type="email" required maxLength={200} className={field} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-business`} className={label}>
            Business, brand, event or person
          </label>
          <input id={`${id}-business`} name="business" type="text" maxLength={150} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-url`} className={label}>
            Website or social <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <input id={`${id}-url`} name="businessUrl" type="text" maxLength={200} className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-about`} className={label}>
          What do you do, in your own words?
        </label>
        <textarea id={`${id}-about`} name="about" rows={3} maxLength={1500} className={`${field} resize-y`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-message`} className={label}>
          What should the article focus on?
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          required
          maxLength={2000}
          placeholder="A launch, an award, your origin story, what makes you different — whatever you'd want a reader to walk away knowing."
          className={`${field} resize-y`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-timing`} className={label}>
          Any timing to work around? <span className="font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id={`${id}-timing`}
          name="timing"
          type="text"
          maxLength={200}
          placeholder="An event date, a launch, or nothing in particular"
          className={field}
        />
      </div>

      {state.error && <p className="font-sans text-[14px] text-[var(--color-red-ink)]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-[var(--color-red)] px-6 font-sans text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-red-dark)] disabled:opacity-50 active:scale-[0.97]"
      >
        {pending ? "Sending…" : "Send my details"}
        {!pending && <Send className="h-4 w-4" />}
      </button>
      <p className="text-center font-sans text-[12.5px] text-[var(--color-gray-light)]">
        {hasPaymentLink
          ? "No payment on this form. We'll confirm the details, then send you a secure Stripe link."
          : "No payment now. We'll confirm the details with you first."}
      </p>
    </form>
  );
}
