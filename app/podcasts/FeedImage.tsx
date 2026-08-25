import Image, { type ImageProps } from "next/image";

/**
 * Artwork that came from a podcast feed.
 *
 * Every other image on the site is uploaded through the newsroom and lands
 * in Vercel Blob, so `next.config.ts` can name that one host and let the
 * optimizer handle it. Feed artwork is different: it is served from
 * whatever host the publisher happens to use — Libsyn, Megaphone,
 * Buzzsprout, anchor.fm, a self-hosted WordPress — and the set changes
 * every time someone adds a show. `next/image` rejects any host not listed
 * in `remotePatterns` (it throws "hostname is not configured", which is
 * what broke every cover on the site), and a config file that has to be
 * edited before a new feed will display is not something an admin screen
 * can promise.
 *
 * So these bypass the optimizer. The trade is real and worth naming: the
 * publisher's original file is served at its own size, and podcast art is
 * routinely 1400px or 3000px square for a slot rendered at 168px. Fixing
 * that properly means re-hosting artwork into Blob on import — the same
 * approach used for the WordPress image migration — which also removes the
 * dependency on the publisher's host staying up. This component is where
 * that change would land.
 */
export default function FeedImage(props: Omit<ImageProps, "unoptimized">) {
  return <Image {...props} unoptimized />;
}
