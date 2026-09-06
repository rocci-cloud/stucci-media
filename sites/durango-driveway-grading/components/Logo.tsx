import Image from "next/image";

const DARK_LOCKUP = "/images/brand/ddg-logo-dark-bg.png";
const LIGHT_LOCKUP = "/brand/logo-official-full-color.jpg";

/**
 * The brand lockup.
 *
 * The official artwork sets "DURANGO DRIVEWAY GRADING" in navy (#1B355C). On
 * this site's #0F0F0F ground that measures 1.56:1 — effectively invisible — so
 * dark surfaces use the brand's own reversed variant (DDG-CO-ForDarkBG). The
 * full-colour lockup stays available for light surfaces via `variant="light"`.
 *
 * `available` is resolved by the caller via lib/brand.ts, because that check
 * needs the filesystem and this component renders inside the client-side
 * header. When it is false the type-set wordmark stands in.
 *
 * `priority` is off deliberately: the header lockup is above the fold but
 * small, and prioritising it makes it compete with the hero photograph for the
 * same early bandwidth. The hero is the LCP element; this is not.
 */
export function Logo({
  variant = "dark",
  available = true,
  className = "",
  width = 168,
  height = 118,
  fallbackClassName = "",
}: {
  variant?: "dark" | "light";
  available?: boolean;
  className?: string;
  width?: number;
  height?: number;
  fallbackClassName?: string;
}) {
  if (!available) return <Wordmark className={fallbackClassName} />;

  return (
    <Image
      src={variant === "dark" ? DARK_LOCKUP : LIGHT_LOCKUP}
      alt="Durango Driveway Grading"
      width={width}
      height={height}
      className={className}
      priority={false}
    />
  );
}

/** Type-set wordmark — the lockup's fallback. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className="text-[15px] font-bold uppercase tracking-[0.02em] text-text sm:text-base">
        Durango <span className="text-gold">Driveway</span> Grading
      </span>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
        Built for Colorado
      </span>
    </span>
  );
}
