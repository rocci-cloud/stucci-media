import type { Metadata } from "next";
import { Zap, Newspaper, ShieldCheck, Users } from "lucide-react";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SubscribeForm from "../components/SubscribeForm";
import Badge from "../components/ui/Badge";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "Join Stucci Media",
  description:
    "Free membership: breaking news, deep investigations, and the stories mainstream media won't run — straight to your inbox.",
  alternates: {
    canonical: "/subscribe",
  },
};

const BENEFITS = [
  {
    icon: Zap,
    title: "Breaking News First",
    copy: "The story lands in your inbox before it hits the mainstream cycle — not a day-old recap.",
  },
  {
    icon: Newspaper,
    title: "Deep Investigations",
    copy: "Fully-sourced reporting on the stories other outlets won't touch, in full — no paywall halfway through.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Corporate Spin",
    copy: "No advertisers, no shareholders, no parent company shaping what you're told. Reporting that answers to readers.",
  },
  {
    icon: Users,
    title: "Built By Florida, For Everyone",
    copy: "Boots-on-the-ground reporting plus The Rocci Stucci Show — one membership, the whole operation.",
  },
];

const INCLUDED = [
  "Every investigation, the day it publishes",
  "Breaking news alerts before mainstream coverage",
  "Full access to The Rocci Stucci Show notes",
  "No paywalls, no sponsored content mixed into your feed",
];

const FOUNDING_PERKS = [
  "Ad-free reading, sitewide",
  "Early access to investigations before publish",
  "Monthly behind-the-scenes dispatch from the newsroom",
  "Your name in our supporter credits",
];

const FAQS = [
  {
    q: "Is this really free?",
    a: "Yes — no credit card, no trial period, no catch. Independent doesn't mean paywalled.",
  },
  {
    q: "How often will I hear from you?",
    a: "Only when there's a real story worth your time — no daily filler just to fill an inbox.",
  },
  {
    q: "Do you sell or share my email?",
    a: "Never. Your inbox is yours — it's used for one thing: sending you the newsletter.",
  },
  {
    q: "Can I unsubscribe anytime?",
    a: "One click, no survey, no guilt trip. If it's not for you, leaving is instant.",
  },
];

