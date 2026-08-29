import type { Article } from "../lib/articles";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

// The rest of a category's stories, below the CategoryLead treatment up
// top — deliberately dense rather than a repeat of the same big image
// cards: a table-like grid of variant="list" items (the same gap-px +
// hairline-background technique the homepage's LatestModule uses), so
// a category with dozens of stories reads as a browsable wire, not an
// endless stack of equal-weight photo cards.
export default function ArticleGrid({
  articles,
  title = "More Stories",
}: {
  articles: Article[];
  title?: string;
}) {
  return (
    <div>
      <SectionHeader title={title} compact />
      {articles.length === 0 ? (
        <p className="font-sans text-[var(--color-gray)] text-sm py-6">
          No more stories in this category yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-hairline)] rounded-card border border-[var(--color-hairline)] shadow-card overflow-hidden">
          {articles.map((a) => (
            <div key={a.slug} className="bg-[var(--color-surface)]">
              <ArticleCard article={a} variant="list" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
