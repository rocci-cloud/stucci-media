import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Check,
  FileSearch,
  Infinity as InfinityIcon,
  Mail,
  PenLine,
  Search,
  Send,
  Share2,
  Timer,
  ShieldCheck,
} from "lucide-react";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Reveal from "../components/Reveal";
import FeatureArticleForm from "./FeatureArticleForm";
import { getSiteSettings } from "../lib/settings";
import { buildFeatureArticleSchema } from "../lib/feature-article-schema";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";
const PRICE = "$125";
const CONTACT_EMAIL = "rocci@stuccimedia.com";

export const metadata: Metadata = {
  title: "Get Your Business Featured — Professional Article Writing",
  description:
    "A professionally written feature article about your business, built for Google and published permanently on Stucci Media. $125 flat, live in 72 hours.",
  alternates: { canonical: `${siteUrl}/feature-article` },
  keywords: [
    "professional article writing service",
    "business feature article",
    "SEO article writing",
    "get your business featured",
    "press coverage for small business",
    "sponsored article",
  ],
  openGraph: {
    title: "Get Your Business Featured on Stucci Media",
    description:
      "A professionally written feature article about your business, built for search and published permanently. $125 flat.",
    url: `${siteUrl}/feature-article`,
    type: "website",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Your Business Featured on Stucci Media",
    description:
      "A professionally written feature article about your business, built for search and published permanently. $125 flat.",
    images: ["/og-default.png"],
  },
};

const benefits = (turnaround: string) => [
  {
    icon: Timer,
    title: "Turned around fast",
    body: `Most articles are written, approved and published within ${turnaround} of us having what we need from you. If something about your story means it'll take longer, we tell you that up front rather than after.`,
  },
  {
    icon: InfinityIcon,
    title: "It never expires",
    body: "An ad stops working the day you stop paying for it. A published article doesn't. Yours stays live, indexed and linkable for as long as this site exists, still working for you years from now.",
  },
  {
    icon: Search,
    title: "Built to be found",
    body: "Written around the terms people actually search for your kind of business, with proper headings, metadata and structured data. It goes into our sitemap the moment it publishes so Google can find it.",
  },
  {
    icon: ShieldCheck,
    title: "Someone else said it",
    body: "Anyone can write their own About page. A feature written about you, on an independent news site, carries weight that self-published copy never will.",
  },
  {
    icon: Share2,
    title: "An asset you can reuse",
    body: "Send it to prospects. Pin it on your profiles. Put it in your email signature. Hand it to a customer who's deciding between you and someone else. One link that does the explaining for you.",
  },
  {
    icon: FileSearch,
    title: "It shows up when they look you up",
    body: "People search your name before they call you. What they find is the first impression you don't get to control — unless there's a real, well-written article sitting there waiting for them.",
  },
  {
    icon: PenLine,
    title: "You don't have to write anything",
    body: "You fill in a short questionnaire. Our staff does the research, the writing, the editing and the SEO work. You approve it. That's the whole job on your end.",
  },
];

const INCLUDED = [
  "A full-length feature article, professionally written and edited",
  "Keyword research and on-page SEO built in, not bolted on",
  "A custom headline, meta title and meta description written to earn clicks",
  "Links through to your website and profiles",
  "Structured data so search engines read it as a real news article",
  "Published on stuccimedia.com and added to our sitemap and RSS feed",
  "Shared to the Stucci Media newsletter and social channels",
  "Your article live permanently, at its own permanent URL",
];

const steps = (turnaround: string) => [
  {
    n: "01",
    title: "Fill in the questionnaire",
    body: "A handful of questions about who you are and what you'd want a reader to take away. Ten minutes, tops. That's genuinely all we need from you.",
  },
  {
    n: "02",
    title: "We write it",
    body: "Our staff researches and writes the piece, then handles the headline, the metadata and the SEO work. You get it back to read before anything goes live.",
  },
  {
    n: "03",
    title: "It publishes, and it stays",
    body: `Once you're happy, it goes live on Stucci Media with its own permanent link, gets picked up in our sitemap, and goes out to our readers. Usually within ${turnaround} of us having your answers.`,
  },
];

