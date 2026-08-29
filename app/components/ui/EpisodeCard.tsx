import Link from "next/link";
import { Clock } from "lucide-react";
import FeedImage from "../../podcasts/FeedImage";
import type { EpisodeWithShow } from "../../lib/podcasts";
import { formatDuration } from "../../lib/podcast-duration";

// The audio twin of CategoryCard: same anatomy, dark-surface palette.
export default function EpisodeCard({ episode }: { episode: EpisodeWithShow }) {
  // Feeds omit episode art far more often than show art, so the show's
  // cover is the fallback — never an empty dark box.
  const art = episode.imageUrl || episode.show.coverImageUrl;
  // The enclosure's MIME type is the only honest video signal in this data.
  const isVideo = Boolean(episode.audioType?.startsWith("video/"));
  const duration = formatDuration(episode.durationSeconds);

  return (
    <Link
      href={`/podcasts/${episode.show.slug}/${episode.slug}`}
      className="group block min-h-11"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2px] bg-white/5">
        {art ? (
          <FeedImage
            src={art}
            alt={episode.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 460px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}
        <span className="absolute left-0 top-0 bg-[var(--color-red)] px-2 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white">
          {isVideo ? "Watch" : "Listen"}
        </span>
      </div>

      <div className="mt-2 font-sans text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-red-ink)] line-clamp-1">
        {episode.show.title}
      </div>

      <h3 className="mt-1 font-headline text-[1.05rem] sm:text-[1.2rem] font-bold leading-[1.12] tracking-[-0.015em] text-white transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-3">
        {episode.title}
      </h3>

      <div className="mt-1.5 flex items-center gap-2 font-sans text-[12px] text-white/50">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {duration}
        </span>
        <span aria-hidden>·</span>
        <span>{episode.date}</span>
      </div>
    </Link>
  );
}
