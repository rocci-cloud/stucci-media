"use client";

import { useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { cn } from "../lib/cn";

const TASKS = [
  { id: "titles", label: "Suggest headlines", source: "article" },
  { id: "clarity", label: "Improve clarity", source: "body" },
  { id: "expand", label: "Expand", source: "body" },
  { id: "summarize", label: "Bottom line bullets", source: "article" },
  { id: "internal-links", label: "Suggest internal links", source: "body" },
  { id: "tone-check", label: "Tone check", source: "body" },
] as const;

type TaskId = (typeof TASKS)[number]["id"];

/**
 * AI assist for the editor. Every result lands in a review panel the
 * writer copies from — nothing is ever written straight into the article.
 * That's deliberate: this is a newsroom tool, and an assistant silently
 * rewriting published copy is a correction waiting to happen.
 */
export default function AiAssistPanel({
  headline,
  dek,
  bodyHtml,
  onApplyHeadline,
}: {
  headline: string;
  dek: string;
  bodyHtml: string;
  onApplyHeadline: (headline: string) => void;
}) {
  const [running, setRunning] = useState<TaskId | null>(null);
  const [result, setResult] = useState<{ task: TaskId; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodyText = bodyHtml
    .replace(/<\/(p|h[2-4]|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  async function run(task: TaskId, source: "article" | "body") {
    const text = source === "article" ? [headline, dek, bodyText].filter(Boolean).join("\n\n") : bodyText;
    if (!text.trim()) {
      setError("Write something first — there's nothing to work on yet.");
      return;
    }

    setRunning(task);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task, text }),
      });
      const data = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !data.text) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult({ task, text: data.text });
    } catch {
      setError("Couldn't reach the assistant.");
    } finally {
      setRunning(null);
    }
  }

  const lines = result?.text.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const isHeadlineList = result?.task === "titles";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {TASKS.map((task) => (
          <Button
            key={task.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={running !== null}
            onClick={() => run(task.id, task.source)}
          >
            {running === task.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {task.label}
          </Button>
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg-subtle)] px-3 py-2.5 text-[12.5px] text-[var(--admin-fg-muted)]">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-3 py-2">
            <span className="text-[12px] font-semibold tracking-[0.04em] text-[var(--admin-fg-muted)] uppercase">
              Suggestion — review before using
            </span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(result.text);
                toast.success("Copied.");
              }}
              className="flex items-center gap-1 text-[12px] font-medium text-[var(--admin-primary)] hover:underline"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>

          {isHeadlineList ? (
            <ul className="divide-y divide-[var(--admin-border)]">
              {lines.map((line, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-[13px] text-[var(--admin-fg)]">{line.replace(/^\d+[.)]\s*/, "")}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onApplyHeadline(line.replace(/^\d+[.)]\s*/, ""));
                      toast.success("Headline replaced.");
                    }}
                  >
                    Use
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <pre className={cn("max-h-72 overflow-y-auto px-3 py-2.5 text-[13px] whitespace-pre-wrap text-[var(--admin-fg)]")}>
              {result.text}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
