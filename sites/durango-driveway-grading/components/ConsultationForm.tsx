"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { site } from "@/content/site";
import { submitConsultation, type ConsultationState } from "@/app/request-consultation/actions";
import { ISSUE_OPTIONS, REFERRAL_OPTIONS } from "@/content/form-options";

const initial: ConsultationState = { status: "idle" };

const field =
  "min-h-12 w-full border border-rule-strong bg-surface px-4 py-3 text-[15px] text-text placeholder:text-muted/70 transition-colors focus:border-gold focus:outline-none";
const label = "eyebrow mb-2 block text-muted";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-13 w-full items-center justify-center bg-gold px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-white disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send My Request"}
    </button>
  );
}

export function ConsultationForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(submitConsultation, initial);

  if (state.status === "success") {
    return (
      <div className="border border-gold bg-surface p-8 text-center">
        <p className="display-md font-semibold uppercase text-gold">Request received</p>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">{state.message}</p>
        <p className="mt-6 text-sm text-muted">
          Need to reach me sooner?{" "}
          <a href={site.phoneHref} className="font-semibold text-gold hover:text-white">
            Call or text {site.phone}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {/* Honeypot — visually and programmatically hidden from real users. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={compact ? "flex flex-col gap-5" : "grid gap-5 sm:grid-cols-2"}>
        <div>
          <label htmlFor="name" className={label}>Name *</label>
          <input id="name" name="name" required autoComplete="name" className={field} />
          {state.errors?.name ? <FieldError>{state.errors.name}</FieldError> : null}
        </div>
        <div>
          <label htmlFor="phone" className={label}>Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className={field} />
          {state.errors?.email ? <FieldError>{state.errors.email}</FieldError> : null}
        </div>
        <div>
          <label htmlFor="address" className={label}>Property location *</label>
          <input
            id="address"
            name="address"
            required
            placeholder="Road name or nearest cross street"
            className={field}
          />
          {state.errors?.address ? <FieldError>{state.errors.address}</FieldError> : null}
        </div>
      </div>

      <fieldset>
        <legend className={label}>What&apos;s the main issue? (select all that apply) *</legend>
        <div className="grid gap-x-5 gap-y-1 sm:grid-cols-2">
          {ISSUE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-text"
            >
              <input
                type="checkbox"
                name="issues"
                value={opt}
                className="size-4 shrink-0 accent-[#ffd700]"
              />
              {opt}
            </label>
          ))}
        </div>
        {state.errors?.issues ? <FieldError>{state.errors.issues}</FieldError> : null}
      </fieldset>

      <div>
        <label htmlFor="photos" className={label}>Photos (optional)</label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="w-full border border-rule-strong bg-surface px-4 py-3 text-sm text-muted file:mr-4 file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:font-medium file:text-text hover:file:bg-rule"
        />
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Up to 5 images, 4MB each. Photos showing water flow, ruts, low spots, and the overall slope
          help most.{" "}
          <a href={site.phoneHref} className="text-gold hover:text-white">
            Got video? Text it to {site.phone}
          </a>{" "}
          — it&apos;s faster than uploading from a driveway.
        </p>
        {state.errors?.photos ? <FieldError>{state.errors.photos}</FieldError> : null}
      </div>

      <div>
        <label htmlFor="details" className={label}>Anything else? (optional)</label>
        <textarea id="details" name="details" rows={4} maxLength={4000} className={`${field} min-h-32 resize-y`} />
      </div>

      <div>
        <label htmlFor="referral" className={label}>How did you hear about DDG? (optional)</label>
        <select id="referral" name="referral" defaultValue="" className={field}>
          <option value="">Select one</option>
          {REFERRAL_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {state.status === "error" && state.message ? (
        <p role="alert" className="border-l-2 border-[#ee7566] bg-surface px-4 py-3 text-sm text-text">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-center text-xs leading-relaxed text-muted">
        {site.responsePromise}
      </p>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs text-[#ee7566]">{children}</p>;
}
