import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "About",
  description: "About Stucci Media — independent news and analysis from Florida.",
};

export default function AboutPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[720px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[32px] sm:text-[42px] font-bold uppercase tracking-[-0.005em] mb-6">
          About Stucci Media
        </h1>
        <div className="text-[17px] sm:text-[19px] leading-[1.75]">
          <p className="mb-5">
            Stucci Media is an independent news outlet based in Florida, covering
            political news, world events, social issues, and the stories mainstream outlets
            won&apos;t run.
          </p>
          <p className="mb-5">
            Founded and led by Rocci Stucci, Stucci Media also produces The Rocci Stucci Show
            and a growing lineup of podcasts covering current events, crime and investigation,
            and veteran-focused reporting.
          </p>
          <p>
            Have a tip, a story, or feedback? Get in touch through our{" "}
            <a href="/contact" className="text-[var(--color-red)] underline">
              contact page
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
