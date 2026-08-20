import { redirect } from "next/navigation";

// The hand-entry episode manager that used to live here is gone — episodes
// now come from a show's RSS feed. Anything still pointing at the old URL
// (a bookmark, a link in an old email) lands on the replacement rather than
// a 404.
export default function LegacyPodcastRedirect() {
  redirect("/admin/podcast-feeds");
}
