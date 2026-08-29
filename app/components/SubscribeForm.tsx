"use client";

import { useActionState, useEffect, useId } from "react";
import { subscribeAction, type SubscribeFormState } from "../lib/subscribe-actions";

const initialState: SubscribeFormState = {};

type SubscribeFormProps = {
  compact?: boolean;
  /**
   * Where on the site this form is. Stored with the signup so the admin
   * list can show which capture point actually converts, rather than a
   * pile of addresses with no idea what earned them.
   */
  source?: string;
  /** Overrides the confirmation copy, for the modal's larger treatment. */
  successMessage?: string;
  /** Renders for a dark background (the modal and any navy panel). */
  onDark?: boolean;
  /** Fired once when a signup succeeds, so a parent can react to it. */
  onSuccess?: () => void;
  // Always stack input/button vertically instead of going side-by-side
  // on sm:+ — used by the full-size Subscribe card where the form sits
  // in a narrower panel regardless of the section's overall width.
  stacked?: boolean;
};

export default function SubscribeForm({
  compact = false,
  stacked = false,
  source = "unknown",
  successMessage,
  onDark = false,
  onSuccess,
}: SubscribeFormProps) {
  const [state, formAction, pending] = useActionState(subscribeAction, initialState);
  const alwaysColumn = compact || stacked;
  // Every instance needs its own input id: an article page can now carry
  // an inline form, the sidebar form and the modal at once, and duplicate
  // ids would point every one of those labels at the first input on the
  // page.
  const inputId = useId();

  // Notifying the parent has to happen in an effect rather than inline:
  // calling it during render would set state in another component mid-render.
  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  if (state.success) {
    return (
      <p
        className={`font-sans font-bold ${onDark ? "text-white" : "text-[var(--color-text)]"} ${
          compact ? "text-[13px]" : "text-[15px]"
        }`}
      >
        {successMessage ?? "You're on the list — thanks for subscribing."}
      </p>
    );
  }

  return (
    <>
      <form
        action={formAction}
        className={`font-sans flex gap-2.5 ${
          alwaysColumn ? "flex-col" : "flex-col sm:flex-row max-w-[420px] mx-auto"
        }`}
      >
        <input type="hidden" name="source" value={source} />
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          className={`flex-1 min-h-11 border border-[var(--color-field-border)] rounded-control bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-navy)] transition-colors ${
            compact ? "px-3 text-[13px]" : "px-4 text-[15px]"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:bg-[var(--color-red-dark)] text-white font-bold uppercase tracking-wide rounded-control disabled:opacity-50 transition active:scale-[0.97] ${
            compact ? "px-4 text-[11.5px]" : "px-5 text-[14px]"
          }`}
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {state.error && (
        <p
          className={`font-sans mt-3 ${onDark ? "text-white" : "text-[var(--color-red-ink)]"} ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {state.error}
        </p>
      )}
    </>
  );
}
