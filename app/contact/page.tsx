import type { Metadata } from "next";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Stucci Media — tips, feedback, and inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[560px] mx-auto px-5 pt-10 pb-20">
        <h1 className="font-headline text-[32px] sm:text-[42px] font-black tracking-[-0.01em] mb-3">
          Contact Stucci Media
        </h1>
        <p className="font-sans text-[15px] text-[var(--color-gray)] mb-8">
          Have a tip, a correction, or a question? Send it our way.
        </p>

        {/* Static for now — wired to real email delivery in a later phase */}
        <form className="font-sans flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-[13px] font-bold uppercase tracking-wide mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-3.5 py-3 border border-[#B9B9B9] rounded-sm text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[13px] font-bold uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3.5 py-3 border border-[#B9B9B9] rounded-sm text-sm"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-[13px] font-bold uppercase tracking-wide mb-1.5">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={6}
              className="w-full px-3.5 py-3 border border-[#B9B9B9] rounded-sm text-sm resize-y"
            />
          </div>
          <button
            type="submit"
            className="self-start bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-6 py-3 rounded-sm"
          >
            Send Message
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
