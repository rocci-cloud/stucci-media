import Image from "next/image";
import { notFound } from "next/navigation";
import { Button, Container, Eyebrow, FaqList, Section, SectionHead } from "@/components/ui";
import { CtaBand, ServiceGrid, WarningSigns, MeetDoug, ProcessSteps } from "@/components/blocks";
import { services, servicesBySlug } from "@/content/services";
import { faqsForService } from "@/content/faqs";
import { site } from "@/content/site";
import { JsonLd, breadcrumbSchema, faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = servicesBySlug.get(slug);
  if (!s) return {};
  return pageMetadata({
    title: s.seoTitle,
    description: s.seoDescription,
    path: `/services/${s.slug}`,
    image: s.image,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = servicesBySlug.get(slug);
  if (!service) notFound();

  const faqs = faqsForService[service.slug] ?? [];

  return (
    <>
      <Section className="border-b border-rule bg-pines !pb-14">
        <Container>
          <Eyebrow className="mb-4">{service.eyebrow}</Eyebrow>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">{service.h1}</h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">{service.lede}</p>
          <ul className="mt-8 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:max-w-3xl">
            {service.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-[15px] text-muted">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-gold" />
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/request-consultation">Request a Driveway Consultation</Button>
            <Button href={site.phoneHref} variant="outline" external>
              Call or Text {site.phone}
            </Button>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="flex flex-col gap-5">
              {service.body.map((p, i) => (
                <p key={i} className="measure text-base leading-relaxed text-muted">{p}</p>
              ))}
            </div>
            <div className="relative aspect-[4/3] border border-rule">
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="What's included"
            title={`${service.name} — what the work covers`}
            lede={`Helps with: ${service.helpsWith}`}
          />
          <div className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {service.includes.map((inc) => (
              <div key={inc.title} className="bg-surface p-6 sm:p-7">
                <h3 className="text-base font-semibold uppercase leading-snug tracking-[0.02em] text-gold">
                  {inc.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{inc.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {service.slug !== "snow-removal" ? (
        <Section>
          <Container>
            <WarningSigns />
            <div className="mt-10">
              <Button href="/how-i-evaluate-driveways" variant="outline">
                See how I evaluate driveways
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="surface">
        <Container>
          <SectionHead eyebrow="Is this a fit?" title={`${service.name} is often a good fit for`} />
          <ul className="mt-10 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.fitFor.map((f) => (
              <li key={f} className="flex gap-3 border-l border-rule pl-4 text-[15px] text-muted">
                {f}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
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

      <Section tone="surface">
        <Container>
          <MeetDoug />
        </Container>
      </Section>

      {faqs.length > 0 ? (
        <Section>
          <Container width="narrow">
            <SectionHead eyebrow="FAQ" title="Frequently asked questions" align="center" />
            <div className="mt-10">
              <FaqList faqs={faqs} />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="surface">
        <Container>
          <SectionHead eyebrow="Other services" title="Not sure which service you need?" />
          <div className="mt-12">
            <ServiceGrid exclude={service.slug} />
          </div>
        </Container>
      </Section>

      <CtaBand />
      <JsonLd
        data={[
          serviceSchema(service),
          faqs.length > 0 ? faqSchema(faqs) : null,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
        ].filter(Boolean) as object[]}
      />
    </>
  );
}
