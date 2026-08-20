import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { auth } from "../lib/auth";
import { getSavedArticlesForUser } from "../lib/articles";
import SavedArticlesGrid from "./SavedArticlesGrid";

export const metadata: Metadata = {
  title: "Saved Articles",
  description: "Your saved Stucci Media articles.",
  robots: { index: false, follow: true },
};

export default async function SavedArticlesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?from=/saved");

  const articles = await getSavedArticlesForUser(session.user.id);

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-[1280px] px-5 pt-8 sm:pt-10 pb-18">
        <div className="mb-6 sm:mb-8 border-b-4 border-[var(--color-navy)] pb-4">
          <h1 className="font-headline text-[32px] sm:text-[42px] font-bold uppercase leading-[0.98] tracking-[-0.015em]">
            Saved Articles
          </h1>
          <p className="mt-1.5 font-sans text-[14px] text-[var(--color-gray)]">
            Stories you&rsquo;ve bookmarked to read later.
          </p>
        </div>
        <SavedArticlesGrid initialArticles={articles} />
      </main>
      <SiteFooter />
    </>
  );
}
