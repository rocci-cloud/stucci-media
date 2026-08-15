"use client";

import { useEffect, useRef, useState } from "react";
import { autosaveArticleAction } from "./actions";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 4000;

/**
 * Debounced autosave for the article editor.
 *
 * Writes a revision checkpoint only — never the article row itself (see
 * autosaveArticleAction). The editor's Save button remains the only thing
 * that changes what's actually published, so nothing half-written can
 * reach the live site while someone is mid-sentence.
 *
 * Disabled entirely for a not-yet-created article: there's no id to attach
 * a revision to, and creating one implicitly would turn "I started typing
 * and changed my mind" into a stray draft.
 */
export function useAutosave(
  articleId: number | undefined,
  content: { headline: string; dek: string; body: string }
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // The content as of the last successful save, so an unchanged edit
  // (cursor moves, a tab switch re-rendering) doesn't trigger a write.
  const lastSaved = useRef<string>(JSON.stringify(content));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (articleId === undefined) return;

    const serialized = JSON.stringify(content);
    if (serialized === lastSaved.current) return;
    if (!content.headline.trim() || !content.body.trim()) return;

    setStatus("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      const result = await autosaveArticleAction(articleId, content);
      if (result.success) {
        lastSaved.current = serialized;
        setSavedAt(result.savedAt);
        setStatus("saved");
      } else {
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [articleId, content]);

  return { status, savedAt };
}
