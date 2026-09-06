import Link from "next/link";
import { site, nav } from "@/content/site";
import { services } from "@/content/services";
import { areas } from "@/content/areas";
import { Logo } from "@/components/Logo";
import { hasDarkLockup } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo available={hasDarkLockup()} className="h-20 w-auto" width={228} height={160} />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {site.tagline}
            </p>
            <p className="measure mt-5 text-sm leading-relaxed text-muted">
              Drainage-first gravel driveway grading, drainage correction, and rural access
              maintenance for {site.county}, Colorado. Owner-operated by {site.owner}.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a href={site.phoneHref}
                className="inline-flex min-h-11 items-center text-base font-semibold text-gold hover:text-white">
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`}
                className="inline-flex min-h-11 items-center text-sm text-muted hover:text-text">
                {site.email}
              </a>
              <a href={site.facebook} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm text-muted hover:text-text">
                Facebook
              </a>
            </div>
          </div>

          <div>
            <h2 className="eyebrow text-muted">Services</h2>
            <ul className="mt-4 flex flex-col gap-1">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`}
                    className="inline-flex min-h-9 items-center text-sm text-muted hover:text-gold">
                    {s.navLabel}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="eyebrow mt-8 text-muted">Company</h2>
            <ul className="mt-4 flex flex-col gap-1">
              {nav.filter((n) => n.href !== "/services" && n.href !== "/service-areas").map((n) => (
                <li key={n.href}>
                  <Link href={n.href}
                    className="inline-flex min-h-9 items-center text-sm text-muted hover:text-gold">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/request-consultation"
                  className="inline-flex min-h-9 items-center text-sm text-muted hover:text-gold">
                  Request a Consultation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="eyebrow text-muted">Service Areas</h2>
            <ul className="mt-4 flex flex-col gap-1">
              {areas.map((a) => (
                <li key={a.slug}>
                  <Link href={`/service-areas/${a.slug}`}
                    className="inline-flex min-h-9 items-center text-sm text-muted hover:text-gold">
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-text">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-text">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
