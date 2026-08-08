import type { Metadata } from "next";
import { Mail } from "lucide-react";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Stucci Media — tips, corrections, questions, and media inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main className="max-w-[640px] mx-auto px-5 pt-8 sm:pt-10 pb-16 sm:pb-20">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
          <span className="font-headline uppercase font-bold text-[13px] sm:text-[14px] tracking-[0.06em] text-[var(--color-gray)]">
            Get In Touch
          </span>
        </div>
        <h1 className="font-headline text-[34px] sm:text-[46px] font-bold uppercase leading-[0.98] tracking-[-0.015em] mb-3">
          Contact Stucci Media
        </h1>
        <p className="font-sans text-[15px] sm:text-[16px] text-[var(--color-gray)] leading-[1.5] mb-7 max-w-[52ch]">
          Tips, corrections, questions, or media inquiries — we read every message.
        </p>

        {/* Prominent, tap-friendly direct-email card */}
        <a
          href="mailto:rocci@stuccimedia.com"
          className="group flex items-center gap-3.5 min-h-11 rounded-card border border-[var(--color-hairline)] shadow-card hover:shadow-card-hover bg-white px-5 py-4 mb-8 sm:mb-9 transition active:scale-[0.99]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-red)]/10">
            <Mail className="h-5 w-5 text-[var(--color-red)]" />
          </div>
          <div className="min-w-0">
            <div className="font-sans text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--color-gray-light)] mb-0.5">
              Email Us Directly
            </div>
            <div className="font-headline text-[17px] sm:text-[20px] font-bold tracking-[-0.01em] text-[var(--color-navy)] group-hover:text-[var(--color-red)] transition-colors truncate">
              rocci@stuccimedia.com
            </div>
          </div>
        </a>

        <div className="flex items-center gap-3 mb-6">
          <span className="h-px flex-1 bg-[var(--color-hairline)]" />
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-gray-light)]">
            Or Send A Message
          </span>
          <span className="h-px flex-1 bg-[var(--color-hairline)]" />
        </div>

        {/* Static for now — wired to real email delivery in a later phase */}
        <form className="font-sans flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-[12.5px] font-bold uppercase tracking-[0.04em] mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-3.5 py-3 min-h-11 border border-[#B9B9B9] rounded-control bg-white text-[15px] text-[var(--color-text)] focus:border-[var(--color-navy)] outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[12.5px] font-bold uppercase tracking-[0.04em] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3.5 py-3 min-h-11 border border-[#B9B9B9] rounded-control bg-white text-[15px] text-[var(--color-text)] focus:border-[var(--color-navy)] outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-[12.5px] font-bold uppercase tracking-[0.04em] mb-1.5">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={6}
              className="w-full px-3.5 py-3 border border-[#B9B9B9] rounded-control bg-white text-[15px] text-[var(--color-text)] focus:border-[var(--color-navy)] outline-none transition-colors resize-y"
            />
          </div>
          <button
            type="submit"
            className="self-start min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-6 py-3 rounded-control transition active:scale-[0.97]"
          >
            Send Message
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
