export type Article = {
  slug: string;
  categorySlug: string;
  category: string;
  headline: string;
  dek: string;
  author: string;
  date: string;
  readTime: string;
  body: string[];
};

// Temporary in-code data source. In Phase 2 this gets replaced by
// real reads from the database once the article editor exists —
// every component below is already written against this shape,
// so swapping the data source later won't require touching the UI.
export const articles: Article[] = [
  {
    slug: "car-surveillance-mandate-2027",
    categorySlug: "political-news",
    category: "Current Events & News Analysis",
    headline: "Car Surveillance Mandate 2027 Meets Your Corner's Cameras",
    dek: "The car surveillance mandate 2027 deadline looms as 100,000+ Flock cameras already track your plate with no warrant. Here's what's actually changing — and who's fighting it.",
    author: "Rocci Stucci",
    date: "July 10, 2026",
    readTime: "6 min read",
    body: [
      "Over 100,000 Flock Safety cameras now sit on corners across the country, reading license plates without a warrant — and by 2027, that number is set to grow substantially under a new federal mandate. Here's what's actually changing, and who's pushing back.",
      "Local police departments have quietly expanded these networks for years, often without public votes or oversight hearings. Civil liberties groups on both the left and right are now raising the same objection: this is surveillance infrastructure built without consent.",
      "What makes this mandate different from prior expansions is the data-sharing requirement — plate reads would flow into a shared federal database, accessible across jurisdictions without the local accountability that at least existed before.",
      "Congressional pushback has been unusually bipartisan. We'll have more as this story develops.",
    ],
  },
  {
    slug: "georgia-veteran-roofing-heroes",
    categorySlug: "veterans",
    category: "Veterans",
    headline: "Georgia's Veteran-Owned Roofing Company Fights For Heroes",
    dek: "A small Georgia roofing company founded by veterans is quietly covering repair costs for families of fallen service members.",
    author: "Rocci Stucci",
    date: "July 10, 2026",
    readTime: "4 min read",
    body: [
      "In a strip mall outside Atlanta, a roofing company most people have never heard of has quietly repaired the homes of over forty Gold Star families since 2021 — at no charge.",
      "Founded by two former Army combat engineers, the company built its entire referral network through veteran service organizations rather than advertising.",
    ],
  },
  {
    slug: "free-speech-double-standard",
    categorySlug: "social-issues",
    category: "Social Issues",
    headline: "The Free Speech Double Standard Nobody Admits",
    dek: "A masked D.C. march and Cuba's third blackout of 2026 both expose the same truth about who really controls your feed.",
    author: "Rocci Stucci",
    date: "July 7, 2026",
    readTime: "5 min read",
    body: [
      "Two stories, an ocean apart, are quietly making the same point about who gets to speak and who gets silenced.",
    ],
  },
  {
    slug: "rocci-stucci-show-returns",
    categorySlug: "podcasts",
    category: "The Rocci Stucci Show",
    headline: "He's Back: The Rocci Stucci Show Returns with the Truth",
    dek: "The show returns — here's what's on deck for the new season, and why the break happened in the first place.",
    author: "Rocci Stucci",
    date: "July 1, 2026",
    readTime: "3 min read",
    body: [
      "After a longer hiatus than planned, The Rocci Stucci Show is back — and the new season is going straight at the stories the mainstream outlets won't touch.",
      "New episodes drop weekly. Full archive and show notes coming to the podcast section shortly.",
    ],
  },
  {
    slug: "west-bank-israeli-military",
    categorySlug: "world-news",
    category: "World",
    headline: "West Bank Is Burning. Even Israel's Military Says So.",
    dek: "Escalating settler violence in the West Bank has drawn an unusually direct warning from Israel's own military leadership.",
    author: "Rocci Stucci",
    date: "June 27, 2026",
    readTime: "5 min read",
    body: [
      "Reports from the region describe an escalation that even Israeli military officials are now openly characterizing as out of control.",
    ],
  },
  {
    slug: "charities-caught-misusing-donations",
    categorySlug: "crime-investigation",
    category: "Crime & Investigation",
    headline: "Charities Caught Misusing Donations: Where the Money Really Went",
    dek: "An investigation into where donor money actually ended up at several charities under new scrutiny.",
    author: "Rocci Stucci",
    date: "July 5, 2026",
    readTime: "7 min read",
    body: [
      "Public filings tell a very different story than the donation pages of several charities now under investigation.",
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string) {
  return articles.filter((a) => a.categorySlug === categorySlug);
}
