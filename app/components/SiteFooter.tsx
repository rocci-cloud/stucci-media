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

export default async function SiteFooter() {
  const categories = await getCategories();

  return (
    <footer className="font-sans bg-[var(--color-navy)] text-white mt-4">
      <div className="mx-auto max-w-[1280px] px-5 py-9 sm:py-14 grid grid-cols-1 sm:grid-cols-4 gap-x-8 gap-y-8 sm:gap-y-10">
        <div>
          <div className="font-headline text-[22px] font-bold uppercase mb-2.5">
            Stucci<span className="text-[var(--color-red)]">Media</span>
          </div>
          <p className="text-[13.5px] text-white/60 leading-[1.6] mb-5 max-w-[32ch]">
            Independent news from Florida — the stories mainstream media won&apos;t run. Politics,
            world events, crime, and veterans&apos; issues, reported straight.
          </p>
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wide text-white/50 mb-4">Sections</h4>
          <ul className="flex flex-col text-[13.5px]">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="min-h-11 flex items-center text-white/80 hover:text-white transition-colors"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wide text-white/50 mb-4">Company</h4>
          <ul className="flex flex-col text-[13.5px]">
            <li>
              <Link href="/about" className="min-h-11 flex items-center text-white/80 hover:text-white transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="min-h-11 flex items-center text-white/80 hover:text-white transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="min-h-11 flex items-center text-white/80 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/search" className="min-h-11 flex items-center text-white/80 hover:text-white transition-colors">
                Search
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wide text-white/50 mb-4">Stay Informed</h4>
          <p className="text-[13.5px] text-white/60 leading-[1.6] mb-4 max-w-[28ch]">
            Get independent reporting straight to your inbox — free, no spam.
          </p>
          <Link
            href="/#subscribe"
            className="min-h-11 inline-flex items-center bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 rounded-control transition-colors"
          >
            Subscribe
          </Link>
        </div>
      </div>

      <div className="bg-[var(--color-navy-dark)] border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-5 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-headline text-[13px] font-bold uppercase tracking-wide text-white/90">
            Stucci Media · Independent News That Matters
          </div>
          <div className="text-[12px] text-white/50">
            © 2026 Stucci Media — All Rights Reserved · Florida
          </div>
        </div>
      </div>
    </footer>
  );
}
