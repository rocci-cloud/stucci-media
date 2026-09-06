import Image from "next/image";
import Link from "next/link";
import { Button, Container, Eyebrow, Section, SectionHead, FaqList } from "@/components/ui";
import {
  AreaGrid, CtaBand, MeetDoug, Pillars, ProcessSteps, ServiceGrid, ThesisBlock,
} from "@/components/blocks";
import { CrossSection } from "@/components/CrossSection";
import { site } from "@/content/site";
import { featuredAreaSlugs } from "@/content/areas";
import { generalFaqs } from "@/content/faqs";
import { projects } from "@/content/projects";
import { JsonLd, faqSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Gravel Driveway Grading & Repair in Durango, Colorado",
  description:
    "I help property owners in Durango, Bayfield, and surrounding La Plata County communities figure out why a gravel driveway is failing before I recommend what it needs.",
  path: "/",
});

export default function HomePage() {
  const bayfield = projects[0];

  return (
    <>
      {/* ── Hero. The photograph is the largest thing on the page, not the
          headline — the old build inverted that and buried Doug in a
          letterboxed band between two identical yellow buttons. ── */}
      <section className="relative isolate overflow-hidden border-b border-rule">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/doug/durango-driveway-grading-truck-trailer-skid-steer.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ground/85 via-ground/70 to-ground" />
          <div className="absolute inset-0 bg-pines opacity-70" />
        </div>

        <Container className="py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <Eyebrow className="mb-5">Gravel driveways are my specialty</Eyebrow>
            <h1 className="display-xl font-bold uppercase text-text">
              Gravel Driveway Grading &amp; Repair in Durango, Colorado
            </h1>
            <p className="measure mt-7 text-lg leading-relaxed text-muted">
              I help property owners in Durango, Bayfield, and surrounding La Plata County
              communities figure out why a gravel driveway is failing before I recommend what it
              needs.
            </p>
            <p className="measure mt-4 text-lg leading-relaxed text-muted">
              Sometimes grading is enough. Other driveways need drainage correction, material work,
              or a combination. I start with the conditions—not a predetermined fix.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="/request-consultation">Request a Driveway Consultation</Button>
              <Button href={site.phoneHref} variant="outline" external>
                Call or Text {site.phone}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section tone="surface" className="!py-0">
        <Container className="py-px">
          <div className="-mt-px">
            <Pillars />
          </div>
        </Container>
      </Section>

      {/* ── The thesis, with the drawing that proves it. ── */}
      <Section>
        <Container>
          <SectionHead
            eyebrow="Does this sound familiar?"
            title="The same driveway problems keep coming back"
          />
          <div className="mt-12 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <ThesisBlock />
            <CrossSection />
          </div>
          <div className="mt-12">
            <Button href="/how-i-evaluate-driveways" variant="outline">
              See how I evaluate gravel driveways
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="Gravel driveway & rural access services"
            title="Start with what the driveway needs"
            lede="Once the cause is clear, the goal is to do the work the driveway actually needs—no more and no less."
          />
          <div className="mt-12">
            <ServiceGrid />
          </div>
        </Container>
      </Section>

      {/* ── Featured project ── */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[4/3] border border-rule">
              <Image
                src={bayfield.hero}
                alt={bayfield.heroAlt}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <Eyebrow className="mb-3">{bayfield.eyebrow}</Eyebrow>
              <h2 className="display-lg font-semibold uppercase text-text">
                See the Work Before You Decide
              </h2>
              <div className="measure mt-5 flex flex-col gap-4 text-base leading-relaxed text-muted">
                <p>
                  This steep private-access road had years of erosion, surface breakdown, and
                  drainage problems. Water was traveling down the driving surface instead of
                  shedding off where it should.
                </p>
                <p>
                  I reshaped key sections, improved drainage, reworked failed material, added road
                  base where needed, and finished the repaired surface with grading and compaction.
                </p>
              </div>
              <blockquote className="mt-8 border-l-2 border-gold pl-5">
                <p className="text-[15px] leading-relaxed text-text">
                  &ldquo;{bayfield.testimonial.quote.slice(0, 210)}…&rdquo;
                </p>
                <footer className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-muted">
                  {bayfield.testimonial.attribution} · {bayfield.testimonial.location}
                </footer>
              </blockquote>
              <div className="mt-8">
                <Button href={`/projects/${bayfield.slug}`} variant="outline">
                  See the full project
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="How the project moves forward"
            title="A clear path from driveway problem to better performance"
          />
          <div className="mt-12">
            <ProcessSteps />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <MeetDoug />
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="Service area business based in Durango, CO"
            title="Serving Durango-area rural & mountain properties"
            lede={`${site.name} works with homeowners and property owners throughout ${site.county}, including mountain driveways, rural properties, long gravel entrances, and private access roads.`}
          />
          <div className="mt-12">
            <AreaGrid slugs={featuredAreaSlugs} />
          </div>
          <p className="mt-6 text-sm text-muted">
            Also serving Vallecito and the wider county —{" "}
            <Link href="/service-areas" className="text-gold hover:text-white">
              see all service areas
            </Link>
            .
          </p>
        </Container>
      </Section>

      <Section>
        <Container width="narrow">
          <SectionHead eyebrow="FAQ" title="Frequently asked questions" align="center" />
          <div className="mt-10">
            <FaqList faqs={generalFaqs} />
          </div>
        </Container>
      </Section>

      <CtaBand />
      <JsonLd data={faqSchema(generalFaqs)} />
    </>
  );
}
