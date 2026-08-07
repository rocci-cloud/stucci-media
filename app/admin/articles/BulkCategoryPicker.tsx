"use client";

import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Button } from "../components/ui/button";
import type { Category } from "../../lib/categories";

export default function BulkCategoryPicker({
  categories,
  disabled,
  onApply,
}: {
  categories: Category[];
  disabled?: boolean;
  onApply: (slugs: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  function handleOpenChange(next: boolean) {
    if (next) setDraft([]);
    setOpen(next);
  }

  function toggle(slug: string) {
    setDraft((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function apply() {
    if (draft.length === 0) return;
    onApply(draft);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          <Tag className="h-4 w-4" />
          Set category
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="max-h-64 overflow-y-auto">
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
        </div>
        <div className="mt-1 border-t border-[var(--admin-border)] pt-1">
          <Button size="sm" className="w-full" disabled={draft.length === 0} onClick={apply}>
            Apply to selected
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
