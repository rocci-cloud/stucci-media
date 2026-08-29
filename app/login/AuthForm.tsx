"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "../lib/auth-client";
import { acceptInviteAction } from "../register/invite-actions";

type Mode = "login" | "register";

export default function AuthForm({
  mode,
  redirectTo,
  inviteToken,
}: {
  mode: Mode;
  redirectTo: string;
  /** Present when arriving from a staff invite link (/register?invite=…). */
  inviteToken?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    let target = redirectTo;

    try {
      const { data, error: authError } =
        mode === "login"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ name, email, password });

      if (authError) {
        setError(authError.message ?? "Something went wrong. Please try again.");
        setPending(false);
        return;
      }

      // The header's Sign In link (SiteHeader/MobileMenu) is a plain
      // /login link with no ?from= — a signed-in admin with nowhere
      // specific to go otherwise lands on the homepage, which gives no
      // visual sign the sign-in worked (the public header doesn't show
      // session state) and reads as "did nothing." Send an admin who
      // wasn't headed anywhere in particular straight to the dashboard
      // instead — an explicit ?from= target (e.g. bounced here from a
      // protected page) still wins.
      if (mode === "login" && redirectTo === "/" && data?.user?.role === "ADMIN") {
        target = "/admin";
      }

      // A staff invite applies its role right after the account exists.
      // If it applies, send them to the dashboard rather than the
      // homepage — they were invited to work here, not to read.
      if (mode === "register" && inviteToken) {
        const invite = await acceptInviteAction(inviteToken);
        if (invite.applied) target = "/admin";
      }
    } catch {
      // A thrown (rather than returned) error means the request itself
      // never completed — e.g. a network blip or an origin mismatch the
      // client rejected outright — so there's no authError to read.
      setError("Couldn't reach the server. Please check your connection and try again.");
      setPending(false);
      return;
    }

    // A full navigation, not router.push()/router.refresh(): the very
    // next request needs to see the session cookie the sign-in response
    // just set, and a client-side transition can serve a cached RSC
    // payload for the destination route from before that cookie existed
    // — a known way for "sign in, land back on /login" to happen even
    // though the sign-in itself succeeded. A hard navigation guarantees
    // a fresh request with the new cookie attached.
    window.location.href = target;
  }

  return (
    <form onSubmit={handleSubmit} className="font-sans flex flex-col gap-4">
      {error && (
        <p className="text-[13px] text-[var(--color-red-ink)] border border-[var(--color-red)] rounded-control px-3.5 py-2.5">
          {error}
        </p>
      )}

      {mode === "register" && (
        <div>
          <label htmlFor="name" className="block text-[13px] font-bold uppercase tracking-wide mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-3 border border-[var(--color-field-border)] rounded-control text-sm min-h-11 focus:border-[var(--color-red)] transition-colors"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-[13px] font-bold uppercase tracking-wide mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3.5 py-3 border border-[var(--color-field-border)] rounded-control text-sm min-h-11 focus:border-[var(--color-red)] transition-colors"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-[13px] font-bold uppercase tracking-wide mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-3 border border-[var(--color-field-border)] rounded-control text-sm min-h-11 focus:border-[var(--color-red)] transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-6 rounded-control transition active:scale-[0.97] disabled:opacity-50"
      >
        {pending ? (mode === "login" ? "Signing in…" : "Creating account…") : mode === "login" ? "Sign In" : "Create Account"}
      </button>

      <p className="text-[13px] text-[var(--color-gray)] text-center">
        {mode === "login" ? (
          <>
            Don&rsquo;t have an account?{" "}
            <Link href="/register" className="text-[var(--color-red-ink)] font-bold hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--color-red-ink)] font-bold hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
