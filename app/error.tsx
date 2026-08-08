"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-headline text-[30px] font-bold uppercase leading-[1.02] tracking-[-0.015em]">
        Something went wrong
      </h1>
      <p className="font-sans text-[15px] text-[var(--color-gray)]">
        This page hit an unexpected error. Try again, or head back to the homepage.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="min-h-11 inline-flex items-center rounded-control bg-[var(--color-red)] px-5 font-sans text-[13px] font-bold uppercase tracking-wide text-white transition active:scale-[0.97] hover:bg-[var(--color-red-dark)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="min-h-11 inline-flex items-center rounded-control border border-[var(--color-hairline)] px-5 font-sans text-[13px] font-bold uppercase tracking-wide text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-off)]"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
