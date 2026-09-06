import Image from "next/image";
import { notFound } from "next/navigation";
import { Button, Container, Eyebrow, Section, SectionHead } from "@/components/ui";
import { CtaBand } from "@/components/blocks";
import { projects, projectsBySlug, bayfieldComparison } from "@/content/projects";
import { site } from "@/content/site";
import { JsonLd, breadcrumbSchema, canonical, pageMetadata, SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectsBySlug.get(slug);
  if (!p) return {};
  return pageMetadata({
    title: p.title,
    description: p.summary,
    path: `/projects/${p.slug}`,
    image: p.hero,
  });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectsBySlug.get(slug);
  if (!project) notFound();

  const phases = [bayfieldComparison.before, bayfieldComparison.during, bayfieldComparison.after];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-rule">
        <div className="absolute inset-0 -z-10">
          <Image src={project.hero} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-ground/85 via-ground/70 to-ground" />
        </div>
        <Container className="py-20 sm:py-28">
          <Eyebrow className="mb-4">{project.eyebrow}</Eyebrow>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">{project.title}</h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">{project.summary}</p>
        </Container>
      </section>

      {/* Snapshot — the spec-sheet register that makes this read as a record
          rather than marketing. */}
      <Section className="!py-0">
        <Container>
          <dl className="grid gap-px border-x border-b border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {project.snapshot.map((s) => (
              <div key={s.label} className="bg-surface p-6">
                <dt className="eyebrow text-muted">{s.label}</dt>
                <dd className="mt-2 font-mono text-sm leading-relaxed text-text">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <div>
              <SectionHead eyebrow="The problem" title="Water was controlling the driveway" />
              <p className="measure mt-6 text-base leading-relaxed text-muted">{project.problem.intro}</p>
              <ul className="mt-7 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {project.problem.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-[15px] text-muted">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-[#ee7566]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-px border border-rule bg-rule">
              {project.gallery.filter((g) => g.phase === "before").slice(0, 2).map((g) => (
                <div key={g.src} className="relative aspect-[4/3] bg-surface">
                  <Image src={g.src} alt={g.alt} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="The diagnosis"
            title="It needed drainage correction, not just gravel"
          />
          <div className="measure mt-6 flex flex-col gap-4 text-base leading-relaxed text-muted">
            {project.diagnosis.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-start">
            <div className="grid gap-px border border-rule bg-rule">
              {project.gallery.filter((g) => g.phase === "during").slice(0, 2).map((g) => (
                <div key={g.src} className="relative aspect-[4/3] bg-surface">
                  <Image src={g.src} alt={g.alt} fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
            <div>
              <SectionHead eyebrow="The solution" title="Shape it, drain it, compact it" />
              <p className="measure mt-6 text-base leading-relaxed text-muted">{project.solution.intro}</p>
              <ul className="mt-7 flex flex-col gap-2.5">
                {project.solution.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-[15px] text-muted">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Before / During / After, in sequence. */}
      <Section tone="surface" id="before-after">
        <Container>
          <SectionHead
            eyebrow="Before · during · after"
            title="From washed-out access to a finished mountain driveway"
            align="center"
          />
          <div className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-3">
            {phases.map((p, i) => (
              <figure key={p.src} className="bg-surface">
                <div className="relative aspect-[4/3]">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                  <span className="absolute left-0 top-0 bg-gold px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                    {["Before", "During", "After"][i]}
                  </span>
                </div>
                <figcaption className="p-5 text-sm text-muted">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <div>
              <SectionHead eyebrow="The result" title="Better drainage, smoother access, stronger finish" />
              <p className="measure mt-6 text-base leading-relaxed text-muted">{project.result.intro}</p>
              <ul className="mt-7 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {project.result.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-[15px] text-muted">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-px border border-rule bg-rule">
              {project.gallery.filter((g) => g.phase === "after").slice(0, 2).map((g) => (
                <div key={g.src} className="relative aspect-[4/3] bg-surface">
                  <Image src={g.src} alt={g.alt} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container width="narrow">
          <blockquote className="border-l-2 border-gold pl-6 sm:pl-8">
            <p className="text-lg leading-relaxed text-text sm:text-xl">
              &ldquo;{project.testimonial.quote}&rdquo;
            </p>
            <footer className="mt-5 font-mono text-xs uppercase tracking-[0.12em] text-gold">
              {project.testimonial.attribution} · {project.testimonial.location}
            </footer>
          </blockquote>
          <div className="measure mt-12 flex flex-col gap-4 text-base leading-relaxed text-muted">
            {project.closing.map((c, i) => (
              <p key={i}>{c}</p>
            ))}
          </div>
          <div className="mt-10">
            <Button href="/how-i-evaluate-driveways" variant="outline">
              See how I evaluate driveways
            </Button>
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Have a driveway with similar problems?"
        title="Send photos and I'll tell you what I see"
        body={`If your driveway is rough, rutted, washing out, holding water, or losing gravel after every storm, the first step is figuring out why it's failing. Call or text Doug at ${site.phone}.`}
      />

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: project.title,
            description: project.summary,
            image: canonical(project.hero),
            author: { "@type": "Person", name: site.owner },
            publisher: { "@id": `${SITE_URL}/#business` },
            mainEntityOfPage: canonical(`/projects/${project.slug}`),
          },
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: project.title, path: `/projects/${project.slug}` },
          ]),
        ]}
      />
    </>
  );
}
