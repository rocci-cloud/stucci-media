// Seeds a working newsroom's worth of sample content for the admin
// dashboard: articles across the editorial pipeline (draft, in review,
// scheduled, published, archived), a couple of podcast episodes, and a
// media folder. Safe to re-run — everything upserts by slug/name.
//
// Run: node --env-file=.env.local scripts/seed-newsroom.mjs
//
// Categories must exist first (npm run db:seed-categories).
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const day = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysFromNow = (n) => new Date(now + n * day).toISOString();

const articles = [
  {
    slug: "sample-va-backlog-claims-investigation",
    categorySlug: "veterans",
    headline: "The VA Backlog Nobody Wants To Put A Number On",
    dek: "Disability claims are sitting unresolved for months longer than the official figures suggest. We asked for the raw numbers.",
    status: "PUBLISHED",
    publishedAt: daysFromNow(-3),
    isFeatured: true,
    isBreaking: true,
    isExclusive: true,
    tags: ["veterans", "investigation", "va"],
    bulletPoints: [
      "Official average wait times exclude claims sent back for rework.",
      "Counting those, the real wait is materially longer.",
      "Three regional offices account for most of the delay.",
    ],
    body: `<p>The Department of Veterans Affairs reports an average disability claim resolution time that has held steady for two years. Veterans filing those claims describe something else entirely.</p>
<h2>What the number leaves out</h2>
<p>The published figure counts a claim as resolved the first time a decision is issued. A claim returned for additional evidence and re-decided starts a new clock.</p>
<div class="callout callout-warning"><p>Ask for the "rework" figures specifically. They are tracked, and they are not in the headline number.</p></div>
<p>Three regional offices account for a disproportionate share of the repeat-decision volume. Staffing at all three has been flat since 2023.</p>`,
  },
  {
    slug: "sample-county-budget-hearing-walkout",
    categorySlug: "political-news",
    headline: "Commissioners Walked Out Before The Budget Vote. Here's Why.",
    dek: "A procedural objection ended a four-hour hearing with no vote and no rescheduled date.",
    status: "PUBLISHED",
    publishedAt: daysFromNow(-1),
    isFeatured: true,
    tags: ["florida", "budget", "local"],
    body: `<p>Four hours of public comment ended without a vote after two commissioners raised a procedural objection to the agenda order and left the chamber.</p>
<h2>The objection</h2>
<p>Under the county's own rules, the millage rate must be set before dependent line items are considered. The published agenda had them reversed.</p>
<p>No new hearing date has been set.</p>`,
  },
  {
    slug: "sample-open-records-denial-pattern",
    categorySlug: "crime-investigation",
    headline: "Six Records Requests, Six Denials, One Exemption Cited",
    dek: "Every rejection leaned on the same statute. We read it.",
    status: "PUBLISHED",
    publishedAt: daysFromNow(-8),
    tags: ["records", "transparency"],
    body: `<p>Six public records requests filed over eleven months came back denied, each citing the same active-investigation exemption.</p>
<p>Two of the six concerned cases that had already been closed at the time of the request.</p>`,
  },
  {
    // A future publishedAt with status PUBLISHED is how scheduling works
    // — nothing runs on a timer, the story simply becomes visible when
    // the clock passes it.
    slug: "sample-scheduled-veterans-day-feature",
    categorySlug: "veterans",
    headline: "The Quietest Veterans Day Ceremony In The County",
    dek: "No podium, no press release, and the same forty people every year.",
    status: "PUBLISHED",
    publishedAt: daysFromNow(6),
    tags: ["veterans", "feature"],
    body: `<p>There is no program, no speaker list, and no announcement. The same forty people have gathered at the same spot every November for nineteen years.</p>`,
  },
  {
    slug: "sample-in-review-school-board-contract",
    categorySlug: "social-issues",
    headline: "The Consultant Contract The School Board Approved Without Reading",
    dek: "Board members confirmed on the record that the document was distributed the morning of the vote.",
    status: "IN_REVIEW",
    publishedAt: null,
    tags: ["education", "accountability"],
    body: `<p>A $340,000 consulting contract passed 5-2 at a meeting where the full document was distributed roughly ninety minutes before the vote.</p>
<p>Two board members said on the record that they had not read it in full.</p>`,
  },
  {
    slug: "sample-draft-fema-reimbursement",
    categorySlug: "world-news",
    headline: "Working Draft: Storm Reimbursement Timeline",
    dek: "Notes and source list for the reimbursement delay story. Not ready.",
    status: "DRAFT",
    publishedAt: null,
    tags: ["draft"],
    body: `<p>Draft notes. Still waiting on the county's response to the second records request before this is publishable.</p>
<ul><li>Confirm the reimbursement submission date</li><li>Second source on the review queue</li><li>Right-of-reply call to the state office</li></ul>`,
  },
  {
    slug: "sample-archived-2024-primary-recap",
    categorySlug: "opinion-analysis",
    headline: "What The Primary Numbers Actually Showed",
    dek: "Kept for the record — superseded by later reporting.",
    status: "ARCHIVED",
    publishedAt: daysFromNow(-400),
    tags: ["elections", "archive"],
    body: `<p>An earlier analysis, retained for the record. Later reporting supersedes the turnout figures used here.</p>`,
  },
];

