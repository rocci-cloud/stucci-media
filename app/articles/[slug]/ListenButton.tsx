"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Volume2 } from "lucide-react";

type PlayState = "idle" | "playing" | "paused";

// Browser-native text-to-speech (SpeechSynthesis API) — zero backend, zero
// cost, works offline once the page has loaded. Gets ~80% of the value of
// NYT/WaPo's studio-narrated audio for none of the production cost; see
// CLAUDE.md's Retention Playbook summary for why that tradeoff was chosen
// deliberately rather than reached for a paid TTS API.
export default function ListenButton({ text }: { text: string }) {
  const [state, setState] = useState<PlayState>("idle");
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  function handleClick() {
    const synth = window.speechSynthesis;

    if (state === "playing") {
      synth.pause();
      setState("paused");
      return;
    }

    if (state === "paused") {
      synth.resume();
      setState("playing");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    utteranceRef.current = utterance;
    synth.cancel();
    synth.speak(utterance);
    setState("playing");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={state !== "idle"}
      aria-label={state === "playing" ? "Pause narration" : "Listen to this article"}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-sans text-[13.5px] font-bold transition ${
        state !== "idle"
          ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
          : "border-[var(--color-hairline-strong)] text-[var(--color-gray)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
      }`}
    >
      {state === "playing" ? <Pause className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
      {state === "playing" ? "Pause" : state === "paused" ? "Resume" : "Listen"}
    </button>
  );
}
