"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { submitToInboxAction, type SubmissionFormState } from "../../lib/submission-actions";

const initialState: SubmissionFormState = {};

const FIELD =
  "font-sans w-full min-h-11 px-4 py-3 border-2 border-[var(--color-hairline)] rounded-control text-[15px] focus:border-[var(--color-navy)] outline-none transition-colors";
const LABEL =
  "font-sans text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--color-gray)] mb-1.5 block";

export default function SubmitForm() {
  const [state, formAction, pending] = useActionState(submitToInboxAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-bg-off)] px-6 py-10 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--color-red-ink)]" />
        <h2 className="mt-3 font-headline text-[24px] font-bold uppercase tracking-[-0.015em]">
          Submission received
        </h2>
        <p className="mx-auto mt-2 max-w-[52ch] font-sans text-[15px] leading-[1.6] text-[var(--color-gray)]">
          Every show is reviewed by hand before it goes on the site, so this isn&rsquo;t automatic.
          We&rsquo;ll be in touch either way — check the address you gave us.
        </p>
        <Link
          href="/podcasts"
          className="mt-5 inline-flex min-h-11 items-center rounded-control bg-[var(--color-red)] px-5 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
        >
          Back to podcasts
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value="PODCAST" />

      {/* Honeypot — hidden from people, not from most bots. Left out of the
          tab order and hidden from screen readers so it never traps anyone. */}
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-control border border-[var(--color-red)] bg-[var(--color-red)]/5 px-4 py-3 font-sans text-[14px] text-[var(--color-red-dark)]"
        >
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={LABEL}>
            Your name
          </label>
          <input id="name" name="name" required maxLength={100} className={FIELD} />
        </div>
        <div>
          <label htmlFor="email" className={LABEL}>
            Email
          </label>
          <input id="email" name="email" type="email" required maxLength={200} className={FIELD} />
        </div>
      </div>

      <div>
        <label htmlFor="contact" className={LABEL}>
          Phone or social <span className="font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="contact"
          name="contact"
          maxLength={200}
          className={FIELD}
          placeholder="Whatever's easiest to reach you on"
        />
      </div>

      <div>
        <label htmlFor="showName" className={LABEL}>
          Show name
        </label>
        <input id="showName" name="showName" required maxLength={150} className={FIELD} />
      </div>

      <div>
        <label htmlFor="feedUrl" className={LABEL}>
          RSS feed URL
        </label>
        <input
          id="feedUrl"
          name="feedUrl"
          type="url"
          required
          maxLength={500}
          className={FIELD}
          placeholder="https://feeds.example.com/your-show.xml"
        />
        <p className="mt-1.5 font-sans text-[12.5px] text-[var(--color-gray-light)]">
          The feed your show already publishes to Apple, Spotify or wherever you host it.
        </p>
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          About your show
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={7}
          maxLength={4000}
          className={`${FIELD} resize-y`}
          placeholder="What it covers, how often you publish, who you are, and why it belongs on Stucci Media."
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex min-h-11 items-center justify-center self-start rounded-control bg-[var(--color-red)] px-6 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Submit for consideration"}
      </button>
    </form>
  );
}
