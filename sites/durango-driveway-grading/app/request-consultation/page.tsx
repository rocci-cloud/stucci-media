import { Container, Eyebrow, FaqList, Section, SectionHead } from "@/components/ui";
import { ConsultationForm } from "@/components/ConsultationForm";
import { ProcessSteps } from "@/components/blocks";
import { site } from "@/content/site";
import { evaluationFaqs } from "@/content/faqs";
import { JsonLd, breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Request a Driveway Consultation",
  description:
    "Tell me what's happening with your driveway. Photos help me understand the problem faster. Every request is reviewed personally, with a reply within one business day.",
  path: "/request-consultation",
});

export default function RequestConsultationPage() {
  return (
    <>
      <Section className="border-b border-rule bg-pines !pb-14">
        <Container>
          <Eyebrow className="mb-4">Start here</Eyebrow>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">
            Request a Driveway Consultation
          </h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">
            Tell me what&apos;s happening with your driveway. Photos or short videos help me
            understand the problem faster.
          </p>
          <p className="measure mt-4 text-base leading-relaxed text-muted">
            You don&apos;t need to know what&apos;s wrong before contacting me — that&apos;s the
            point of the evaluation. No pressure, and no generic &ldquo;we&apos;ll just grade
            it&rdquo; advice.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="border border-rule bg-surface p-6 sm:p-9">
              <ConsultationForm />
            </div>

            <aside className="flex flex-col gap-8">
              <div className="border border-rule bg-surface p-6 sm:p-7">
                <h2 className="eyebrow text-gold">Prefer to call?</h2>
                <a
                  href={site.phoneHref}
                  className="mt-3 block text-2xl font-bold text-text hover:text-gold sm:text-3xl"
                >
                  {site.phone}
                </a>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Call or text Doug directly. Texting photos and video from the driveway is often
                  the fastest way to get a useful answer.
                </p>
              </div>

              <div className="border border-rule bg-surface p-6 sm:p-7">
                <h2 className="eyebrow text-gold">What helps most</h2>
                <ul className="mt-4 flex flex-col gap-2.5 text-[15px] leading-relaxed text-muted">
                  {[
                    "Photos showing where water travels",
                    "The overall slope of the driveway",
                    "Ruts, potholes, and low spots",
                    "Culverts, ditches, and where runoff exits",
                    "A short video walking the length of it",
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-gold" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-rule bg-surface p-6 sm:p-7">
                <h2 className="eyebrow text-muted">Deposit</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{site.depositTerms}</p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="What happens next"
            title="A clear path from driveway problem to better performance"
          />
          <div className="mt-12">
            <ProcessSteps />
          </div>
        </Container>
      </Section>

      <Section>
        <Container width="narrow">
          <SectionHead eyebrow="FAQ" title="Common questions" align="center" />
          <div className="mt-10">
            <FaqList faqs={evaluationFaqs} />
          </div>
        </Container>
      </Section>

      <JsonLd
        data={[
          faqSchema(evaluationFaqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Request a Consultation", path: "/request-consultation" },
          ]),
        ]}
      />
    </>
  );
}
