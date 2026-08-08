"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Political News", href: "/category/political-news" },
  { label: "World News", href: "/category/world-news" },
  { label: "Opinion & Analysis", href: "/category/opinion-analysis" },
  { label: "Podcasts", href: "/category/podcasts" },
  { label: "Social Issues", href: "/category/social-issues" },
  { label: "Crime & Investigation", href: "/category/crime-investigation" },
  { label: "Veterans", href: "/category/veterans" },
];

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  return (
    <div
      className={`fixed inset-0 z-40 bg-[var(--color-navy)] flex flex-col transition-transform duration-300 ease-out sm:hidden ${
        open ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 shrink-0">
        <span className="font-headline text-[24px] font-bold uppercase text-white">
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

      <form onSubmit={handleSearchSubmit} className="px-5 py-4 border-b border-white/10 shrink-0">
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
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`min-h-14 flex items-center px-3.5 font-headline text-[19px] font-bold uppercase tracking-[-0.005em] border-b border-white/10 transition-colors ${
                active ? "text-[var(--color-red)]" : "text-white hover:text-[var(--color-red)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5 border-t border-white/10 shrink-0">
        <Link
          href="/#subscribe"
          onClick={onClose}
          className="min-h-12 flex items-center justify-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white font-bold uppercase tracking-wide text-[14px] rounded-control transition-colors"
        >
          Subscribe
        </Link>
      </div>
    </div>
  );
}
