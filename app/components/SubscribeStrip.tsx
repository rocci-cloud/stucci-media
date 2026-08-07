"use client";

import { useActionState } from "react";
import { subscribeAction, type SubscribeFormState } from "../lib/subscribe-actions";

const initialState: SubscribeFormState = {};

export default function SubscribeStrip() {
  const [state, formAction, pending] = useActionState(subscribeAction, initialState);

  return (
    <div id="subscribe" className="bg-[var(--color-bg-off)] border-y border-[var(--color-hairline)] px-5 py-12">
      <div className="max-w-[560px] mx-auto text-center">
        <h3 className="font-headline text-2xl font-black mb-2.5">
          Get the stories mainstream media won&apos;t run
        </h3>
        <p className="font-sans text-[15px] text-[var(--color-gray)] mb-5">
          Independent reporting, straight to your inbox. No spam, no noise.
        </p>

        {state.success ? (
          <p className="font-sans text-sm font-bold text-[var(--color-text)]">
            You&apos;re on the list — thanks for subscribing.
          </p>
        ) : (
          <form action={formAction} className="font-sans flex flex-col sm:flex-row gap-2.5 max-w-[420px] mx-auto">
            <label htmlFor="email-input" className="sr-only">
              Email address
            </label>
            <input
              id="email-input"
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              className="flex-1 px-3.5 py-3 border border-[#B9B9B9] rounded-sm text-sm bg-white text-[var(--color-text)]"
            />
            <button
              type="submit"
              disabled={pending}
              className="bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-5 py-3 rounded-sm disabled:opacity-50"
            >
              {pending ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
        {state.error && (
          <p className="font-sans text-sm text-[var(--color-red)] mt-3">{state.error}</p>
        )}
      </div>
    </div>
  );
}
