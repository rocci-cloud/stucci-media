import Image from "next/image";
import Link from "next/link";
import { site, pillars, processSteps, thesis, warningSigns } from "@/content/site";
import { services } from "@/content/services";
import { areas, featuredAreaSlugs, areasBySlug } from "@/content/areas";
import { Button, Container, Eyebrow, Section, SectionHead } from "@/components/ui";

export function Pillars() {
  return (
    <div className="grid gap-px border border-rule bg-rule sm:grid-cols-3">
      {pillars.map((p) => (
        <div key={p.title} className="bg-surface p-6 sm:p-8">
          <h3 className="text-base font-semibold uppercase tracking-[0.04em] text-gold">{p.title}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.body}</p>
        </div>
      ))}
    </div>
  );
}

export function ProcessSteps() {
  return (
    <ol className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
      {processSteps.map((s) => (
        <li key={s.n} className="bg-surface p-6 sm:p-7">
          <span className="font-mono text-sm text-gold">{s.n}</span>
          <h3 className="mt-3 text-base font-semibold uppercase leading-snug tracking-[0.02em] text-text">
            {s.title}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function WarningSigns({ title = "Common signs your driveway needs more than a grading pass" }: { title?: string }) {
  return (
    <div>
      <h3 className="display-md font-semibold uppercase text-text">{title}</h3>
      <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {warningSigns.map((s) => (
          <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-muted">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-gold" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceGrid({ exclude }: { exclude?: string }) {
  const list = services.filter((s) => s.slug !== exclude);
  return (
    <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
      {list.map((s) => (
        <Link
          key={s.slug}
          href={`/services/${s.slug}`}
          className="group flex flex-col bg-surface p-6 transition-colors hover:bg-surface-2 sm:p-7"
        >
          <h3 className="text-base font-semibold uppercase leading-snug tracking-[0.02em] text-text group-hover:text-gold">
            {s.name}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.helpsWith}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-gold">
            Learn more
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1">
              <path d="M9 1l4 4-4 4M13 5H1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function AreaGrid({ slugs }: { slugs?: readonly string[] }) {
  const list = slugs
    ? slugs.map((s) => areasBySlug.get(s)).filter((a): a is NonNullable<typeof a> => Boolean(a))
    : areas;
  return (
    <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
      {list.map((a) => (
        <Link
          key={a.slug}
          href={`/service-areas/${a.slug}`}
          className="group relative flex flex-col justify-end overflow-hidden bg-surface"
        >
          <div className="relative aspect-[16/10]">
            <Image
              src={a.image}
              alt={a.imageAlt}
              fill
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
              className="object-cover opacity-60 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ground via-ground/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="text-lg font-semibold uppercase tracking-[0.02em] text-text group-hover:text-gold">
                {a.name}
                {a.isNew ? (
                  <span className="ml-2 align-middle bg-gold px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink">
                    New
                  </span>
                ) : null}
              </h3>
              <p className="mt-1.5 text-[13px] leading-snug text-muted">{a.cardBlurb}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Closing call to action. One gold button; the phone sits beside it as an outline. */
export function CtaBand({
  eyebrow = "Get started",
  title = "Ready to find out what your driveway actually needs?",
  body = "Send a few details about your driveway, the main issue you're seeing, and any photos you have. I'll review the request personally and help you figure out the next best step.",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
}) {
  return (
    <Section tone="surface" className="bg-pines">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
          <h2 className="display-lg font-semibold uppercase text-text">{title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{body}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/request-consultation">Request a Driveway Consultation</Button>
            <Button href={site.phoneHref} variant="outline" external>
              Call or Text {site.phone}
            </Button>
          </div>
          <p className="mx-auto mt-7 max-w-xl text-sm leading-relaxed text-muted">{site.closingLine}</p>
        </div>
      </Container>
    </Section>
  );
}

/** The drainage thesis, used on the homepage and every service page. */
export function ThesisBlock() {
  return (
    <div className="border-l-2 border-gold pl-6 sm:pl-8">
      <p className="display-md font-semibold uppercase text-text">{thesis.headline}</p>
      <p className="measure mt-5 text-base leading-relaxed text-muted">{thesis.support}</p>
      <p className="measure mt-4 text-base leading-relaxed text-muted">{thesis.consequence}</p>
      <p className="mt-6 font-mono text-sm text-gold">{thesis.standard}</p>
    </div>
  );
}

export function MeetDoug() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <Eyebrow className="mb-3">Owner-operated</Eyebrow>
        <h2 className="display-lg font-semibold uppercase text-text">You Work Directly With Me</h2>
        <div className="measure mt-6 flex flex-col gap-4 text-base leading-relaxed text-muted">
          <p>
            When you contact {site.name}, I&apos;m the person who reviews your request, talks through
            the driveway with you, develops the game plan, and — if you hire me — does the work.
          </p>
          <p>
            There isn&apos;t a handoff between the person making the recommendation and the person
            responsible for carrying it out.
          </p>
          <p>
            I stand behind my workmanship and proactively follow up after completed work has
            experienced seasonal weather and normal use.
          </p>
        </div>
        <div className="mt-8">
          <Button href="/about" variant="outline">About {site.shortName}</Button>
        </div>
      </div>
      <div className="relative aspect-[4/5] w-full border border-rule">
        <Image
          src="/images/doug/doug-odell-owner-operator.jpg"
          alt="Doug O'Dell standing beside a John Deere skid steer on a freshly compacted gravel driveway in La Plata County, Colorado"
          fill
          sizes="(min-width: 1024px) 440px, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
