"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site, nav } from "@/content/site";
import { services } from "@/content/services";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  // Route change closes everything — otherwise the drawer stays open over the
  // page you just navigated to.
  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!servicesOpen) return;
    function onDown(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setServicesOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-ground/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${site.name} — home`}>
          <Logo />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          <div ref={servicesRef} className="relative">
            <button
              type="button"
              onClick={() => setServicesOpen((v) => !v)}
              aria-expanded={servicesOpen}
              className={`flex min-h-11 items-center gap-1.5 px-3 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors ${
                isActive("/services") ? "text-gold" : "text-text hover:text-gold"
              }`}
            >
              Services
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
                className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}>
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {servicesOpen ? (
              <div className="absolute left-0 top-full w-[300px] border border-rule bg-surface py-2 shadow-lift">
                <Link href="/services"
                  className="block px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-gold hover:bg-surface-2">
                  All Services
                </Link>
                <div className="my-1 border-t border-rule" />
                {services.map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}`}
                    className="block px-4 py-2.5 text-[13px] text-muted hover:bg-surface-2 hover:text-text">
                    {s.navLabel}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {nav.filter((n) => n.href !== "/services").map((n) => (
            <Link key={n.href} href={n.href}
              className={`flex min-h-11 items-center px-3 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors ${
                isActive(n.href) ? "text-gold" : "text-text hover:text-gold"
              }`}>
              {n.label}
            </Link>
          ))}

          <a href={site.phoneHref}
            className="ml-2 flex min-h-11 items-center gap-2 border border-rule-strong px-4 text-[13px] font-medium text-text transition-colors hover:border-gold hover:text-gold">
            <PhoneIcon />
            {site.phone}
          </a>
          <Link href="/request-consultation"
            className="ml-1 flex min-h-11 items-center bg-gold px-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-white">
            Request Consultation
          </Link>
        </nav>

        {/* Mobile: the phone number is the highest-intent action on a phone. */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <a href={site.phoneHref} aria-label={`Call or text ${site.phone}`}
            className="flex min-h-11 min-w-11 items-center justify-center border border-rule-strong text-text">
            <PhoneIcon />
          </a>
          <button type="button" onClick={() => setOpen((v) => !v)}
            aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}
            className="flex min-h-11 min-w-11 items-center justify-center border border-rule-strong text-text">
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-[65px] z-50 overflow-y-auto border-t border-rule bg-ground lg:hidden">
          <nav className="px-5 py-4" aria-label="Mobile">
            <Link href="/services"
              className="flex min-h-12 items-center border-b border-rule text-base font-semibold uppercase tracking-[0.06em] text-gold">
              All Services
            </Link>
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`}
                className="flex min-h-12 items-center border-b border-rule pl-4 text-[15px] text-muted">
                {s.navLabel}
              </Link>
            ))}
            {nav.filter((n) => n.href !== "/services").map((n) => (
              <Link key={n.href} href={n.href}
                className="flex min-h-12 items-center border-b border-rule text-base font-semibold uppercase tracking-[0.06em] text-text">
                {n.label}
              </Link>
            ))}
            <Link href="/request-consultation"
              className="mt-6 flex min-h-13 w-full items-center justify-center bg-gold px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-ink">
              Request a Driveway Consultation
            </Link>
            <a href={site.phoneHref}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 border border-rule-strong px-6 py-3 text-sm text-text">
              <PhoneIcon /> Call or Text {site.phone}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

/**
 * Wordmark, set in type rather than the logo raster. The emblem artwork exists
 * as an SVG in the old media library and should replace this once migrated —
 * but a text wordmark is sharper than a scaled-down PNG in the meantime and
 * costs nothing to render.
 */
function Logo() {
  return (
    <span className="flex flex-col leading-none">
      <span className="text-[15px] font-bold uppercase tracking-[0.02em] text-text sm:text-base">
        Durango <span className="text-gold">Driveway</span> Grading
      </span>
      <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
        Built for Colorado
      </span>
    </span>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14.5 11.3v2a1.3 1.3 0 0 1-1.5 1.3 13 13 0 0 1-5.6-2 12.8 12.8 0 0 1-4-4 13 13 0 0 1-2-5.7A1.3 1.3 0 0 1 2.7 1.5h2a1.3 1.3 0 0 1 1.3 1.2c.1.6.2 1.3.5 1.9a1.3 1.3 0 0 1-.3 1.4l-.9.8a10.7 10.7 0 0 0 4 4l.9-.8a1.3 1.3 0 0 1 1.4-.3c.6.2 1.2.4 1.9.5a1.3 1.3 0 0 1 1.1 1.1Z"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
