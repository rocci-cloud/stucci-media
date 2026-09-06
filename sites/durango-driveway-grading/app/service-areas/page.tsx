import { Button, Container, Section, SectionHead } from "@/components/ui";
import { AreaGrid, CtaBand } from "@/components/blocks";
import { site } from "@/content/site";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Service Areas in La Plata County, CO",
  description:
    "Gravel driveway grading, drainage correction, and private road maintenance in Durango, Bayfield, Hesperus, Ignacio, Durango Hills, Forest Lakes, Vallecito, and across La Plata County, Colorado.",
  path: "/service-areas",
});

export default function ServiceAreasPage() {
  return (
    <>
      <Section className="border-b border-rule bg-pines">
        <Container>
          <p className="eyebrow mb-4 text-gold">Service area business based in Durango, CO</p>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">
            Serving Durango-Area Rural &amp; Mountain Properties
          </h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">
            {site.name} works with homeowners and property owners throughout {site.county},
            including mountain driveways, rural properties, long gravel entrances, and private
            access roads.
          </p>
          <div className="mt-9">
            <Button href="/request-consultation">Request a Driveway Consultation</Button>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHead eyebrow="Where I work" title="Service areas" />
          <div className="mt-12">
            <AreaGrid />
          </div>
          <p className="mt-8 text-sm leading-relaxed text-muted">
            Not sure if you are in range? Send the property location and a few photos. I&apos;ll let
            you know if your driveway is within my service area.
          </p>
        </Container>
      </Section>

      <CtaBand />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Service Areas", path: "/service-areas" },
        ])}
      />
    </>
  );
}
