"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Pause, RotateCcw, RotateCw, X, Loader2 } from "lucide-react";
import { formatDuration } from "../lib/podcast-duration";

export type PlayableEpisode = {
  id: string;
  title: string;
  audioUrl: string;
  durationSeconds: number | null;
  showTitle: string;
  showSlug: string;
  episodeSlug: string;
  coverImageUrl: string | null;
};

type PlayerState = {
  current: PlayableEpisode | null;
  isPlaying: boolean;
  play: (episode: PlayableEpisode) => void;
  toggle: (episode: PlayableEpisode) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

/**
 * Reads player state from anywhere inside the podcast section.
 *
 * Returns null outside the provider rather than throwing, so a component
 * that renders both inside and outside the section (a card in a homepage
 * rail, say) can degrade to a plain link instead of crashing the page.
 */
export function usePlayer(): PlayerState | null {
  return useContext(PlayerContext);
}

const SKIP_SECONDS = 15;
const SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayableEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const play = useCallback((episode: PlayableEpisode) => {
    setCurrent((existing) => {
      // Re-selecting what is already loaded resumes rather than restarting
      // from zero — losing your place because you tapped play twice is the
      // single most irritating thing a web player can do.
      if (existing?.id === episode.id) {
        void audioRef.current?.play();
        return existing;
      }
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      return episode;
    });
  }, []);

  const toggle = useCallback(
    (episode: PlayableEpisode) => {
      const audio = audioRef.current;
      if (current?.id === episode.id && audio) {
        if (audio.paused) void audio.play();
        else audio.pause();
        return;
      }
      play(episode);
    },
    [current, play]
  );

  // Load and autoplay whenever the selected episode changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.load();
    void audio.play().catch(() => {
      // Autoplay can be refused (no user gesture yet, or a hostile
      // codec). Surface it as "paused" rather than a spinner that never
      // resolves — the play button still works.
      setIsPlaying(false);
      setIsLoading(false);
    });
  }, [current]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed, current]);

  const seek = useCallback((to: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(to, audio.duration || 0));
  }, []);

  // Space toggles playback, unless the visitor is typing.
  useEffect(() => {
    if (!current) return;
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (event.code !== "Space") return;
      event.preventDefault();
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) void audio.play();
      else audio.pause();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  const value = useMemo<PlayerState>(
    () => ({ current, isPlaying, play, toggle }),
    [current, isPlaying, play, toggle]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remaining = duration > 0 ? duration - currentTime : (current?.durationSeconds ?? 0);

  return (
    <PlayerContext.Provider value={value}>
      {children}

      {/* Keeps the page clear of the fixed bar rather than letting it
          cover the last rows of an episode list. */}
      {current && <div aria-hidden className="h-[76px] sm:h-[84px]" />}

      {current && (
        <div
          role="region"
          aria-label="Podcast player"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-dark)] text-white shadow-[0_-8px_32px_rgba(0,0,0,0.28)]"
        >
          {/* Scrub bar sits on the top edge, full width — the largest
              possible hit area on a phone without stealing layout height. */}
          <label className="sr-only" htmlFor="podcast-seek">
            Seek within {current.title}
          </label>
          <input
            id="podcast-seek"
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            value={currentTime}
            onChange={(event) => seek(Number(event.target.value))}
            className="podcast-seek absolute -top-2 left-0 h-4 w-full cursor-pointer appearance-none bg-transparent"
            style={{ ["--progress" as string]: `${progress}%` }}
          />

          <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-3">
            <Link
              href={`/podcasts/${current.showSlug}/${current.episodeSlug}`}
              className="relative hidden h-12 w-12 shrink-0 overflow-hidden rounded-[6px] ring-1 ring-white/15 sm:block"
            >
              {current.coverImageUrl ? (
                <Image src={current.coverImageUrl} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <span className="img-placeholder block h-full w-full" />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/podcasts/${current.showSlug}/${current.episodeSlug}`}
                className="block truncate font-sans text-[13px] font-bold leading-tight hover:underline sm:text-[14px]"
              >
                {current.title}
              </Link>
              <p className="truncate font-sans text-[11px] uppercase tracking-[0.06em] text-white/55">
                {current.showTitle}
                {duration > 0 && (
                  <span className="ml-2 normal-case tracking-normal text-white/45">
                    {formatDuration(Math.round(currentTime))} / {formatDuration(Math.round(duration))}
                  </span>
                )}
                {duration === 0 && remaining > 0 && (
                  <span className="ml-2 normal-case tracking-normal text-white/45">
                    {formatDuration(Math.round(remaining))}
                  </span>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => seek(currentTime - SKIP_SECONDS)}
                aria-label={`Back ${SKIP_SECONDS} seconds`}
                className="hidden h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white sm:flex"
              >
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  if (audio.paused) void audio.play();
                  else audio.pause();
                }}
                aria-label={isPlaying ? `Pause ${current.title}` : `Play ${current.title}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-red)] text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.94]"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seek(currentTime + SKIP_SECONDS)}
                aria-label={`Forward ${SKIP_SECONDS} seconds`}
                className="hidden h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white sm:flex"
              >
                <RotateCw className="h-[18px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed as 1) + 1) % SPEEDS.length])}
                aria-label={`Playback speed ${speed}x, tap to change`}
                className="hidden h-11 min-w-11 items-center justify-center rounded-full px-2 font-sans text-[12px] font-bold text-white/70 transition hover:bg-white/10 hover:text-white sm:flex"
              >
                {speed}×
              </button>

              <button
                type="button"
                onClick={() => {
                  audioRef.current?.pause();
                  setCurrent(null);
                  setIsPlaying(false);
                }}
                aria-label="Close player"
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          <audio
            ref={audioRef}
            preload="metadata"
            onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration || 0);
              setIsLoading(false);
            }}
            onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
            onError={() => { setIsPlaying(false); setIsLoading(false); }}
          >
            <source src={current.audioUrl} />
          </audio>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
