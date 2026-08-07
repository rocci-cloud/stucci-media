"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        className={`font-sans bg-[var(--color-navy)] sticky top-0 z-30 transition-shadow duration-200 ${
          scrolled ? "shadow-pop" : "shadow-none"
        }`}
      >
        <div className="mx-auto max-w-[1280px] px-5 flex items-center">
          <button
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="sm:hidden min-w-11 min-h-11 flex items-center justify-center border border-white/30 text-white rounded-control text-xl leading-none my-1.5"
          >
            ☰
          </button>

          <div className="hidden sm:flex flex-1 items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`min-h-11 flex items-center text-[12.5px] font-bold uppercase tracking-wide whitespace-nowrap px-3.5 border-b-[3px] transition-colors ${
                    active
                      ? "text-[var(--color-red)] border-[var(--color-red)]"
                      : "text-white border-transparent hover:border-white/40 hover:text-white/90"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="ml-auto sm:ml-4 min-w-11 min-h-11 flex items-center justify-center text-lg text-white hover:text-white/80 transition-colors"
          >
            🔍
          </button>
          <a
            href="#subscribe"
            className="sm:ml-2 my-1.5 sm:my-2.5 min-h-11 inline-flex items-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:bg-[var(--color-red-dark)] text-white text-[12px] font-bold uppercase tracking-wide px-5 rounded-control shrink-0 shadow-[0_2px_8px_rgba(200,16,46,0.35)] transition-colors"
          >
            Subscribe
          </a>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
