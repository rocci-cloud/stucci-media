"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import CategoryDialog from "../categories/CategoryDialog";
import { createCategoryAction } from "../categories/actions";
import type { Category } from "../../lib/categories";

type Props = {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  selectedSlugs: string[];
  onSelectedChange: (slugs: string[]) => void;
};

export default function CategoryMultiSelect({
  categories,
  onCategoriesChange,
  selectedSlugs,
  onSelectedChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const selected = categories.filter((c) => selectedSlugs.includes(c.slug));

  function toggle(slug: string) {
    if (selectedSlugs.includes(slug)) {
      onSelectedChange(selectedSlugs.filter((s) => s !== slug));
    } else {
      onSelectedChange([...selectedSlugs, slug]);
    }
  }

  function handleCategoryCreated(category: Category) {
    onCategoriesChange([...categories, category]);
    onSelectedChange([...selectedSlugs, category.slug]);
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <Badge key={c.id} variant="primary" className="gap-1 pr-1">
              {c.label}
              <button
                type="button"
                onClick={() => toggle(c.slug)}
                aria-label={`Remove ${c.label}`}
                className="rounded-full p-0.5 hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full justify-between">
            {selected.length === 0 ? "Select categories…" : `${selected.length} selected`}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-72 overflow-y-auto p-1">
          {categories.map((c) => {
            const isSelected = selectedSlugs.includes(c.slug);
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
          <div className="my-1 h-px bg-[var(--admin-border)]" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-medium text-[var(--admin-primary)] hover:bg-[var(--admin-bg-subtle)]"
          >
            <Plus className="h-3.5 w-3.5" />
            New category
          </button>
        </PopoverContent>
      </Popover>

      <CategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        category={null}
        currentMainNavCount={categories.filter((c) => c.navPlacement === "MAIN").length}
        onSubmit={createCategoryAction}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
}
