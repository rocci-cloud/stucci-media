"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "../actions";

const initialState: LoginFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="max-w-[380px] mx-auto px-5 py-24 font-sans">
      <h1 className="font-headline text-[28px] font-black mb-6">Admin Login</h1>
      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <p className="text-sm text-[var(--color-red)] border border-[var(--color-red)] px-3 py-2">
            {state.error}
          </p>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Username
          <input
            name="username"
            autoComplete="username"
            required
            className="border border-[var(--color-hairline-strong)] px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="border border-[var(--color-hairline-strong)] px-3 py-2 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-bold uppercase tracking-wide px-4 py-2.5 rounded-control disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
