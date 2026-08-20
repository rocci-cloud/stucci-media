import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getDailyQuiz } from "../lib/daily-quiz";
import { getSiteSettings } from "../lib/settings";
import DailyBriefQuiz from "./DailyBriefQuiz";

export const metadata: Metadata = {
  title: "The Daily Brief",
  description: "A 5-question daily quiz on real Stucci Media headlines. Did you actually read the news today?",
  alternates: { canonical: "/daily-brief" },
};

// Deliberately not cached/ISR the way most public pages are — the quiz is
// seeded from today's UTC date (see lib/daily-quiz.ts), so it needs to be
// computed fresh once the date actually rolls over, not served stale from
// yesterday until the next revalidate window.
export const revalidate = 0;

export default async function DailyBriefPage() {
  const [settings, quiz] = await Promise.all([getSiteSettings(), getDailyQuiz()]);
  // Switched off in Settings → Feature flags renders the same
  // not-available state as having too few stories, rather than a 404 —
  // the route still exists, there just isn't a brief today.
  const questions = settings.featureDailyBrief ? quiz : [];

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-[640px] px-5 pt-10 sm:pt-14 pb-20">
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-red)]">
            New Every Day
          </span>
          <h1 className="font-headline text-[34px] sm:text-[42px] font-bold uppercase leading-[0.98] tracking-[-0.015em]">
            The Daily Brief
          </h1>
          <p className="mt-2 font-sans text-[14.5px] text-[var(--color-gray)]">
            5 real headlines. Did you actually read the news today?
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="rounded-card border border-dashed border-[var(--color-hairline)] px-6 py-12 text-center font-sans text-[14px] text-[var(--color-gray)]">
            Not enough stories published yet to build today&rsquo;s brief — check back soon.
          </p>
        ) : (
          <DailyBriefQuiz questions={questions} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
