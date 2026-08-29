import SubscribeForm from "./SubscribeForm";
import Badge from "./ui/Badge";

const BENEFITS = [
  "Breaking news before the mainstream catches up",
  "Deep investigations mainstream outlets won't touch",
  "Free, straight to your inbox — unsubscribe anytime",
];

export default function SubscribeStrip() {
  return (
    <div
      id="subscribe"
      className="relative border-y border-[var(--color-hairline)] px-5 py-9 sm:py-16"
      style={{
        background:
          "linear-gradient(135deg, rgba(10,22,40,0.1), rgba(200,16,46,0.05) 55%, rgba(255,255,255,1) 100%)",
      }}
    >
      <div className="mx-auto max-w-[1080px] grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-9 lg:gap-14 items-center">
        <div className="text-center lg:text-left">
          <Badge variant="red" className="mb-3.5">
            Free Newsletter
          </Badge>
          <h2 className="font-headline text-[29px] sm:text-[38px] lg:text-[43px] font-bold uppercase leading-[0.98] tracking-[-0.02em] mb-3.5">
            The Stories Mainstream Media Won&apos;t Run
          </h2>
          <p className="font-sans text-[15px] sm:text-[16.5px] text-[var(--color-gray)] leading-[1.55] mb-5 max-w-[48ch] mx-auto lg:mx-0">
            Independent reporting, straight to your inbox — no corporate spin, no gatekeepers.
          </p>
          <ul className="flex flex-col gap-2.5 items-start mx-auto lg:mx-0 w-fit">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 font-sans text-[14px] text-[var(--color-text)] text-left max-w-[40ch]">
                <span className="mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-red)] text-white text-[10px] font-bold leading-none">
                  ✓
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--color-surface)] rounded-card shadow-card-hover border border-[var(--color-hairline)] p-6 sm:p-8">
          <SubscribeForm stacked source="homepage-strip" />
          <p className="font-sans text-[11.5px] text-[var(--color-gray-light)] text-center mt-3.5">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
