import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AuthForm from "../login/AuthForm";
import { getInviteByToken } from "../lib/users";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Stucci Media account.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/register",
  },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite: token } = await searchParams;

  // Look the invite up server-side purely so the page can say who it's
  // for and which role they're joining as. The role itself is applied
  // after sign-up (see register/invite-actions.ts), which re-validates
  // the token against the session that was actually created.
  const invite = token ? await getInviteByToken(token) : undefined;
  const validInvite = invite && !invite.acceptedAt && !invite.isExpired ? invite : undefined;

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="max-w-[420px] mx-auto px-5 pt-14 pb-24">
        <h1 className="font-headline text-[32px] sm:text-[36px] font-bold uppercase tracking-[-0.005em] mb-2">
          Create Account
        </h1>

        {validInvite ? (
          <p className="font-sans text-[15px] text-[var(--color-gray)] mb-8">
            You&rsquo;ve been invited to the Stucci Media newsroom. Register with{" "}
            <strong className="text-[var(--color-text)]">{validInvite.email}</strong> and you&rsquo;ll be set up as{" "}
            {validInvite.role === "ADMIN" ? "an admin" : validInvite.role === "EDITOR" ? "an editor" : "an author"}.
          </p>
        ) : (
          <p className="font-sans text-[15px] text-[var(--color-gray)] mb-8">
            Join Stucci Media to comment and like stories.
          </p>
        )}

        <AuthForm mode="register" redirectTo="/" inviteToken={validInvite?.token} />
      </main>
      <SiteFooter />
    </>
  );
}
