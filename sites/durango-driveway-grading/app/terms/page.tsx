import { Container, Section } from "@/components/ui";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description: `Terms of use and disclaimer for the ${site.name} website.`,
  path: "/terms",
});

/**
 * TODO(client): the previous site had a "Terms of Use & Disclaimer" page. If
 * that text was legally reviewed, it should replace this. This version is
 * accurate to how the business actually operates but has not been reviewed.
 */
export default function TermsPage() {
  return (
    <Section>
      <Container width="narrow">
        <h1 className="display-lg font-bold uppercase text-text">Terms &amp; Conditions</h1>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">About this site</h2>
            <p>
              This website describes the gravel driveway grading, drainage correction, and rural
              access services offered by {site.name}, owned and operated by {site.owner} in{" "}
              {site.county}, Colorado.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">
              Information here is general
            </h2>
            <p>
              Everything written here about driveways, drainage, grading, and materials is general
              guidance based on experience in this region. It is not a site-specific
              recommendation, and it is not engineering advice. Every driveway is different, which
              is exactly why the evaluation exists.
            </p>
            <p className="mt-3">
              I do not take on work that requires a licensed professional engineer. Where a project
              needs one, I will say so.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Quotes and scheduling</h2>
            <p>
              Submitting a consultation request does not create a contract and does not commit you
              to anything. Pricing discussed before a site visit is a ballpark range, not a quote.
              A firm quote follows an on-site evaluation.
            </p>
            <p className="mt-3">{site.depositTerms}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Photos and project results</h2>
            <p>
              Project photography on this site shows real completed work. Results vary with terrain,
              drainage, material, traffic, and weather — a driveway shown here is not a promise of
              an identical outcome on a different property.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Service area</h2>
            <p>
              Service is generally available in Durango, Bayfield, Hesperus, Ignacio, Durango
              Hills, Forest Lakes, Vallecito, and surrounding {site.county} areas, subject to
              scheduling, access, and site conditions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Contact</h2>
            <p>
              Questions about these terms:{" "}
              <a href={`mailto:${site.email}`} className="text-gold hover:text-white">
                {site.email}
              </a>{" "}
              or{" "}
              <a href={site.phoneHref} className="text-gold hover:text-white">
                {site.phone}
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
