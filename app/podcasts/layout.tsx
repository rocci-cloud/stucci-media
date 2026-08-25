import PlayerProvider from "./PlayerProvider";

/**
 * Hosts the audio player for the whole podcast section.
 *
 * Scoped to /podcasts rather than the root layout deliberately: playback
 * only needs to survive navigation *within* the section (hub → show →
 * episode), and putting a client provider around every page on the site
 * would opt the entire newsroom into a client boundary it has no use for.
 */
export default function PodcastsLayout({ children }: { children: React.ReactNode }) {
  return <PlayerProvider>{children}</PlayerProvider>;
}
