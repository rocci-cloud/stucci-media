import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Stucci Media — tips, corrections, questions, and media inquiries.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | Stucci Media",
    description: "Get in touch with Stucci Media — tips, corrections, questions, and media inquiries.",
    type: "website",
    images: ["/og-default.png"],
  },
};

export default function ContactPage() {
  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content" className="max-w-[640px] mx-auto px-5 pt-8 sm:pt-10 pb-16 sm:pb-20">
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
          Tips, corrections, questions, or media inquiries — we read every message. Pitching a
          podcast?{" "}
          <Link href="/podcasts/submit" className="font-bold text-[var(--color-red)] hover:underline">
            Use the show submission form
          </Link>{" "}
          instead — it asks for the details we actually need.
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

        <ContactForm />
      </main>
      <SiteFooter />
    </>
  );
}
