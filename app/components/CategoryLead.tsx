import type { Article } from "../lib/articles";
import StoryCard from "./ui/StoryCard";

// The top of a listing page: one medium card at the full content width.
//
// Previously a lead-plus-briefs split. The river below it already carries
// the "here is everything else" job, and running a second arrangement
// above it meant a category page opened with a layout that appears nowhere
// else on the site.
export default function CategoryLead({ articles }: { articles: Article[] }) {
  const [lead] = articles;
  if (!lead) return null;

  return (
    <div className="border-b border-[var(--color-hairline)] pb-5">
      <StoryCard article={lead} size="medium" priority />
    </div>
  );
}
