import Link from "next/link";
import { getCategories } from "../lib/categories";

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
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Search", href: "/search" },
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
  const categories = await getCategories();

  return (
    <footer className="font-sans bg-[var(--color-navy)] text-white">
      <div className="mx-auto max-w-[1280px] px-5 py-7 sm:py-10 grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-7 sm:gap-10">
        <div>
          <div className="font-headline text-[20px] font-bold uppercase mb-2">
            Stucci<span className="text-[var(--color-red)]">Media</span>
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
              href="/#subscribe"
              className="min-h-11 inline-flex items-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 rounded-control transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-white/50 mb-2.5">Sections</h4>
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

          <h4 className="text-[11px] font-bold uppercase tracking-wide text-white/50 mb-2.5">Company</h4>
          <nav aria-label="Footer company links" className="flex flex-wrap gap-x-4 gap-y-0.5">
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
        </div>
      </div>

      <div className="bg-[var(--color-navy-dark)] border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="font-headline text-[12.5px] font-bold uppercase tracking-wide text-white/90">
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
