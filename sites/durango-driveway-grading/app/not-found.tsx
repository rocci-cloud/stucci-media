import { Button, Container, Section } from "@/components/ui";
import { site } from "@/content/site";

export default function NotFound() {
  return (
    <Section className="bg-pines">
      <Container width="narrow">
        <p className="font-mono text-sm uppercase tracking-[0.14em] text-gold">404</p>
        <h1 className="display-lg mt-4 font-bold uppercase text-text">
          That road doesn&apos;t go through
        </h1>
        <p className="measure mt-6 text-base leading-relaxed text-muted">
          The page you were looking for isn&apos;t here. It may have moved during the site rebuild.
          Try the services or service areas below — or just call Doug, which is faster.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button href="/">Back to home</Button>
          <Button href={site.phoneHref} variant="outline" external>
            Call or Text {site.phone}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