const faqs = (turnaround: string) => [
  {
    q: `Why ${PRICE}? What's the catch?`,
    a: "There isn't one. It's a flat fee for a piece of work, not a subscription, not a retainer, and not a rate that climbs once you're in. You pay once and the article is yours permanently.",
  },
  {
    q: "How much work is this for me?",
    a: "One questionnaire. You answer some questions about your business in plain language, and our staff turns that into a finished, publishable article. You read it before it goes live. That's it.",
  },
  {
    q: "How fast is it?",
    a: `Typically published within ${turnaround} of us having your questionnaire answers. Some stories need a little longer — if yours is one of them, we'll tell you at the start rather than let a deadline slide quietly.`,
  },
  {
    q: "When do I pay?",
    a: "You send the questionnaire first and we confirm the details with you. Payment is handled securely through Stripe — we never see or store your card details.",
  },
  {
    q: "Do I get to approve it before it publishes?",
    a: "Yes. Nothing goes live until you've read it and you're happy with it. If something's off, tell us and we'll fix it.",
  },
  {
    q: "What kinds of things can be written about?",
    a: "A business, a brand, a nonprofit, an event, a product launch, a veteran-owned company, a person with a story worth telling. If there's something real to say about it, we can write it.",
  },
  {
    q: "Will this get me to the top of Google?",
    a: "Nobody honest can promise you a ranking, and anyone who does is selling you something. What we can tell you is what the article actually is: a well-written, properly optimised, permanently indexed page on an established site, pointing at you. That's a real asset. Where it lands depends on your market.",
  },
  {
    q: "Is this an ad?",
    a: "It's written like journalism, not like a commercial, because that's what makes people read it. It is paid placement, and it's marked as sponsored where that matters, which is both honest and how search engines expect it to be handled.",
  },
];

