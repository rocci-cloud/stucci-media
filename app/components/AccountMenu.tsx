"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { authClient, useSession } from "../lib/auth-client";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Desktop header's signed-in state. Before this, SiteHeaderClient never
// checked session state at all — Sign In / Register showed unchanged
// whether or not you were actually logged in, which is what made every
// "did my login even work" report so hard to diagnose (see CLAUDE.md
// Phase 51). This replaces those two links with an avatar-initial menu
// once a session exists, for any signed-in account, not just admins.
export default function AccountMenu() {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Reserves the same footprint as the signed-out state so the header
  // doesn't visibly shift once the session check resolves.
  if (isPending) {
    return <div className="min-w-11 min-h-11 hidden sm:block" aria-hidden />;
  }

  if (!session) {
    return (
      <>
        <Link
          href="/login"
          aria-label="Sign in"
          className="min-w-11 min-h-11 hidden sm:flex items-center justify-center text-white hover:text-white/80 transition-colors"
        >
          <UserIcon className="h-[18px] w-[18px]" />
        </Link>
        <Link
          href="/register"
          className="min-h-11 hidden sm:flex items-center text-[12px] font-bold uppercase tracking-wide text-white/70 hover:text-white transition-colors whitespace-nowrap"
        >
          Register
        </Link>
      </>
    );
  }

  const user = session.user;

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="min-w-11 min-h-11 flex items-center justify-center px-1.5"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-red)] text-[11px] font-bold text-white">
          {initials(user.name)}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[200px] overflow-hidden rounded-control border border-white/10 bg-[var(--color-navy-dark)] shadow-pop [animation:overlayPop_0.2s_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          <div className="px-4 py-3 border-b border-white/10">
            <div className="text-[13px] font-bold text-white truncate">{user.name}</div>
            <div className="text-[11.5px] text-white/50 truncate">{user.email}</div>
          </div>
          <Link
            href="/saved"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="min-h-11 flex items-center px-4 text-[12.5px] font-bold uppercase tracking-[0.03em] text-white hover:bg-white/5 transition-colors"
          >
            Saved Articles
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="min-h-11 flex items-center px-4 text-[12.5px] font-bold uppercase tracking-[0.03em] text-white hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              // Hard navigation after sign-out, same reasoning as
              // AdminTopbar's sign-out — guarantees the next request
              // sees the now-cleared session cookie.
              authClient.signOut().then(() => {
                window.location.href = "/";
              });
            }}
            className="min-h-11 w-full flex items-center gap-2 px-4 text-[12.5px] font-bold uppercase tracking-[0.03em] text-white/80 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
