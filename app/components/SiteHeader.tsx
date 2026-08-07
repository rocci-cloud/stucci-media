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
      <header className="border-b border-[var(--color-hairline)]">
        <div className="mx-auto max-w-[1200px] px-5 pt-[22px] pb-4 flex items-center justify-between">
          <Link href="/" className="font-headline text-[32px] font-black tracking-[-0.02em]">
            Stucci Media
          </Link>
          <div className="hidden sm:block font-sans text-xs text-[var(--color-gray)]">
            Hammond, WI · August 7, 2026
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="font-sans border-t-2 border-[var(--color-hairline-strong)] border-b border-[var(--color-hairline)] relative"
      >
        <div className="mx-auto max-w-[1200px] px-5 py-2.5 flex items-center">
          <button
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden border border-[var(--color-hairline-strong)] rounded-sm px-2.5 py-1.5 text-xl leading-none"
          >
            ☰
          </button>

          <div
            className={`${
              menuOpen ? "flex" : "hidden"
            } sm:flex flex-col sm:flex-row gap-0 sm:gap-6 absolute sm:static left-0 right-0 top-full sm:top-auto bg-white border-b sm:border-b-0 border-[var(--color-hairline)] z-20 flex-1 overflow-x-auto`}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-bold uppercase tracking-wide whitespace-nowrap px-5 sm:px-0 py-3.5 sm:py-3 border-b sm:border-b-[3px] border-transparent hover:border-[var(--color-red)] hover:text-[var(--color-red)] sm:border-transparent"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <a
            href="/search"
            aria-label="Search"
            className="ml-auto sm:ml-4 mr-3 text-lg"
          >
            🔍
          </a>
          <a
            href="#subscribe"
            className="sm:ml-0 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-xs font-bold uppercase tracking-wide px-4 py-2.5 rounded-sm shrink-0"
          >
            Subscribe
          </a>
        </div>
      </nav>
    </>
  );
}
