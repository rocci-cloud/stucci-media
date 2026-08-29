import Image from "next/image";
import Link from "next/link";
import type { Article } from "../lib/articles";
import type { Author } from "../lib/authors";
import { timeAgo } from "../lib/time-ago";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * Who wrote this, and what else they have written.
 *
 * Reads the real `Author` profile when one exists — avatar, title, bio and
 * socials are all editable from /admin, so nothing here is hardcoded to a
 * particular byline. A byline with no profile row still renders: initials
 * stand in for the photo and the bio is simply omitted, which is a better
 * outcome than the card disappearing for every contributor who has not been
 * given a profile yet.
 *
 * "More from" is filtered from the article list the page already fetched,
 * so this costs no extra query.
 */
export default function AuthorCard({
  authorName,
  authorSlug,
  profile,
  more,
}: {
  authorName: string;
  authorSlug: string;
  profile: Author | null;
  more: Article[];
}) {
  const items = more.slice(0, 3);

  return (
    <section className="mt-10 border-t-2 border-[var(--color-hairline-strong)] pt-5">
      <div className="flex items-start gap-4">
        {profile?.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={authorName}
            width={72}
            height={72}
            className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[var(--color-red)] font-headline text-[24px] font-bold text-white">
            {initials(authorName)}
          </span>
        )}

        <div className="min-w-0">
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-red-ink)]">
            Written by
          </div>
          <h2 className="mt-0.5 font-headline text-[22px] font-bold uppercase leading-[1.05] tracking-[-0.015em]">
            <Link href={`/author/${authorSlug}`} className="transition-colors hover:text-[var(--color-red-ink)]">
              {authorName}
            </Link>
          </h2>
          {profile?.title && (
            <div className="mt-0.5 font-sans text-[13px] text-[var(--color-gray)]">{profile.title}</div>
          )}
          {profile?.bio && (
            <p className="mt-2 max-w-[62ch] font-sans text-[14px] leading-[1.55] text-[var(--color-gray)]">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 border-b border-[var(--color-hairline)] pb-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-gray-light)]">
            More from {authorName}
          </div>
          <ul>
            {items.map((item) => {
              const posted = timeAgo(item.publishedAt);
              return (
                <li key={item.slug} className="border-b border-[var(--color-hairline)] last:border-b-0">
                  <Link
                    href={`/articles/${item.slug}`}
                    className="group flex min-h-11 items-center justify-between gap-4 py-2.5"
                  >
                    <span className="font-headline text-[15px] font-bold leading-[1.2] tracking-[-0.01em] transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-2">
                      {item.headline}
                    </span>
                    {posted && (
                      <span className="shrink-0 font-sans text-[12px] text-[var(--color-gray-light)]">{posted}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
