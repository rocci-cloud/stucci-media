import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AuthForm from "./AuthForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Stucci Media account.",
  // Auth pages have no unique content worth ranking and would otherwise
  // compete with real editorial pages for crawl budget.
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/login",
  },
};

type Props = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { from } = await searchParams;
  const redirectTo = from && from.startsWith("/") ? from : "/";

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="max-w-[420px] mx-auto px-5 pt-14 pb-24">
        <h1 className="font-headline text-[32px] sm:text-[36px] font-bold uppercase tracking-[-0.005em] mb-2">
          Sign In
        </h1>
        <p className="font-sans text-[15px] text-[var(--color-gray)] mb-8">
          Welcome back to Stucci Media.
        </p>
        <AuthForm mode="login" redirectTo={redirectTo} />
      </main>
      <SiteFooter />
    </>
  );
}