export default function SubscribePage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        {/* --- Cinematic, height-driven hero (same technique as the homepage/
            article hero: a tall band + layered vignette, not just padding) --- */}
        <section className="relative overflow-hidden border-b-4 border-[var(--color-red)] bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-dark)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,16,46,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />
          <div className="relative flex min-h-[440px] h-[56svh] sm:h-[54vh] sm:max-h-[540px] items-center justify-center px-5 py-10">
            <div className="mx-auto max-w-[820px] text-center [animation:heroTextReveal_0.9s_cubic-bezier(0.16,1,0.3,1)_both]">
              <Badge variant="red" className="mb-4">
                Membership · Free
              </Badge>
              <h1 className="font-headline text-white text-[38px] sm:text-[56px] lg:text-[64px] font-bold uppercase leading-[0.96] tracking-[-0.02em] mb-5">
                Stand With Independent Journalism
              </h1>
              <p className="text-white/80 text-[16px] sm:text-[19px] leading-[1.6] max-w-[58ch] mx-auto mb-8">
                No corporate owners. No editorial board softening the truth. Reporting that goes
                where the mainstream won&apos;t — straight to your inbox.
              </p>
              <a
                href="#join"
                className="inline-flex min-h-12 items-center justify-center rounded-control bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] active:scale-[0.97] px-8 font-sans text-[15px] font-bold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(200,16,46,0.35)] transition"
              >
                Join Free →
              </a>
            </div>
          </div>
        </section>

        {/* --- What you get --- */}
        <Reveal>
          <section className="mx-auto max-w-[1100px] px-5 py-10 sm:py-12">
            <div className="text-center mb-8">
              <h2 className="font-headline uppercase font-bold text-[26px] sm:text-[34px] tracking-[-0.02em] mb-2.5">
                What You Get
              </h2>
              <p className="font-sans text-[var(--color-gray)] text-[15px] sm:text-[16px] max-w-[56ch] mx-auto">
                One membership. The full operation — news, investigations, and the show.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-card border border-[var(--color-hairline)] shadow-card hover:shadow-card-hover bg-[var(--color-surface)] p-[18px] sm:p-5 transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-red)]/10 mb-3">
                    <b.icon className="h-[18px] w-[18px] text-[var(--color-red-ink)]" />
                  </div>
                  <h3 className="font-headline uppercase font-bold text-[15px] tracking-[-0.01em] mb-1.5">
                    {b.title}
                  </h3>
                  <p className="font-sans text-[13.5px] text-[var(--color-gray)] leading-[1.5]">{b.copy}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* --- Why it matters --- */}
        <Reveal>
          <section className="bg-[var(--color-bg-off)] border-y border-[var(--color-hairline)]">
            <div className="mx-auto max-w-[760px] px-5 py-10 sm:py-12">
              <p className="font-headline uppercase text-[22px] sm:text-[29px] leading-[1.3] tracking-[-0.01em] border-l-4 border-[var(--color-red)] pl-5 sm:pl-7">
                Every major outlet answers to a boardroom, an advertiser, or a parent company
                with its own interests. Stucci Media answers to readers. That&apos;s the whole
                model.
              </p>
            </div>
          </section>
        </Reveal>

        {/* --- Plan comparison: one active free tier (dominant), one
            clearly-labeled coming-soon tier for visual hierarchy — no
            billing infrastructure exists yet, so the second tier is
            informational only (no dead/non-functional button). --- */}
        <Reveal>
          <section id="join" className="mx-auto max-w-[900px] px-5 py-10 sm:py-14 scroll-mt-20">
            <div className="text-center mb-8">
              <h2 className="font-headline uppercase font-bold text-[26px] sm:text-[32px] tracking-[-0.02em] mb-2.5">
                Choose Your Access
              </h2>
              <p className="font-sans text-[var(--color-gray)] text-[15px] max-w-[56ch] mx-auto">
                Free today, for everyone. Founding tiers are coming for readers who want to do
                more.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr] gap-5 sm:gap-6 items-start">
              {/* Free — active, dominant */}
              <div className="rounded-card border border-[var(--color-hairline)] shadow-card-hover bg-[var(--color-surface)] overflow-hidden">
                <div className="bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-dark)] px-6 py-6 sm:py-7 text-center">
                  <Badge variant="red" className="mb-3">
                    Available Now
                  </Badge>
                  <div className="font-headline text-white text-[26px] sm:text-[30px] font-bold uppercase tracking-[-0.015em]">
                    Free Access
                  </div>
                  <div className="font-sans text-white/70 text-[13px] mt-1">$0 — free, forever</div>
                </div>

                <div className="px-6 py-6 sm:px-8 sm:py-7">
                  <ul className="flex flex-col gap-2.5 mb-6">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 font-sans text-[14px] text-[var(--color-text)]">
                        <span className="mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-red)] text-white text-[10px] font-bold leading-none">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <SubscribeForm stacked source="subscribe-page" />
                  <p className="font-sans text-[11.5px] text-[var(--color-gray-light)] text-center mt-3.5">
                    No spam, ever. Cancel anytime, one click.
                  </p>
                </div>
              </div>

              {/* Founding Supporter — coming soon, deliberately muted/
                  secondary so the eye lands on Free Access first */}
              <div className="rounded-card border border-dashed border-[var(--color-hairline-strong)]/25 bg-[var(--color-bg-off)] overflow-hidden">
                <div className="px-6 py-6 sm:py-7 text-center border-b border-dashed border-[var(--color-hairline-strong)]/20">
                  <Badge variant="navy" className="mb-3">
                    Coming Soon
                  </Badge>
                  <div className="font-headline text-[var(--color-text)] text-[26px] sm:text-[30px] font-bold uppercase tracking-[-0.015em]">
                    Founding Supporter
                  </div>
                  <div className="font-sans text-[var(--color-gray)] text-[13px] mt-1">
                    For readers who want to do more
                  </div>
                </div>

                <div className="px-6 py-6 sm:px-8 sm:py-7">
                  <ul className="flex flex-col gap-2.5 mb-6">
                    {FOUNDING_PERKS.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 font-sans text-[14px] text-[var(--color-gray)]">
                        <span className="mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-gray-light)]/40 text-[var(--color-text)] text-[10px] font-bold leading-none">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="min-h-11 flex items-center justify-center rounded-control border border-[var(--color-hairline-strong)]/20 font-sans text-[12.5px] font-bold uppercase tracking-wide text-[var(--color-gray)]">
                    Not Yet Available
                  </div>
                  <p className="font-sans text-[11.5px] text-[var(--color-gray-light)] text-center mt-3.5">
                    Join free today — we&apos;ll email founding members first.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* --- FAQ --- */}
        <Reveal>
          <section className="mx-auto max-w-[720px] px-5 py-10 sm:py-12 border-t border-[var(--color-hairline)]">
            <h2 className="font-headline uppercase font-bold text-[24px] sm:text-[28px] tracking-[-0.02em] mb-6 text-center">
              Common Questions
            </h2>
            <dl className="flex flex-col divide-y divide-[var(--color-hairline)]">
              {FAQS.map((item) => (
                <div key={item.q} className="py-[18px]">
                  <dt className="font-headline uppercase font-bold text-[15px] sm:text-[16px] tracking-[-0.005em] mb-1.5">
                    {item.q}
                  </dt>
                  <dd className="font-sans text-[14px] sm:text-[14.5px] text-[var(--color-gray)] leading-[1.55]">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
