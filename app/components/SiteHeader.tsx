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
            className="font-headline text-[30px] sm:text-[40px] font-bold uppercase tracking-[-0.01em] text-[var(--color-black)]"
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
        className="font-sans bg-[var(--color-black)] sticky top-0 z-30 shadow-[0_1px_0_rgba(0,0,0,0.15)]"
      >
        <div className="mx-auto max-w-[1280px] px-5 flex items-center">
          <button
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden border border-white/30 text-white rounded-sm px-2.5 py-1.5 my-2 text-xl leading-none"
          >
            ☰
          </button>

          <div
            className={`${
              menuOpen ? "flex" : "hidden"
            } sm:flex flex-col sm:flex-row gap-0 sm:gap-1 absolute sm:static left-0 right-0 top-full sm:top-auto bg-[var(--color-black)] sm:bg-transparent z-20 flex-1 overflow-x-auto`}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12.5px] font-bold uppercase tracking-wide whitespace-nowrap text-white px-5 sm:px-3.5 py-3.5 sm:py-3.5 border-b-2 sm:border-b-[3px] border-transparent hover:border-[var(--color-red)] hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <a
            href="/search"
            aria-label="Search"
            className="ml-auto sm:ml-4 mr-3 text-lg text-white"
          >
            🔍
          </a>
          <a
            href="#subscribe"
            className="sm:ml-0 my-2 sm:my-0 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 py-2.5 rounded-sm shrink-0"
          >
            Subscribe
          </a>
        </div>
      </nav>
    </>
  );
}
