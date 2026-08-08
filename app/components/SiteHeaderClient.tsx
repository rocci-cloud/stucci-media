"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, User } from "lucide-react";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";

type NavCategory = { slug: string; label: string };

export default function SiteHeaderClient({
  mainCategories,
  moreCategories,
}: {
  mainCategories: NavCategory[];
  moreCategories: NavCategory[];
}) {
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

  // "Featured" is the homepage's curated lead section (FeaturedSection),
  // not a real Category row — it's a structural nav entry like Subscribe/
  // Search, always first, not admin-configurable from /admin/categories.
  const isFeaturedActive = pathname === "/";
  const isMoreActive = moreCategories.some((c) => pathname === `/category/${c.slug}`);

  return (
    <>
      <header className="border-b-[3px] border-[var(--color-red)]">
        <div className="mx-auto max-w-[1280px] px-5 py-1.5 sm:py-2.5 flex items-center justify-between">
          <Link
            href="/"
            className="font-headline text-[20px] sm:text-[30px] font-bold uppercase tracking-[-0.02em] text-[var(--color-navy)] leading-none"
          >
            Stucci<span className="text-[var(--color-red)]">Media</span>
          </Link>
          <div className="hidden sm:flex flex-col items-end font-sans text-[11px] tracking-[0.01em] text-[var(--color-gray)] leading-tight">
            <span className="font-bold uppercase tracking-[0.04em] text-[var(--color-red)]">Live · Florida</span>
            <span>
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className={`font-sans bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-dark)] sticky top-0 z-30 transition-shadow duration-200 ${
          scrolled ? "shadow-pop" : "shadow-none"
        }`}
      >
        <div className="mx-auto max-w-[1280px] px-5 flex items-center">
          <button
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="sm:hidden min-w-11 min-h-11 flex items-center justify-center border border-white/30 text-white rounded-control my-0.5"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex flex-1 items-stretch">
            <Link
              href="/"
              className={`min-h-11 flex items-center text-[12px] font-bold uppercase tracking-[0.03em] whitespace-nowrap px-3 border-b-[3px] transition-colors ${
                isFeaturedActive
                  ? "text-[var(--color-red)] border-b-[var(--color-red)]"
                  : "text-white border-b-transparent hover:border-b-white/40 hover:text-white/90"
              }`}
            >
              Featured
            </Link>
            {mainCategories.map((category) => {
              const href = `/category/${category.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={category.slug}
                  href={href}
                  className={`min-h-11 flex items-center text-[12px] font-bold uppercase tracking-[0.03em] whitespace-nowrap px-3 border-l border-l-white/10 border-b-[3px] transition-colors ${
                    active
                      ? "text-[var(--color-red)] border-b-[var(--color-red)]"
                      : "text-white border-b-transparent hover:border-b-white/40 hover:text-white/90"
                  }`}
                >
                  {category.label}
                </Link>
              );
            })}
            {moreCategories.length > 0 && (
              <MoreNavDropdown categories={moreCategories} active={isMoreActive} pathname={pathname} />
            )}
          </div>

          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="ml-auto sm:ml-3 min-w-11 min-h-11 flex items-center justify-center text-white hover:text-white/80 transition-colors"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link
            href="/login"
            aria-label="Sign in"
            className="min-w-11 min-h-11 hidden sm:flex items-center justify-center text-white hover:text-white/80 transition-colors"
          >
            <User className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/register"
            className="min-h-11 hidden sm:flex items-center text-[12px] font-bold uppercase tracking-wide text-white/70 hover:text-white transition-colors whitespace-nowrap"
          >
            Register
          </Link>
          <Link
            href="/subscribe"
            className="sm:ml-2 my-0.5 sm:my-1.5 min-h-11 inline-flex items-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:bg-[var(--color-red-dark)] text-white text-[12px] font-bold uppercase tracking-wide px-5 rounded-control shrink-0 shadow-[0_2px_8px_rgba(200,16,46,0.35)] transition active:scale-[0.97]"
          >
            Subscribe
          </Link>
        </div>
      </nav>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        mainCategories={mainCategories}
        moreCategories={moreCategories}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MoreNavDropdown({
  categories,
  active,
  pathname,
}: {
  categories: NavCategory[];
  active: boolean;
  pathname: string;
}) {
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

  return (
    <div ref={ref} className="relative border-l border-l-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`min-h-11 flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.03em] whitespace-nowrap px-3 border-b-[3px] transition-colors ${
          active || open
            ? "text-[var(--color-red)] border-b-[var(--color-red)]"
            : "text-white border-b-transparent hover:border-b-white/40 hover:text-white/90"
        }`}
      >
        More
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full min-w-[200px] overflow-hidden rounded-b-control border border-t-0 border-white/10 bg-[var(--color-navy-dark)] shadow-pop [animation:overlayPop_0.2s_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          {categories.map((category) => {
            const href = `/category/${category.slug}`;
            const isActive = pathname === href;
            return (
              <Link
                key={category.slug}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`min-h-11 flex items-center px-4 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors ${
                  isActive ? "text-[var(--color-red)] bg-white/5" : "text-white hover:bg-white/5 hover:text-white/90"
                }`}
              >
                {category.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
