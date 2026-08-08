import Image from "next/image";
import Link from "next/link";
import { getActiveBanners, type Banner, type BannerPlacement } from "../lib/banners";

// Renders every active banner for one of the site's 3 fixed placement
// slots (see lib/banners.ts's BannerPlacement), in the admin-set display
// order. Renders nothing — not even a wrapper element — when there's no
// active banner for this slot, so an empty campaign never leaves a blank
// box or placeholder in the layout. "Multiple active" is handled by
// simply stacking each one in order, not a rotation widget — no
// client-side JS, no ad-server complexity, matching this feature's
// explicit "keep it simple" scope. The gap between them is deliberately
// generous (not a tight card list) so multiple ads read as separate
// placements encountered while reading, not a single stacked ad wall.
export default async function BannerSlot({
  placement,
  className = "",
}: {
  placement: BannerPlacement;
  className?: string;
}) {
  const banners = await getActiveBanners(placement);
  if (banners.length === 0) return null;

  return (
    <div className={`flex flex-col gap-10 sm:gap-14 ${className}`}>
      {banners.map((banner) => (
        <BannerCard key={banner.id} banner={banner} />
      ))}
    </div>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  // Internal destinations (e.g. linking to /subscribe or a category page)
  // navigate in-app via next/link; anything else is treated as external
  // and opens in a new tab so a reader doesn't lose their place mid-article.
  const isInternal = banner.destinationUrl.startsWith("/");
  const label = banner.name || "Sponsored";

  const image = (
    <div className="relative w-full aspect-[3/1] sm:aspect-[4/1]">
      <Image src={banner.imageUrl} alt={label} fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
    </div>
  );

  const wrapperClassName =
    "group block overflow-hidden rounded-card border border-[var(--color-hairline)] shadow-card transition hover:shadow-card-hover active:scale-[0.99]";

  return (
    <div>
      <span className="mb-2 block font-sans text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-gray-light)]">
        Advertisement
      </span>
      {isInternal ? (
        <Link href={banner.destinationUrl} className={wrapperClassName} aria-label={label}>
          {image}
        </Link>
      ) : (
        <a
          href={banner.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={wrapperClassName}
          aria-label={label}
        >
          {image}
        </a>
      )}
    </div>
  );
}
