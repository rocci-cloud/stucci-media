export default function SubscribeStrip() {
  return (
    <div id="subscribe" className="bg-[var(--color-bg-off)] border-y border-[var(--color-hairline)] px-5 py-12">
      <div className="max-w-[560px] mx-auto text-center">
        <h3 className="font-headline text-2xl font-black mb-2.5">
          Get the stories mainstream media won&apos;t run
        </h3>
        <p className="font-sans text-[15px] text-[var(--color-gray)] mb-5">
          Independent reporting, straight to your inbox. No spam, no noise.
        </p>
        {/* Phase 3 wires this to the subscriber database + CSV export in the admin panel */}
        <form className="font-sans flex flex-col sm:flex-row gap-2.5 max-w-[420px] mx-auto">
          <label htmlFor="email-input" className="sr-only">
            Email address
          </label>
          <input
            id="email-input"
            type="email"
            required
            placeholder="you@email.com"
            className="flex-1 px-3.5 py-3 border border-[#B9B9B9] rounded-sm text-sm bg-white text-[var(--color-text)]"
          />
          <button
            type="submit"
            className="bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[13px] font-bold uppercase tracking-wide px-5 py-3 rounded-sm"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}
