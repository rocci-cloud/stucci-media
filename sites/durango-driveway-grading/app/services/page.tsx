import { Container, Section, SectionHead, FaqList, Button } from "@/components/ui";
import { CtaBand, ServiceGrid, WarningSigns, ThesisBlock } from "@/components/blocks";
import { scopeBoundaries } from "@/content/site";
import { generalFaqs } from "@/content/faqs";
import { JsonLd, breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Gravel Driveway Services in Durango, CO",
  description:
    "Drainage-first gravel driveway grading, drainage correction, rut and washout repair, resurfacing, culvert flow correction, private road maintenance, and seasonal snow removal in Durango and La Plata County.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <Section className="border-b border-rule bg-pines">
        <Container>
          <p className="eyebrow mb-4 text-gold">Gravel driveway services in Durango</p>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">
            Drainage-First Driveway Grading, Repair &amp; Rural Access Support
          </h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">
            Ruts, potholes, washboarding, washouts, soft spots, and water running down tire tracks
            are usually signs of the same bigger problem: the driveway is no longer shedding water
            the way it should.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/request-consultation">Request a Driveway Consultation</Button>
            <Button href="/how-i-evaluate-driveways" variant="outline">
              See how I evaluate driveways
            </Button>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHead eyebrow="What I do" title="Driveway services for rural and mountain properties" />
          <div className="mt-12">
            <ServiceGrid />
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <ThesisBlock />
            <WarningSigns />
          </div>
        </Container>
      </Section>

      {/* Stating the boundary plainly builds more trust than implying you do
          everything. Carried verbatim from the source site. */}
      <Section>
        <Container width="narrow">
          <SectionHead eyebrow="Scope" title="What I take on — and what I don't" align="center" />
          <div className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2">
            <div className="bg-surface p-7">
              <h3 className="eyebrow text-gold">I focus on</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{scopeBoundaries.does}</p>
            </div>
            <div className="bg-surface p-7">
              <h3 className="eyebrow text-muted">I don&apos;t take on</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{scopeBoundaries.doesNot}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container width="narrow">
          <SectionHead eyebrow="FAQ" title="Frequently asked questions" align="center" />
          <div className="mt-10">
            <FaqList faqs={generalFaqs} />
          </div>
        </Container>
      </Section>

      <CtaBand />
      <JsonLd
        data={[
          faqSchema(generalFaqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ]}
      />
    </>
  );
}
