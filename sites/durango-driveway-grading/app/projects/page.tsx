import Image from "next/image";
import Link from "next/link";
import { Container, Eyebrow, Section, SectionHead } from "@/components/ui";
import { CtaBand } from "@/components/blocks";
import { projects } from "@/content/projects";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Driveway Projects in La Plata County, CO",
  description:
    "Documented gravel driveway restorations in Durango and Bayfield, Colorado — the problem, the diagnosis, the work, and the result, with before and after photography.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <>
      <Section className="border-b border-rule bg-pines">
        <Container>
          <Eyebrow className="mb-4">Completed work</Eyebrow>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">
            See the Work Before You Decide
          </h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">
            Every project here is documented the same way: what was actually going wrong, what the
            evaluation found, what work was done, and what changed. Before, during, and after.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col gap-px border border-rule bg-rule">
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}`}
                className="group grid gap-0 bg-surface transition-colors hover:bg-surface-2 lg:grid-cols-[0.9fr_1.1fr]"
              >
                <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[340px]">
                  <Image
                    src={p.hero}
                    alt={p.heroAlt}
                    fill
                    sizes="(min-width: 1024px) 480px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-7 sm:p-10">
                  <Eyebrow className="mb-3">{p.location}</Eyebrow>
                  <h2 className="display-md font-semibold uppercase text-text group-hover:text-gold">
                    {p.title}
                  </h2>
                  <p className="measure mt-4 text-base leading-relaxed text-muted">{p.summary}</p>
                  <dl className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {p.snapshot.slice(1, 5).map((s) => (
                      <div key={s.label}>
                        <dt className="eyebrow text-muted">{s.label}</dt>
                        <dd className="mt-1 text-sm text-text">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <span className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-gold">
                    See the full project
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-1">
                      <path d="M9 1l4 4-4 4M13 5H1" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Have a driveway with similar problems?"
        title="Send photos and I'll tell you what I see"
        body="If your driveway is rough, rutted, washing out, holding water, or losing gravel after every storm, the first step is figuring out why it's failing."
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />
    </>
  );
}
