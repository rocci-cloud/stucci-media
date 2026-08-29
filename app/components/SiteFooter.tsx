import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getFooterNavCategories } from "../lib/categories";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/RocciStucciMedia",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
        <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.5-1.46h1.6V4.36C16.3 4.25 15.4 4.15 14.35 4.15c-2.5 0-4.2 1.53-4.2 4.33V10.5H7.6v3h2.55V21h3.35z" />
      </svg>
    ),
  },
];

const COMPANY_LINKS = [
  { label: "All Shows", href: "/podcasts" },
  { label: "Get Featured", href: "/feature-article" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Search", href: "/search" },
  { label: "Daily Brief", href: "/daily-brief" },
];

// Sister sites under the same ownership — not ad placements, so this
// deliberately reuses the exact Sections/Company nav treatment (same
// label style, same link type/size/hover) rather than a bordered "sponsor"
// box or anything else that would read as a paid placement.
const NETWORK_LINKS = [
  { label: "Stucci Marketing Group", href: "https://stuccimarketing.com" },
  { label: "Stucci Apparel", href: "https://stucciapparel.com" },
];

// Two columns, not four: brand+social+subscribe on the left, a dense
// flat-wrapped nav (categories, then company/legal pages) on the right —
// replaces the old one-link-per-line vertical lists (three separate
// labeled columns, the last of which duplicated SubscribeStrip's pitch
// immediately above it) with a footer that reads as a closing statement,
// not a leftover theme template. `min-h-11` on each wrapped link still
// gives every link a full 44px touch target even though several now
// share a text row instead of owning one each.
export default async function SiteFooter() {
  const categories = await getFooterNavCategories();

  return (
    <footer className="font-sans bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-dark)] text-white">
      <div className="shell py-7 sm:py-10 grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-7 sm:gap-10">
        <div>
          <div className="font-headline text-[21px] font-bold uppercase tracking-[-0.015em] mb-2">
            Stucci<span className="text-[var(--color-red-ink)]">Media</span>
          </div>
          <p className="text-[13px] text-white/60 leading-[1.55] mb-4 max-w-[36ch]">
            Independent news from Florida — the stories mainstream media won&apos;t run.
          </p>
          <div className="flex items-center gap-2.5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors"
              >
                {social.icon}
              </a>
            ))}
            <Link
              href="/subscribe"
              className="min-h-11 inline-flex items-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 rounded-control transition active:scale-[0.97]"
            >
              Subscribe
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-white/50 mb-2.5">Sections</h4>
          <nav aria-label="Footer sections" className="flex flex-wrap gap-x-4 gap-y-0.5 mb-4">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="min-h-11 inline-flex items-center text-[13.5px] text-white/80 hover:text-white transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </nav>

          <h4 className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-white/50 mb-2.5">Company</h4>
          <nav aria-label="Footer company links" className="flex flex-wrap gap-x-4 gap-y-0.5 mb-4">
            {COMPANY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-11 inline-flex items-center text-[13.5px] text-white/80 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <h4 className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-white/50 mb-2.5">Our Network</h4>
          <nav aria-label="Our network" className="flex flex-wrap gap-x-4 gap-y-0.5">
            {NETWORK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center gap-1 text-[13.5px] text-white/80 hover:text-white transition-colors"
              >
                {link.label}
                <ArrowUpRight className="h-3.5 w-3.5 text-white/40" aria-hidden />
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-navy-dark)] border-t border-white/10">
        <div className="shell py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="font-headline text-[12.5px] font-bold uppercase tracking-[0.02em] text-white/90">
            Stucci Media · Independent News That Matters
          </div>
          <div className="text-[11.5px] text-white/50">
            © 2026 Stucci Media — All Rights Reserved · Florida
          </div>
        </div>
      </div>
    </footer>
  );
}
