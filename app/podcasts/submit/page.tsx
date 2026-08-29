import type { Metadata } from "next";
import Link from "next/link";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import SubmitForm from "./SubmitForm";

export const metadata: Metadata = {
  title: "Submit Your Podcast",
  description:
    "Stucci Media is a curated network, not an open platform. Submit your show's details and RSS feed for consideration.",
  alternates: { canonical: "/podcasts/submit" },
  openGraph: {
    title: "Submit Your Podcast | Stucci Media",
    description:
      "Stucci Media is a curated network, not an open platform. Submit your show for consideration.",
    type: "website",
    images: ["/og-default.png"],
  },
};

export default function SubmitPodcastPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-[720px] px-5 pt-8 sm:pt-10 pb-16 sm:pb-20">
        <Link
          href="/podcasts"
          className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-gray)] hover:text-[var(--color-red-ink)] transition-colors"
        >
          ← All podcasts
        </Link>

        <div className="mt-1 flex items-center gap-2 mb-2">
          <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
          <span className="font-headline uppercase font-bold text-[13px] sm:text-[14px] tracking-[0.06em] text-[var(--color-gray)]">
            By Invitation
          </span>
        </div>

        <h1 className="font-headline text-[34px] sm:text-[46px] font-bold uppercase leading-[0.98] tracking-[-0.015em]">
          Submit Your Podcast
        </h1>

        <div className="mt-4 rounded-card border-l-4 border-[var(--color-red)] bg-[var(--color-bg-off)] px-5 py-4">
          <p className="font-sans text-[15px] leading-[1.6] text-[var(--color-text)]">
            <strong>Stucci Media is a curated network, not an open platform.</strong> Shows are
            hand-picked and added by us — submitting doesn&rsquo;t put your podcast on the site.
            Every submission is read, and we&rsquo;ll come back to you either way.
          </p>
        </div>

        <p className="mt-5 font-sans text-[15px] leading-[1.6] text-[var(--color-gray)]">
          Tell us who you are, how to reach you, and where your feed lives. The more you tell us
          about the show, the easier it is to say yes.
        </p>

        <div className="mt-7">
          <SubmitForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
