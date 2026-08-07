export type Category = {
  slug: string;
  label: string;
  description: string;
};

export const categories: Category[] = [
  { slug: "political-news", label: "Political News", description: "Washington, policy, and the politics driving the headlines." },
  { slug: "world-news", label: "World News", description: "Global events and the conflicts shaping the world." },
  { slug: "podcasts", label: "Podcasts", description: "The Rocci Stucci Show and Stucci Media's full podcast lineup." },
  { slug: "social-issues", label: "Social Issues", description: "The cultural fights nobody else will cover honestly." },
  { slug: "crime-investigation", label: "Crime & Investigation", description: "Original reporting and deep dives into ongoing cases." },
  { slug: "veterans", label: "Veterans", description: "Stories from and for the veteran community." },
];

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
