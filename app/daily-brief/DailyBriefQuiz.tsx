"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Flame, Newspaper, X } from "lucide-react";
import type { QuizQuestion } from "../lib/daily-quiz";

export default function DailyBriefQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState(false);

  const question = questions[index];
  const finished = index >= questions.length;

  function handleSelect(slug: string) {
    if (selected) return;
    setSelected(slug);
    if (slug === question.correctSlug) setScore((s) => s + 1);
  }

  function handleNext() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  async function handleShare() {
    const text = `I got ${score}/${questions.length} in today's Stucci Media Daily Brief. Think you can beat it?`;
    try {
      await navigator.clipboard.writeText(`${text} stuccimedia.com/daily-brief`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail (permissions, non-secure context) — no harm
      // done, the score is still visible on screen either way.
    }
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-[var(--color-hairline)] bg-[var(--color-surface)] px-6 py-12 text-center shadow-card">
        <Flame className="h-10 w-10 text-[var(--color-red-ink)]" fill="currentColor" />
        <div>
          <p className="font-headline text-[40px] font-bold leading-none">
            {score}/{questions.length}
          </p>
          <p className="mt-2 font-sans text-[14px] text-[var(--color-gray)]">
            {score === questions.length
              ? "Perfect score — you actually read the news today."
              : score >= questions.length - 1
                ? "Nice work — you're paying attention."
                : "Come back tomorrow for a fresh brief."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="min-h-11 inline-flex items-center gap-2 rounded-control bg-[var(--color-navy)] px-5 font-sans text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-navy-dark)] active:scale-[0.97]"
        >
          {copied ? "Copied!" : "Copy Your Score"}
        </button>
        <Link
          href="/"
          className="min-h-11 inline-flex items-center font-sans text-[13px] font-bold text-[var(--color-red-ink)] hover:underline"
        >
          Back to the homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)]">
          <Newspaper className="h-4 w-4" />
          Question {index + 1} of {questions.length}
        </span>
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-gray-light)]">
          Score: {score}
        </span>
      </div>

      <h2 className="mb-5 font-headline text-[19px] sm:text-[22px] font-bold uppercase leading-[1.15] tracking-[-0.005em]">
        Which of these is a real Stucci Media headline?
      </h2>

      <div className="flex flex-col gap-2.5">
        {question.options.map((option) => {
          const isCorrect = option.slug === question.correctSlug;
          const isSelected = option.slug === selected;
          const showResult = Boolean(selected);

          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => handleSelect(option.slug)}
              disabled={showResult}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-control border px-4 py-3 text-left font-sans text-[14px] font-bold transition ${
                showResult && isCorrect
                  ? "border-green-600 bg-green-50 text-green-800"
                  : showResult && isSelected
                    ? "border-[var(--color-red)] bg-[var(--color-red)]/5 text-[var(--color-red-ink)]"
                    : "border-[var(--color-hairline-strong)] text-[var(--color-text)] hover:border-[var(--color-navy)]"
              } ${showResult ? "cursor-default" : "active:scale-[0.99]"}`}
            >
              {option.headline}
              {showResult && isCorrect && <Check className="h-4 w-4 shrink-0" />}
              {showResult && isSelected && !isCorrect && <X className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <button
          type="button"
          onClick={handleNext}
          className="mt-5 min-h-11 w-full rounded-control bg-[var(--color-red)] font-sans text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.98]"
        >
          {index + 1 === questions.length ? "See Your Score" : "Next Question"}
        </button>
      )}
    </div>
  );
}
