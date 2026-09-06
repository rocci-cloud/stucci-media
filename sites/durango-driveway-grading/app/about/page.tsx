import Image from "next/image";
import { Button, Container, Eyebrow, Section, SectionHead } from "@/components/ui";
import { CtaBand, Pillars } from "@/components/blocks";
import { scopeBoundaries, site, thesis } from "@/content/site";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Durango Driveway Grading | Doug O'Dell",
  description:
    "Durango Driveway Grading is owned and operated by Doug O'Dell, a drainage-first gravel driveway specialist serving Durango, Bayfield, and La Plata County, Colorado.",
  path: "/about",
  image: "/images/doug/doug-odell-owner-operator.jpg",
});

export default function AboutPage() {
  return (
    <>
      <Section className="border-b border-rule bg-pines">
        <Container>
          <Eyebrow className="mb-4">About {site.name}</Eyebrow>
          <h1 className="display-xl max-w-4xl font-bold uppercase text-text">
            Built From Experience. Focused on Better Access.
          </h1>
          <p className="measure mt-7 text-lg leading-relaxed text-muted">
            {site.name} is run by {site.owner}, a hands-on owner-operator who brings together
            equipment experience, engineering background, and a drainage-first approach to gravel
            driveway grading in Durango, Bayfield, and {site.county}.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <SectionHead eyebrow="Who you're hiring" title="One Owner. One Operator. One Driveway at a Time." />
              <div className="measure mt-6 flex flex-col gap-4 text-base leading-relaxed text-muted">
                <p>When you hire {site.name}, you&apos;re hiring me — {site.owner}.</p>
                <p>
                  I specialize in gravel driveway grading, drainage correction, rut repair, washout
                  repair, and private road access work for rural and mountain properties around
                  Durango, Bayfield, and {site.county}.
                </p>
                <p>
                  My approach is simple: diagnose the problem before moving material. A driveway
                  that looks smooth for a week but still sends water down the tire tracks is not
                  fixed. I look at how the surface is shaped, where the water is going, where
                  material has failed, and what needs to happen so the driveway performs better
                  after the machine leaves.
                </p>
                <p className="text-text">
                  That means I&apos;m not just trying to make your driveway look freshly graded.
                  I&apos;m trying to make it work better.
                </p>
              </div>
              <p className="mt-8 font-mono text-sm text-gold">
                Built from dirt, diesel, and a dose of determination.
              </p>
            </div>
            <div className="relative aspect-[4/5] border border-rule">
              <Image
                src="/images/doug/driveway-doug-owner-operator.jpg"
                alt="Driveway Doug, owner-operator of Durango Driveway Grading, standing outdoors in Durango, Colorado, wearing a cowboy hat and work vest in front of pine trees"
                fill
                priority
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHead eyebrow="How I work" title="Why homeowners call DDG" />
          <div className="mt-12">
            <Pillars />
          </div>
        </Container>
      </Section>

      <Section>
        <Container width="narrow">
          <div className="border-l-2 border-gold pl-6 sm:pl-8">
            <p className="display-md font-semibold uppercase text-text">{thesis.ddgStandard}</p>
            <p className="mt-6 text-[15px] leading-relaxed text-muted">
              <span className="text-text">I focus on: </span>
              {scopeBoundaries.does}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              <span className="text-text">I don&apos;t take on: </span>
              {scopeBoundaries.doesNot}
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href="/services" variant="outline">View gravel driveway services</Button>
            <Button href="/how-i-evaluate-driveways" variant="outline">How I evaluate driveways</Button>
          </div>
        </Container>
      </Section>

      <CtaBand />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
    </>
  );
}
