import Image from "next/image";
import { notFound } from "next/navigation";
import { Button, Container, Eyebrow, FaqList, Section, SectionHead } from "@/components/ui";
import { CtaBand, ProcessSteps, ServiceGrid } from "@/components/blocks";
import { areas, areasBySlug } from "@/content/areas";
import { generalFaqs } from "@/content/faqs";
import { site } from "@/content/site";
import { JsonLd, breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return areas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = areasBySlug.get(slug);
  if (!a) return {};
  return pageMetadata({
    title: a.seoTitle,
    description: a.seoDescription,
    path: `/service-areas/${a.slug}`,
    image: a.image,
  });
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = areasBySlug.get(slug);
  if (!area) notFound();

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-rule">
        <div className="absolute inset-0 -z-10">
          <Image src={area.image} alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-ground/85 via-ground/75 to-ground" />
        </div>
        <Container className="py-20 sm:py-28">
          <Eyebrow className="mb-4">{area.name}, CO gravel driveway work</Eyebrow>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">{area.h1}</h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">{area.lede}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/request-consultation">Request a Driveway Consultation</Button>
            <Button href={site.phoneHref} variant="outline" external>
              Call or Text {site.phone}
            </Button>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHead
            eyebrow={`${area.name} driveway challenges`}
            title={`What makes driveways fail around ${area.shortName}`}
          />
          <div className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-3">
            {area.challenges.map((c) => (
              <div key={c.title} className="bg-surface p-6 sm:p-7">
                <h3 className="text-base font-semibold uppercase leading-snug tracking-[0.02em] text-gold">
                  {c.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="measure mt-10 text-base leading-relaxed text-muted">{area.closing}</p>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="Local service area"
            title={`Serving ${area.shortName} and nearby communities`}
          />
          <ul className="mt-10 flex flex-wrap gap-2">
            {area.localities.map((l) => (
              <li
                key={l}
                className="border border-rule-strong px-4 py-2 text-sm text-muted"
              >
                {l}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHead
            eyebrow={`Driveway services in ${area.shortName}`}
            title="Solutions for gravel driveways and rural access roads"
            lede={`Whether your ${area.shortName} driveway needs a targeted repair or a larger drainage-first rebuild, the goal is the same: improve the shape, move water off the surface, and restore dependable access.`}
          />
          <div className="mt-12">
            <ServiceGrid />
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
        <Container width="narrow">
          <SectionHead eyebrow="FAQ" title="Frequently asked questions" align="center" />
          <div className="mt-10">
            <FaqList faqs={generalFaqs} />
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow={`${area.name}, Colorado`}
        title={`Need help with a gravel driveway in ${area.shortName}?`}
        body="Send a few details and photos. I'll review the request personally and provide a practical next step."
      />
      <JsonLd
        data={[
          faqSchema(generalFaqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Service Areas", path: "/service-areas" },
            { name: area.name, path: `/service-areas/${area.slug}` },
          ]),
        ]}
      />
    </>
  );
}
