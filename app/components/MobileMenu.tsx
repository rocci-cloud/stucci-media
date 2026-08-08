"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type NavCategory = { slug: string; label: string };

export default function MobileMenu({
  open,
  onClose,
  mainCategories,
  moreCategories,
}: {
  open: boolean;
  onClose: () => void;
  mainCategories: NavCategory[];
  moreCategories: NavCategory[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    onClose();
  }

  function navLinkClass(active: boolean) {
    return `min-h-12 flex items-center px-3.5 font-headline text-[20px] font-bold uppercase tracking-[-0.015em] leading-[1.1] border-b border-white/10 transition-colors ${
      active ? "text-[var(--color-red)]" : "text-white hover:text-[var(--color-red)]"
    }`;
  }

  return (
    <div
      className={`fixed inset-0 z-40 bg-[var(--color-navy)] flex flex-col transition-transform duration-300 ease-out sm:hidden ${
        open ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-white/10 shrink-0">
        <span className="font-headline text-[22px] font-bold uppercase tracking-[-0.02em] text-white leading-none">
          Stucci<span className="text-[var(--color-red)]">Media</span>
        </span>
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="min-w-11 min-h-11 flex items-center justify-center text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="px-5 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 bg-white/10 rounded-control px-3.5">
          <Search className="h-[18px] w-[18px] text-white/50 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="flex-1 min-h-11 bg-transparent text-white placeholder:text-white/40 text-[15px] focus:outline-none"
          />
        </div>
      </form>

      <nav aria-label="Mobile primary" className="flex-1 overflow-y-auto px-2 py-2">
        <Link href="/" onClick={onClose} className={navLinkClass(pathname === "/")}>
          Featured
        </Link>
        {mainCategories.map((category) => {
          const href = `/category/${category.slug}`;
          return (
            <Link key={category.slug} href={href} onClick={onClose} className={navLinkClass(pathname === href)}>
              {category.label}
            </Link>
          );
        })}

        {moreCategories.length > 0 && (
          <>
            <div className="px-3.5 pt-4 pb-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white/40">
              More
            </div>
            {moreCategories.map((category) => {
              const href = `/category/${category.slug}`;
              return (
                <Link
                  key={category.slug}
                  href={href}
                  onClick={onClose}
                  className={navLinkClass(pathname === href)}
                >
                  {category.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 shrink-0 flex flex-col gap-3">
        <Link
          href="/subscribe"
          onClick={onClose}
          className="min-h-12 flex items-center justify-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white font-bold uppercase tracking-wide text-[14px] rounded-control transition active:scale-[0.97]"
        >
          Subscribe
        </Link>
        <div className="flex items-center justify-center gap-1 text-[12.5px] font-sans font-bold uppercase tracking-wide">
          <Link
            href="/login"
            onClick={onClose}
            className="min-h-11 inline-flex items-center text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <span className="text-white/30" aria-hidden>
            /
          </span>
          <Link
            href="/register"
            onClick={onClose}
            className="min-h-11 inline-flex items-center text-white/70 hover:text-white transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
