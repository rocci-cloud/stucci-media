import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Stucci Media handles your data: what we collect, what we never sell, how the newsletter list is used, and how to have your information removed.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="max-w-[720px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[34px] sm:text-[46px] font-bold uppercase leading-[0.98] tracking-[-0.015em] mb-6">
          Privacy Policy
        </h1>
        <div className="text-[17px] leading-[1.75] text-[var(--color-gray)]">
          <p className="mb-5">
            Placeholder policy text — replace with your actual privacy policy before this site
            goes live. At minimum this should cover what subscriber data is collected (name and
            email from the signup form), how it's stored, and how someone can request removal.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
