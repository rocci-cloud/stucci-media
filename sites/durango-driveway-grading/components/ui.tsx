import Link from "next/link";
import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide";
}) {
  const max =
    width === "narrow" ? "max-w-3xl" : width === "wide" ? "max-w-[1440px]" : "max-w-6xl";
  return <div className={`mx-auto w-full ${max} px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow text-gold ${className}`}>{children}</p>;
}

/**
 * The one accent discipline that matters: gold means "this is the next
 * action". Only `primary` fills with gold, and a page should render at most
 * one per screen. Everything else is outlined or plain.
 */
export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  external?: boolean;
}) {
  const base =
    "inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] transition-colors duration-200";
  const styles = {
    primary: "bg-gold text-ink hover:bg-white",
    outline: "border border-rule-strong text-text hover:border-gold hover:text-gold",
    ghost: "text-muted hover:text-gold",
  }[variant];

  const cls = `${base} ${styles} ${className}`;
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Section({
  children,
  className = "",
  id,
  tone = "ground",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "ground" | "surface";
}) {
  const bg = tone === "surface" ? "bg-surface" : "bg-ground";
  return (
    <section id={id} className={`${bg} py-16 sm:py-24 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`${alignment} ${align === "center" ? "max-w-3xl" : ""}`}>
      {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
      <h2 className="display-lg font-semibold uppercase text-text">{title}</h2>
      {lede ? (
        <p className={`mt-4 text-base leading-relaxed text-muted sm:text-lg ${align === "left" ? "measure" : ""}`}>
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** Native <details> — an accordion needs no JavaScript and stays open to search engines. */
export function FaqList({ faqs }: { faqs: readonly { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-rule border-y border-rule">
      {faqs.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left font-medium text-text marker:content-none hover:text-gold">
            <span className="text-base sm:text-lg">{f.q}</span>
            <span
              aria-hidden="true"
              className="mt-1 shrink-0 text-gold transition-transform duration-200 group-open:rotate-45"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
          </summary>
          <p className="measure pb-6 text-[15px] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-gold pl-4">
      <dt className="eyebrow text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-text">{value}</dd>
    </div>
  );
}
