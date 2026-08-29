import SubscribeForm from "./SubscribeForm";

/**
 * In-article email capture, placed where a reader has just finished the
 * piece and is deciding whether to leave. Articles were the one high-traffic
 * template on the site with no capture point at all, which meant the pages
 * people actually arrive on from social and search were the pages that asked
 * for nothing.
 *
 * Uses the navy gradient language of the site's other dark panels rather
 * than a second copy of the homepage strip, so it reads as an editorial
 * sign-off rather than an ad slot.
 */
export default function ArticleSubscribeCta() {
  return (
    <aside className="relative overflow-hidden rounded-card bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] px-5 py-7 shadow-card sm:px-8 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(110% 90% at 0% 0%, rgba(200,16,46,0.26) 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, rgba(28,90,166,0.2) 0%, transparent 60%)",
        }}
      />
      <div className="relative">
        <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--color-red-ink)]">
          <span className="mr-2 inline-block h-1 w-1 rounded-full bg-[var(--color-red)] align-middle" />
          Don&apos;t miss the next one
        </p>
        <h2 className="font-headline mt-2.5 text-[24px] font-bold uppercase leading-[1.02] tracking-[-0.015em] text-white sm:text-[29px]">
          Get these stories first
        </h2>
        <p className="mt-2.5 max-w-[46ch] text-[14.5px] leading-[1.55] text-white/70">
          Independent reporting on politics, crime, veterans and free speech. Free, and no corporate spin.
        </p>
        <div className="mt-5 max-w-[420px]">
          <SubscribeForm source="article" onDark successMessage="You're on the list. Watch your inbox." />
        </div>
      </div>
    </aside>
  );
}
