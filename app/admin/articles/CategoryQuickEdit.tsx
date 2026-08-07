"use client";

import { useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Badge } from "../components/ui/badge";
import type { Category } from "../../lib/categories";

export default function CategoryQuickEdit({
  categories,
  selectedSlugs,
  pending,
  onApply,
}: {
  categories: Category[];
  selectedSlugs: string[];
  pending: boolean;
  onApply: (slugs: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selectedSlugs);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(selectedSlugs);
    else if (draft.length > 0 && JSON.stringify(draft) !== JSON.stringify(selectedSlugs)) {
      onApply(draft);
    }
    setOpen(next);
  }

  function toggle(slug: string) {
    setDraft((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  const labels = categories.filter((c) => selectedSlugs.includes(c.slug));

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex flex-wrap items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-[var(--admin-bg-subtle)]"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--admin-fg-muted)]" />
          ) : (
            <>
              {labels.slice(0, 2).map((c) => (
                <Badge key={c.id} variant="outline">
                  {c.label}
                </Badge>
              ))}
              {labels.length > 2 && <Badge variant="outline">+{labels.length - 2}</Badge>}
              <Pencil className="h-3 w-3 text-[var(--admin-fg-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-h-64 overflow-y-auto p-1" align="start">
        {categories.map((c) => {
          const isSelected = draft.includes(c.slug);
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => toggle(c.slug)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-[var(--admin-bg-subtle)]"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                  isSelected
                    ? "border-[var(--admin-primary)] bg-[var(--admin-primary)] text-white"
                    : "border-[var(--admin-border)]"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              {c.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
