import Image from "next/image";
import { Button, Container, Eyebrow, FaqList, Section, SectionHead } from "@/components/ui";
import { CtaBand } from "@/components/blocks";
import { CrossSection } from "@/components/CrossSection";
import {
  categories, categoriesNote, checklist, evaluationIntro, evaluationOutcomes,
  startOptions, waterQuestions,
} from "@/content/evaluation";
import { processStepsDetailed, scopeBoundaries, site } from "@/content/site";
import { evaluationFaqs } from "@/content/faqs";
import { JsonLd, breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How I Evaluate Gravel Driveways",
  description:
    "See how Durango Driveway Grading evaluates gravel driveways with a drainage-first approach. Water flow, crown, ruts, potholes, washouts, culverts, and material condition — before recommending work.",
  path: "/how-i-evaluate-driveways",
});

export default function EvaluatePage() {
  return (
    <>
      <Section className="border-b border-rule bg-pines">
        <Container>
          <Eyebrow className="mb-4">Drainage-first driveway evaluations</Eyebrow>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">
            How I Evaluate Gravel Driveways
          </h1>
          <div className="measure mt-7 flex flex-col gap-4 text-lg leading-relaxed text-muted">
            {evaluationIntro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-9">
            <Button href="/request-consultation">Request a Driveway Consultation</Button>
          </div>
        </Container>
      </Section>

      {/* The three questions the whole method hangs on. */}
      <Section>
        <Container>
          <SectionHead
            eyebrow="The DDG approach"
            title="Where's the water coming from, where's it going, and what's it doing?"
            lede="A gravel driveway is more than a driving surface. It is part road, part drainage system, and part access route. When water has a clean path off the driveway, the surface has a much better chance of holding up."
          />
          <div className="mt-12 grid gap-px border border-rule bg-rule lg:grid-cols-3">
            {waterQuestions.map((q) => (
              <div key={q.n} className="flex flex-col bg-surface">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={q.image}
                    alt={q.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 380px, 100vw"
                    className="object-cover opacity-80"
                  />
                </div>
                <div className="p-6 sm:p-7">
                  <span className="font-mono text-sm text-gold">{q.n}</span>
                  <h3 className="mt-2 text-lg font-semibold uppercase tracking-[0.02em] text-text">{q.q}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{q.a}</p>
                </div>
              </div>
            ))}
          </div>
          <CrossSection className="mt-14" />
        </Container>
      </Section>

      {/* The seven-point checklist. */}
      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="On site"
            title="What I look at during a driveway evaluation"
            lede="Every driveway is different, but these are the main things I pay attention to before recommending a game plan."
          />
          <ol className="mt-12 divide-y divide-rule border-y border-rule">
            {checklist.map((c) => (
              <li key={c.n} className="grid gap-3 py-7 sm:grid-cols-[3rem_1fr] sm:gap-8">
                <span className="font-mono text-2xl text-gold/70">
                  {String(c.n).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold uppercase leading-snug tracking-[0.02em] text-text">
                    {c.title}
                  </h3>
                  <p className="measure mt-3 text-[15px] leading-relaxed text-muted">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* The three outcome categories. */}
      <Section>
        <Container>
          <SectionHead
            eyebrow="The outcome"
            title="What the evaluation helps determine"
            lede="After I evaluate the driveway, I'll usually place it into one of three practical categories."
          />
          <div className="mt-12 grid gap-px border border-rule bg-rule lg:grid-cols-3">
            {categories.map((c, i) => (
              <div key={c.key} className="bg-surface p-7">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
                  Category {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold uppercase leading-snug tracking-[0.02em] text-text">
                  {c.name}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-text">{c.when}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  <span className="text-muted/70">Common signs: </span>
                  {c.signs}
                </p>
              </div>
            ))}
          </div>
          <p className="measure mt-8 text-base leading-relaxed text-muted">{categoriesNote}</p>
        </Container>
      </Section>

      {/* Two ways to start. */}
      <Section tone="surface">
        <Container>
          <SectionHead
            eyebrow="There are two good ways to start"
            title="Photo/video review or on-site evaluation?"
            lede="You don't need to know what's wrong before contacting me. That's the point of the evaluation."
          />
          <div className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2">
            {startOptions.map((o) => (
              <div key={o.key} className="bg-surface p-7 sm:p-8">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
                  Option {o.key}
                </span>
                <h3 className="mt-3 text-xl font-semibold uppercase tracking-[0.02em] text-text">
                  {o.title}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{o.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionHead
                eyebrow="What you'll get"
                title="A clear, honest recommendation"
                lede="The goal is not to sell you the biggest project possible. The goal is to give you a clear, honest recommendation based on what the driveway actually needs."
              />
              <ul className="mt-8 flex flex-col gap-3">
                {evaluationOutcomes.map((o) => (
                  <li key={o} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-gold" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-rule bg-surface p-7 sm:p-8">
              <h3 className="eyebrow text-gold">The full process, step by step</h3>
              <ol className="mt-6 flex flex-col gap-6">
                {processStepsDetailed.map((s) => (
                  <li key={s.n} className="grid gap-2 sm:grid-cols-[2.5rem_1fr] sm:gap-5">
                    <span className="font-mono text-sm text-gold">{s.n}</span>
                    <div>
                      <h4 className="text-[15px] font-semibold uppercase tracking-[0.02em] text-text">
                        {s.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container width="narrow">
          <div className="border-l-2 border-gold pl-6 sm:pl-8">
            <p className="display-md font-semibold uppercase text-text">
              Fix the reason your driveway is failing — not just make it look better for a week.
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-muted">
              <span className="text-text">I focus on: </span>
              {scopeBoundaries.does}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              <span className="text-text">I don&apos;t take on: </span>
              {scopeBoundaries.doesNot}
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container width="narrow">
          <SectionHead eyebrow="FAQ" title="Common questions about driveway evaluations" align="center" />
          <div className="mt-10">
            <FaqList faqs={evaluationFaqs} />
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Ready to start?"
        title="Let's find out where the water should go"
        body={`If your driveway keeps washing out, rutting, or holding water, the first step is understanding how water is moving across the property. Send photos and I'll review it personally — or call Doug at ${site.phone}.`}
      />
      <JsonLd
        data={[
          faqSchema(evaluationFaqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "How I Evaluate Driveways", path: "/how-i-evaluate-driveways" },
          ]),
        ]}
      />
    </>
  );
}
