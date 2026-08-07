"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "../lib/auth-client";

type Mode = "login" | "register";

export default function AuthForm({ mode, redirectTo }: { mode: Mode; redirectTo: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const { error: authError } =
      mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password });

    setPending(false);

    if (authError) {
      setError(authError.message ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="font-sans flex flex-col gap-4">
      {error && (
        <p className="text-[13px] text-[var(--color-red)] border border-[var(--color-red)] rounded-control px-3.5 py-2.5">
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
            className="w-full px-3.5 py-3 border border-[#B9B9B9] rounded-control text-sm min-h-11 focus:border-[var(--color-red)] transition-colors"
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
          className="w-full px-3.5 py-3 border border-[#B9B9B9] rounded-control text-sm min-h-11 focus:border-[var(--color-red)] transition-colors"
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
          className="w-full px-3.5 py-3 border border-[#B9B9B9] rounded-control text-sm min-h-11 focus:border-[var(--color-red)] transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-6 rounded-control transition-colors disabled:opacity-50"
      >
        {pending ? (mode === "login" ? "Signing in…" : "Creating account…") : mode === "login" ? "Sign In" : "Create Account"}
      </button>

      <p className="text-[13px] text-[var(--color-gray)] text-center">
        {mode === "login" ? (
          <>
            Don&rsquo;t have an account?{" "}
            <Link href="/register" className="text-[var(--color-red)] font-bold hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--color-red)] font-bold hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