const episodes = [
  {
    slug: "sample-episode-open-records-fight",
    title: "The Open Records Fight Nobody Covered",
    subtitle: "What it actually takes to pry a document loose from a county that doesn't want to hand it over.",
    episodeNumber: 142,
    seasonNumber: 4,
    durationSeconds: 3130,
    status: "PUBLISHED",
    publishedAt: daysFromNow(-5),
    guestName: "Dana Whitfield",
    guestBio: "Open-government attorney who has litigated public records cases in three states.",
    showNotes: `<p>A working walkthrough of the records process: what to ask for, which exemptions get cited most, and what to do when the denial arrives.</p>
<ul><li>Writing a request that can't be narrowed away</li><li>The exemptions that get over-cited</li><li>When to appeal and when to refile</li></ul>`,
    transcript: "<p>Full transcript pending.</p>",
  },
  {
    slug: "sample-episode-veterans-roundtable",
    title: "Veterans Roundtable: The Claims Process",
    subtitle: "Three veterans on what the paperwork actually looks like from the inside.",
    episodeNumber: 143,
    seasonNumber: 4,
    durationSeconds: null,
    status: "DRAFT",
    publishedAt: null,
    guestName: null,
    guestBio: null,
    showNotes: "<p>Recorded. Needs an edit pass and a duration before this goes out.</p>",
    transcript: "",
  },
];

async function seedArticles() {
  let count = 0;
  for (const article of articles) {
    // Upsert by slug so re-running never duplicates. The join-table row
    // is synced separately below, since a direct insert like this one
    // bypasses the app's own syncArticleCategories().
    const [row] = await sql.query(
      `INSERT INTO articles
         (slug, category_slug, headline, dek, author, body, status, is_featured, is_breaking,
          is_exclusive, tags, bullet_points, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::article_status, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (slug) DO UPDATE SET
         category_slug = EXCLUDED.category_slug,
         headline = EXCLUDED.headline,
         dek = EXCLUDED.dek,
         body = EXCLUDED.body,
         status = EXCLUDED.status,
         is_featured = EXCLUDED.is_featured,
         is_breaking = EXCLUDED.is_breaking,
         is_exclusive = EXCLUDED.is_exclusive,
         tags = EXCLUDED.tags,
         bullet_points = EXCLUDED.bullet_points,
         published_at = EXCLUDED.published_at,
         deleted_at = NULL
       RETURNING id`,
      [
        article.slug,
        article.categorySlug,
        article.headline,
        article.dek,
        "Rocci Stucci",
        article.body,
        article.status,
        article.isFeatured ?? false,
        article.isBreaking ?? false,
        article.isExclusive ?? false,
        article.tags ?? [],
        article.bulletPoints ?? [],
        article.publishedAt,
      ]
    );

    const [category] = await sql.query(`SELECT id FROM categories WHERE slug = $1`, [article.categorySlug]);
    if (!category) {
      console.warn(`  ! category "${article.categorySlug}" not found — run db:seed-categories first`);
      continue;
    }
    await sql.query(
      `INSERT INTO article_categories (article_id, category_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [row.id, category.id]
    );
    count += 1;
  }
  return count;
}

async function seedEpisodes() {
  let count = 0;
  for (const episode of episodes) {
    await sql.query(
      `INSERT INTO podcast_episodes
         (id, slug, title, subtitle, episode_number, season_number, duration_seconds,
          show_notes, transcript, guest_name, guest_bio, status, published_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::article_status, $13, now())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         subtitle = EXCLUDED.subtitle,
         episode_number = EXCLUDED.episode_number,
         season_number = EXCLUDED.season_number,
         duration_seconds = EXCLUDED.duration_seconds,
         show_notes = EXCLUDED.show_notes,
         transcript = EXCLUDED.transcript,
         guest_name = EXCLUDED.guest_name,
         guest_bio = EXCLUDED.guest_bio,
         status = EXCLUDED.status,
         published_at = EXCLUDED.published_at,
         deleted_at = NULL,
         updated_at = now()`,
      [
        randomUUID(),
        episode.slug,
        episode.title,
        episode.subtitle,
        episode.episodeNumber,
        episode.seasonNumber,
        episode.durationSeconds,
        episode.showNotes,
        episode.transcript,
        episode.guestName,
        episode.guestBio,
        episode.status,
        episode.publishedAt,
      ]
    );
    count += 1;
  }
  return count;
}

async function seedMediaFolders() {
  const folders = [
    ["Veterans", "veterans"],
    ["Investigations", "investigations"],
    ["Podcast art", "podcast-art"],
  ];
  for (const [name, slug] of folders) {
    await sql.query(
      `INSERT INTO media_folders (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [randomUUID(), name, slug]
    );
  }
  return folders.length;
}

const articleCount = await seedArticles();
const episodeCount = await seedEpisodes();
const folderCount = await seedMediaFolders();

console.log(`Seeded ${articleCount} article(s), ${episodeCount} podcast episode(s), ${folderCount} media folder(s).`);
console.log("Every slug is prefixed 'sample-' so it's easy to find and remove later.");
