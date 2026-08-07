import Link from "next/link";
import { categories } from "../lib/categories";

export default function SiteFooter() {
  return (
    <footer className="font-sans bg-[var(--color-navy)] text-white mt-4">
      <div className="mx-auto max-w-[1280px] px-5 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <div className="font-headline text-[22px] font-bold uppercase mb-2.5">
            Stucci<span className="text-[var(--color-red)]">Media</span>
          </div>
          <p className="text-[13px] text-white/60 leading-[1.5]">
            Independent news from Florida — the stories mainstream media won&apos;t run.
          </p>
        </div>

        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wide text-white/50 mb-3">Sections</h4>
          <ul className="flex flex-col gap-2 text-[13px]">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/80 hover:text-white">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wide text-white/50 mb-3">Company</h4>
          <ul className="flex flex-col gap-2 text-[13px]">
            <li>
              <Link href="/about" className="text-white/80 hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-white/80 hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-white/80 hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/search" className="text-white/80 hover:text-white">
                Search
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wide text-white/50 mb-3">Follow</h4>
          <p className="text-[13px] text-white/60 leading-[1.5]">
            Subscribe above for the stories that matter — straight to your inbox.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-5 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-white/50">
          <div>© 2026 Stucci Media — All Rights Reserved</div>
          <div>Florida</div>
        </div>
      </div>
    </footer>
  );
}
