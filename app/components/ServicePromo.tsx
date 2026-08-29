import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

/**
 * House ad for the $125 feature-article service.
 *
 * Built in markup rather than as a banner image, deliberately. The existing
 * BannerSlot renders one fixed 3:1/4:1 image at every viewport, which is
 * fine for a logo or a product shot but wrong for an ad whose job is to
 * carry a price, three benefits and a call to action: at 390px wide that
 * text would be unreadable. Rendering it as markup means it reflows for the
 * screen it is on, stays sharp on every display, keeps the copy as real
 * selectable text search engines can read, and can be reworded without
 * regenerating an asset.
 *
 * Two variants, so the same offer fits both a full-width in-content slot
 * and the narrow sidebar column.
 */

const PRICE = "$125";
const HREF = "/feature-article";

export default function ServicePromo({
  variant = "banner",
  className = "",
}: {
  variant?: "banner" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <aside
        className={`relative overflow-hidden rounded-card bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] shadow-card ${className}`}
      >
        <Glow />
        <div className="relative px-5 py-6">
          <Kicker />
          <p className="font-headline mt-2.5 text-[21px] font-bold uppercase leading-[1.02] tracking-[-0.015em] text-white">
            Get your business written up
          </p>
          <p className="mt-2 text-[13.5px] leading-[1.5] text-white/70">
            A full feature article on Stucci Media, built to be found on Google. Yours permanently.
          </p>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="font-headline text-[30px] font-bold leading-none text-white">{PRICE}</span>
            <span className="text-[12px] text-white/55">one time</span>
          </p>
          <Link
            href={HREF}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-control bg-[var(--color-red)] px-4 font-sans text-[12.5px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
          >
            See what&apos;s included
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`relative overflow-hidden rounded-card bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] shadow-card ${className}`}
    >
      <Glow />
      {/* Stacks on a phone, becomes a two-column ad on a tablet and up. One
          component, no art direction, no second asset to keep in sync. */}
      <div className="relative flex flex-col gap-6 px-5 py-7 sm:px-8 sm:py-9 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <Kicker />
          <p className="font-headline mt-2.5 text-[26px] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-white sm:text-[34px]">
            Your story, written like news
          </p>
          <p className="mt-3 max-w-[52ch] text-[14.5px] leading-[1.55] text-white/70 sm:text-[15.5px]">
            A full-length, professionally written feature about your business, built for search and published on a
            real news site. It stays up permanently.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {["Written by our staff", "Built for Google", "Never expires"].map((point) => (
              <li key={point} className="flex items-center gap-1.5 text-[13px] text-white/75">
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-red-ink)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <p className="flex items-baseline gap-2">
            <span className="font-headline text-[42px] font-bold leading-none text-white sm:text-[48px]">
              {PRICE}
            </span>
            <span className="text-[13px] text-white/55">one time</span>
          </p>
          <Link
            href={HREF}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-[var(--color-red)] px-6 font-sans text-[13.5px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Kicker() {
  return (
    <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--color-red-ink)]">
      <span className="mr-2 inline-block h-1 w-1 rounded-full bg-[var(--color-red)] align-middle" />
      Featured coverage
    </p>
  );
}

function Glow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        background:
          "radial-gradient(110% 90% at 0% 0%, rgba(200,16,46,0.26) 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, rgba(28,90,166,0.2) 0%, transparent 60%)",
      }}
    />
  );
}
