import { Container, Section } from "@/components/ui";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses, and protects information submitted through this website.`,
  path: "/privacy-policy",
});

/**
 * Written to describe what this site actually does — a consultation form, and
 * nothing else. It is deliberately not a copy of a generic template.
 *
 * TODO(client): the previous site had its own privacy policy. If that text was
 * reviewed by counsel, it should replace this. This version is accurate to the
 * rebuild's behaviour but has not been legally reviewed.
 */
export default function PrivacyPage() {
  return (
    <Section>
      <Container width="narrow">
        <h1 className="display-lg font-bold uppercase text-text">Privacy Policy</h1>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">What I collect</h2>
            <p>
              When you submit a driveway consultation request, I collect the name, email address,
              phone number, and property location you provide, along with the issues you select,
              any notes you write, and any photos you attach. That is the only information this
              site asks you for.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">How I use it</h2>
            <p>
              I use it to review your driveway, respond to your request, and — if we move forward —
              plan and carry out the work. I do not sell it, rent it, or share it with anyone
              outside the work of quoting and completing your project.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Photos you send</h2>
            <p>
              Photos you submit are used to evaluate your driveway. I may use before-and-after
              photos of completed work to show the results on this website or on social media. If
              you would rather I did not, tell me and I won&apos;t — just say so when you send them
              or any time afterwards.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Analytics</h2>
            <p>
              This site uses privacy-friendly traffic analytics to understand which pages people
              visit. It does not build advertising profiles and does not track you across other
              websites.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Getting it removed</h2>
            <p>
              Ask and I will delete the information you sent. Email{" "}
              <a href={`mailto:${site.email}`} className="text-gold hover:text-white">
                {site.email}
              </a>{" "}
              or call or text{" "}
              <a href={site.phoneHref} className="text-gold hover:text-white">
                {site.phone}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase text-text">Questions</h2>
            <p>
              {site.name} is owned and operated by {site.owner} in {site.baseCity},{" "}
              {site.baseRegion}. Any question about this policy goes straight to him at the number
              or address above.
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
