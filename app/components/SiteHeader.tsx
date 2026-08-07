"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Political News", href: "/category/political-news" },
  { label: "World News", href: "/category/world-news" },
  { label: "Opinion & Analysis", href: "/category/opinion-analysis" },
  { label: "Podcasts", href: "/category/podcasts" },
  { label: "Social Issues", href: "/category/social-issues" },
  { label: "Crime & Investigation", href: "/category/crime-investigation" },
  { label: "Veterans", href: "/category/veterans" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="border-b-4 border-[var(--color-red)]">
        <div className="mx-auto max-w-[1280px] px-5 pt-5 pb-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-headline text-[28px] sm:text-[40px] font-bold uppercase tracking-[-0.01em] text-[var(--color-navy)]"
          >
            Stucci<span className="text-[var(--color-red)]">Media</span>
          </Link>
          <div className="hidden sm:flex flex-col items-end font-sans text-xs text-[var(--color-gray)] leading-tight">
            <span className="font-bold uppercase tracking-wide text-[var(--color-red)]">Live · Florida</span>
            <span>
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="font-sans bg-[var(--color-navy)] sticky top-0 z-30 shadow-pop"
      >
        <div className="mx-auto max-w-[1280px] px-5 flex items-center">
          <button
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden min-w-11 min-h-11 flex items-center justify-center border border-white/30 text-white rounded-control text-xl leading-none my-1.5"
          >
            ☰
          </button>

          <div
            className={`${
              menuOpen ? "flex" : "hidden"
            } sm:flex flex-col sm:flex-row gap-0 sm:gap-1 absolute sm:static left-0 right-0 top-full sm:top-auto bg-[var(--color-navy)] sm:bg-transparent z-20 flex-1 overflow-x-auto shadow-pop sm:shadow-none`}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-11 flex items-center text-[12.5px] font-bold uppercase tracking-wide whitespace-nowrap text-white px-5 sm:px-3.5 border-b-2 sm:border-b-[3px] border-transparent hover:border-[var(--color-red)] hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <a
            href="/search"
            aria-label="Search"
            className="ml-auto sm:ml-4 min-w-11 min-h-11 flex items-center justify-center text-lg text-white"
          >
            🔍
          </a>
          <a
            href="#subscribe"
            className="sm:ml-0 my-1.5 sm:my-0 min-h-11 inline-flex items-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 rounded-control shrink-0 transition-colors"
          >
            Subscribe
          </a>
        </div>
      </nav>
    </>
  );
}
