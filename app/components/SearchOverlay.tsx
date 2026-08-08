"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-5 bg-[var(--color-navy)]/70 backdrop-blur-sm animate-[fadein_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-white rounded-card shadow-card-hover p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Search className="ml-3 h-[18px] w-[18px] text-[var(--color-gray-light)] shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="flex-1 min-h-11 py-3 text-[16px] font-sans text-[var(--color-text)] placeholder:text-[var(--color-gray-light)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="min-w-11 min-h-11 flex items-center justify-center text-[var(--color-gray-light)] hover:text-[var(--color-text)] transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
