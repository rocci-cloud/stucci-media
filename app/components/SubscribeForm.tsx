"use client";

import { useActionState } from "react";
import { subscribeAction, type SubscribeFormState } from "../lib/subscribe-actions";

const initialState: SubscribeFormState = {};

export default function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(subscribeAction, initialState);

  if (state.success) {
    return (
      <p className={`font-sans font-bold text-[var(--color-text)] ${compact ? "text-[13px]" : "text-sm"}`}>
        You&apos;re on the list — thanks for subscribing.
      </p>
    );
  }

  return (
    <>
      <form
        action={formAction}
        className={`font-sans flex gap-2.5 ${compact ? "flex-col" : "flex-col sm:flex-row max-w-[420px] mx-auto"}`}
      >
        <label htmlFor={compact ? "email-input-compact" : "email-input"} className="sr-only">
          Email address
        </label>
        <input
          id={compact ? "email-input-compact" : "email-input"}
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          className={`flex-1 min-h-11 border border-[#B9B9B9] rounded-control bg-white text-[var(--color-text)] focus:border-[var(--color-navy)] transition-colors ${
            compact ? "px-3 text-[13px]" : "px-3.5 text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:bg-[var(--color-red-dark)] text-white font-bold uppercase tracking-wide rounded-control disabled:opacity-50 transition-colors ${
            compact ? "px-4 text-[11.5px]" : "px-5 text-[13px]"
          }`}
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {state.error && (
        <p className={`font-sans text-[var(--color-red)] mt-3 ${compact ? "text-xs" : "text-sm"}`}>{state.error}</p>
      )}
    </>
  );
}
