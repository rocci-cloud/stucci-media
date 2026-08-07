import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Stucci Media's privacy policy.",
};

export default function PrivacyPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[720px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[32px] sm:text-[42px] font-bold uppercase tracking-[-0.005em] mb-6">
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
