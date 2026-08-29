import Link from "next/link";
import { FileText } from "lucide-react";
import type { ArticleDocument } from "../lib/articles";

/**
 * Primary sources behind a story — the filings, transcripts and datasets a
 * reader can check for themselves.
 *
 * There is no column behind `Article.documents` yet, so this renders
 * nothing today. It is written now because the article template has an
 * obvious place for it and the shape is settled; wiring the column plus an
 * editor field is one migration away. Deliberately NOT populated from the
 * body's outbound links — a link inside a paragraph is a citation, not a
 * receipt, and promoting all of them here would fill the block with
 * whatever the writer happened to reference in passing.
 */
export default function Receipts({ documents }: { documents?: ArticleDocument[] | null }) {
  const items = documents ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mt-8 border-l-4 border-[var(--color-navy)] bg-[var(--color-bg-off)] px-5 py-4">
      <h2 className="mb-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-navy)]">
        Receipts
      </h2>
      <ul className="space-y-2">
        {items.map((doc) => {
          const external = /^https?:\/\//.test(doc.url);
          return (
            <li key={doc.url} className="flex gap-2">
              <FileText className="mt-[3px] h-4 w-4 shrink-0 text-[var(--color-gray-light)]" aria-hidden />
              <Link
                href={doc.url}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-sans text-[14px] leading-[1.45] text-[var(--color-red-ink)] transition-colors hover:text-[var(--color-red-dark)] hover:underline"
              >
                {doc.label}
                {doc.source && (
                  <span className="text-[var(--color-gray-light)]"> — {doc.source}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
