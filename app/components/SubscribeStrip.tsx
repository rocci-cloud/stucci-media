import SubscribeForm from "./SubscribeForm";

export default function SubscribeStrip() {
  return (
    <div id="subscribe" className="bg-[var(--color-bg-off)] border-y border-[var(--color-hairline)] px-5 py-12">
      <div className="max-w-[560px] mx-auto text-center">
        <h3 className="font-headline text-2xl font-bold uppercase mb-2.5">
          Get the stories mainstream media won&apos;t run
        </h3>
        <p className="font-sans text-[15px] text-[var(--color-gray)] mb-5">
          Independent reporting, straight to your inbox. No spam, no noise.
        </p>
        <SubscribeForm />
      </div>
    </div>
  );
}
