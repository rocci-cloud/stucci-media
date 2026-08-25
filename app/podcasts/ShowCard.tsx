import FeedImage from "./FeedImage";
import Link from "next/link";

/**
 * A show tile. Square cover art is the universal podcast language — every
 * major client (Apple, Spotify, Overcast) renders shows this way, and
 * matching it means a listener recognises what they are looking at before
 * reading a word.
 */
export default function ShowCard({
  show,
  size = "grid",
}: {
  show: {
    slug: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
    episodeCount: number;
  };
  size?: "grid" | "shelf";
}) {
  return (
    <Link
      href={`/podcasts/${show.slug}`}
      className={`group block ${size === "shelf" ? "w-[168px] shrink-0 snap-start sm:w-[196px]" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-card shadow-card ring-1 ring-black/5 transition group-hover:shadow-card-hover">
        {show.coverImageUrl ? (
          <FeedImage
            src={show.coverImageUrl}
            alt={show.title}
            fill
            sizes={size === "shelf" ? "196px" : "(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw"}
            className="img-cinematic object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="img-placeholder flex h-full w-full items-center justify-center">
            <span className="px-3 text-center font-headline text-[15px] font-bold uppercase leading-tight tracking-[-0.01em] text-[var(--color-navy)]/45">
              {show.title}
            </span>
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/18 to-transparent"
        />
      </div>

      <h3 className="mt-2.5 font-headline text-[15px] font-bold uppercase leading-[1.15] tracking-[-0.01em] transition-colors group-hover:text-[var(--color-red)] sm:text-[16px]">
        {show.title}
      </h3>
      <p className="mt-1 font-sans text-[11.5px] uppercase tracking-[0.05em] text-[var(--color-gray-light)]">
        {show.author ? `${show.author} · ` : ""}
        {show.episodeCount} {show.episodeCount === 1 ? "episode" : "episodes"}
      </p>
    </Link>
  );
}
