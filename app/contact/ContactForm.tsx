"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitToInboxAction, type SubmissionFormState } from "../lib/submission-actions";

const initialState: SubmissionFormState = {};

const FIELD =
  "w-full px-3.5 py-3 min-h-11 border border-[var(--color-field-border)] rounded-control bg-[var(--color-surface)] text-[15px] text-[var(--color-text)] focus:border-[var(--color-navy)] outline-none transition-colors";
const LABEL = "block text-[12.5px] font-bold uppercase tracking-[0.04em] mb-1.5";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitToInboxAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-bg-off)] px-6 py-9 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-red-ink)]" />
        <h2 className="mt-3 font-headline text-[21px] font-bold uppercase tracking-[-0.015em]">
          Message sent
        </h2>
        <p className="mx-auto mt-1.5 max-w-[48ch] font-sans text-[14.5px] leading-[1.6] text-[var(--color-gray)]">
          Thanks — we read everything that comes through and we&rsquo;ll get back to you.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="font-sans flex flex-col gap-4">
      <input type="hidden" name="kind" value="GENERAL" />

      {/* Honeypot — hidden from people, not from most bots. */}
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Leave this empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-control border border-[var(--color-red)] bg-[var(--color-red)]/5 px-4 py-3 text-[14px] text-[var(--color-red-dark)]"
        >
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className={LABEL}>
          Name
        </label>
        <input id="name" name="name" type="text" required maxLength={100} className={FIELD} />
      </div>
      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input id="email" name="email" type="email" required maxLength={200} className={FIELD} />
      </div>
      <div>
        <label htmlFor="subject" className={LABEL}>
          Subject <span className="font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input id="subject" name="subject" type="text" maxLength={150} className={FIELD} />
      </div>
      <div>
        <label htmlFor="message" className={LABEL}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          className={`${FIELD} resize-y`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-6 py-3 rounded-control transition active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