export default async function FeatureArticlePage() {
  const settings = await getSiteSettings();
  const turnaround = settings.featureArticleTurnaround.trim() || "72 hours";
  const payLink = settings.featureArticlePaymentLink.trim();
  const BENEFITS = benefits(turnaround);
  const STEPS = steps(turnaround);
  const FAQS = faqs(turnaround);
  const schemas = buildFeatureArticleSchema(siteUrl, turnaround, FAQS);

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@type"] as string}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <BreakingBar />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[460px] items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] px-5 py-14 sm:h-[56vh] sm:max-h-[560px] sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 12% 0%, rgba(200,16,46,0.32) 0%, transparent 55%), radial-gradient(100% 80% at 100% 100%, rgba(28,90,166,0.24) 0%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)",
            }}
          />
          <div className="relative mx-auto w-full max-w-[820px] text-center animate-[heroTextReveal_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--color-red-ink)]">
              <span className="mr-2 inline-block h-1 w-1 rounded-full bg-[var(--color-red)] align-middle" />
              Featured coverage · {PRICE} flat · Published in {turnaround}
            </p>
            <h1 className="font-headline mt-4 text-[38px] font-bold uppercase leading-[0.96] tracking-[-0.02em] text-white sm:text-[58px] lg:text-[66px]">
              Get your business
              <br />
              written up like news
            </h1>
            <p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-[1.6] text-white/75 sm:text-[18px]">
              A full-length, professionally written feature about your business, built for search and published on a
              real independent news site. One flat fee. It stays online permanently.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#start"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-[var(--color-red)] px-7 font-sans text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97] sm:w-auto"
              >
                Start my article
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Feature%20article%20enquiry`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-white/25 px-7 font-sans text-[14px] font-bold uppercase tracking-wide text-white/85 transition hover:border-white/50 hover:text-white active:scale-[0.97] sm:w-auto"
              >
                <Mail className="h-4 w-4" />
                Email Rocci
              </a>
            </div>
          </div>
        </section>

        {/* The argument */}
        <Reveal>
          <section className="mx-auto max-w-[1080px] px-5 py-12 sm:py-16">
            <div className="mx-auto max-w-[70ch] text-center">
              <h2 className="font-headline text-[30px] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-[var(--color-text)] sm:text-[40px]">
                Advertising rents attention. This buys it.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.7] text-[var(--color-gray)] sm:text-[17.5px]">
                Every month you run an ad, you pay again for the same attention. Stop paying and it disappears like
                it was never there. An article works the other way round: you pay once, and it keeps sitting there,
                findable, for as long as the internet remembers you. Same money, permanently different result.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 shadow-card transition hover:shadow-card-hover"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-red)]/10 text-[var(--color-red-ink)]">
                    <b.icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-headline mt-3.5 text-[18px] font-bold uppercase leading-[1.1] tracking-[-0.01em] text-[var(--color-text)]">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-[1.6] text-[var(--color-gray)]">{b.body}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Pull quote */}
        <Reveal>
          <section className="bg-[var(--color-bg-off)] px-5 py-12 sm:py-14">
            <div className="mx-auto max-w-[820px]">
              <blockquote className="border-l-4 border-[var(--color-red)] pl-5 sm:pl-7">
                <p className="font-headline text-[24px] font-bold uppercase leading-[1.12] tracking-[-0.015em] text-[var(--color-text)] sm:text-[32px]">
                  The first thing a customer does is look you up. What they find decides whether they call.
                </p>
                <p className="mt-3.5 text-[15px] leading-[1.6] text-[var(--color-gray)]">
                  Right now that&apos;s a maps listing, whatever reviews you happen to have, and a website you wrote
                  about yourself. A real feature article on an independent news outlet changes what that search
                  looks like, and it changes it permanently.
                </p>
              </blockquote>
            </div>
          </section>
        </Reveal>

        {/* What you get + price */}
        <Reveal>
          <section className="mx-auto max-w-[1080px] px-5 py-12 sm:py-16">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
              <div>
                <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--color-red-ink)]">
                  <span className="mr-2 inline-block h-1 w-1 rounded-full bg-[var(--color-red)] align-middle" />
                  What you get
                </p>
                <h2 className="font-headline mt-2.5 text-[28px] font-bold uppercase leading-[1.02] tracking-[-0.02em] text-[var(--color-text)] sm:text-[36px]">
                  Everything, for one price
                </h2>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-red-ink)]" />
                      <span className="text-[15px] leading-[1.55] text-[var(--color-text)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="overflow-hidden rounded-card shadow-pop">
                <div className="relative bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] px-6 py-7 text-center">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background:
                        "radial-gradient(110% 90% at 0% 0%, rgba(200,16,46,0.3) 0%, transparent 55%)",
                    }}
                  />
                  <div className="relative">
                    <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/60">
                      Feature article
                    </p>
                    <p className="mt-2 flex items-baseline justify-center gap-2">
                      <span className="font-headline text-[56px] font-bold leading-none text-white">{PRICE}</span>
                    </p>
                    <p className="mt-1.5 text-[13px] text-white/60">One time. Not a subscription.</p>
                  </div>
                </div>
                <div className="bg-[var(--color-surface)] px-6 py-6 text-center">
                  <p className="text-[14.5px] leading-[1.6] text-[var(--color-gray)]">
                    No retainer, no monthly fee, and no upsell waiting on the other side. You fill in a
                    questionnaire, we do the rest.
                  </p>
                  <Link
                    href="#start"
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-[var(--color-red)] px-6 font-sans text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
                  >
                    Start my article
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {/* Only rendered once a Stripe payment link is set in
                      admin settings. Until then the page sells the service
                      and takes enquiries, which is a working state rather
                      than a broken one. */}
                  {payLink && (
                    <a
                      href={payLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-[var(--color-navy)] px-6 font-sans text-[13.5px] font-bold uppercase tracking-wide text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-white active:scale-[0.97]"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay {PRICE} now
                    </a>
                  )}
                  <p className="mt-3 text-[12px] leading-[1.5] text-[var(--color-gray-light)]">
                    {payLink
                      ? "Card payments handled securely by Stripe. We never see your card details."
                      : "Send your details first and we'll confirm everything before any payment."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* How it works */}
        <Reveal>
          <section className="bg-[var(--color-bg-off)] px-5 py-12 sm:py-16">
            <div className="mx-auto max-w-[1080px]">
              <div className="text-center">
                <h2 className="font-headline text-[28px] font-bold uppercase leading-[1.02] tracking-[-0.02em] text-[var(--color-text)] sm:text-[36px]">
                  Three steps. One of them is yours.
                </h2>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {STEPS.map((step) => (
                  <div key={step.n} className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 shadow-card">
                    <span className="font-headline text-[34px] font-bold leading-none text-[var(--color-red-ink)]/30">
                      {step.n}
                    </span>
                    <h3 className="font-headline mt-2 text-[18px] font-bold uppercase leading-[1.1] tracking-[-0.01em] text-[var(--color-text)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-[1.6] text-[var(--color-gray)]">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* The form */}
        <Reveal>
          <section id="start" className="scroll-mt-20 px-5 py-12 sm:py-16">
            <div className="mx-auto max-w-[720px]">
              <div className="text-center">
                <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--color-red-ink)]">
                  <span className="mr-2 inline-block h-1 w-1 rounded-full bg-[var(--color-red)] align-middle" />
                  Step one
                </p>
                <h2 className="font-headline mt-2.5 text-[30px] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-[var(--color-text)] sm:text-[38px]">
                  Tell us about it
                </h2>
                <p className="mx-auto mt-3 max-w-[52ch] text-[15.5px] leading-[1.6] text-[var(--color-gray)]">
                  This is the only part you have to do. Answer in plain language, the way you&apos;d explain it to
                  someone at a bar. We&apos;ll take it from there.
                </p>
              </div>
              <div className="mt-8">
                <FeatureArticleForm hasPaymentLink={Boolean(payLink)} turnaround={turnaround} />
              </div>
              <p className="mt-6 text-center text-[14px] leading-[1.6] text-[var(--color-gray)]">
                Prefer to just talk to a person? Email{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Feature%20article%20enquiry`}
                  className="font-semibold text-[var(--color-red-ink)] hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                or use the{" "}
                <Link href="/contact" className="font-semibold text-[var(--color-red-ink)] hover:underline">
                  contact page
                </Link>
                .
              </p>
            </div>
          </section>
        </Reveal>

        {/* FAQ */}
        <Reveal>
          <section className="bg-[var(--color-bg-off)] px-5 py-12 sm:py-16">
            <div className="mx-auto max-w-[820px]">
              <h2 className="font-headline text-[26px] font-bold uppercase leading-[1.02] tracking-[-0.02em] text-[var(--color-text)] sm:text-[32px]">
                Straight answers
              </h2>
              <dl className="mt-6 flex flex-col gap-5">
                {FAQS.map((faq) => (
                  <div key={faq.q} className="border-t border-[var(--color-hairline)] pt-5">
                    <dt className="font-headline text-[17px] font-bold uppercase leading-[1.15] tracking-[-0.01em] text-[var(--color-text)]">
                      {faq.q}
                    </dt>
                    <dd className="mt-2 text-[15px] leading-[1.65] text-[var(--color-gray)]">{faq.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </Reveal>

        {/* Closing CTA */}
        <Reveal>
          <section className="px-5 py-12 sm:py-16">
            <div className="mx-auto max-w-[820px] text-center">
              <h2 className="font-headline text-[28px] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-[var(--color-text)] sm:text-[38px]">
                One questionnaire away
              </h2>
              <p className="mx-auto mt-3 max-w-[54ch] text-[16px] leading-[1.65] text-[var(--color-gray)]">
                {PRICE}, once, for a professionally written feature that keeps working long after any ad you could
                have bought with the same money has stopped.
              </p>
              <Link
                href="#start"
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-[var(--color-red)] px-8 font-sans text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
              >
                <Send className="h-4 w-4" />
                Start my article
              </Link>
            </div>
          </section>
        </Reveal>
      </main>

      <SiteFooter />
    </>
  );
}
