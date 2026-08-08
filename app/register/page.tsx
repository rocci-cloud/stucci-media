import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AuthForm from "../login/AuthForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Stucci Media account.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[420px] mx-auto px-5 pt-14 pb-24">
        <h1 className="font-headline text-[32px] sm:text-[36px] font-bold uppercase tracking-[-0.005em] mb-2">
          Create Account
        </h1>
        <p className="font-sans text-[15px] text-[var(--color-gray)] mb-8">
          Join Stucci Media to comment and like stories.
        </p>
        <AuthForm mode="register" redirectTo="/" />
      </main>
      <SiteFooter />
    </>
  );
}
