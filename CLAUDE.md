@AGENTS.md

# Stucci Media

Independent news site for Rocci Stucci (Hammond, WI) — news analysis, world
coverage, social issues, crime investigation, veterans, and The Rocci Stucci
Show podcast. Tagline: "the stories mainstream media won't run."

Deployed on Vercel, connected to GitHub (`main` is the deploy branch).

## Stack

- Next.js 16 (App Router, React 19, TypeScript)
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme` in `app/globals.css` —
  no `tailwind.config.js`)
- `@fontsource/source-serif-4` for the headline face
- No database, no CMS, no auth yet — article content lives in a TS file

**Why Next.js and not a site builder:** per-article social share previews.
`generateMetadata()` in `app/articles/[slug]/page.tsx` runs on the server
before any crawler sees the page, so Facebook/X/iMessage bots get the real
headline and dek per article. Client-rendered SPA builders (Base44, Lovable)
couldn't do this — every share showed the same generic site card. Keep
article and category pages server-rendered.

## Structure

```
app/
  layout.tsx              root metadata (metadataBase, title template), fonts
  page.tsx                homepage: BreakingBar → Hero → ArticleGrid → Subscribe
  globals.css             design tokens + Tailwind import
  articles/[slug]/        article template + generateMetadata + generateStaticParams
  category/[slug]/        all 6 category pages from one route
  search/                 client-side filter over the articles array
  about/ contact/ privacy/
  components/             BreakingBar, SiteHeader, Hero, ArticleGrid,
                          SubscribeStrip, SiteFooter
  lib/articles.ts         Article type + article data + lookup helpers
  lib/categories.ts       Category type + the 6 categories + lookup helper
```

`app/lib/articles.ts` is the single data source. Every component is written
against the `Article` type, so swapping the array for real database reads in
Phase 2 shouldn't require touching the UI.

`Article`: `slug`, `categorySlug`, `category`, `headline`, `dek`, `author`,
`date`, `readTime`, `body` (array of paragraph strings).

Categories (slug → label): `political-news`, `world-news`, `podcasts`,
`social-issues`, `crime-investigation`, `veterans`. The nav in
`SiteHeader.tsx` and the list in `lib/categories.ts` must stay in sync.

## Design system

Newspaper look: serif body, black/white/red, hairline rules, no rounded
cards, no shadows, no dark mode (`color-scheme: light only` — there are
`!important` overrides in `globals.css` guarding against browser dark mode).

Colors (CSS vars on `:root`, used as `text-[var(--color-red)]` etc.):

| Token | Value | Use |
|---|---|---|
| `--color-black` | `#181818` | breaking bar background |
| `--color-text` | `#1a1a1a` | body text |
| `--color-gray` | `#595959` | deks, bylines, metadata |
| `--color-gray-light` | `#767676` | footer, timestamps |
| `--color-hairline` | `#dfdfdf` | light rules and borders |
| `--color-hairline-strong` | `#181818` | heavy section rules |
| `--color-red` | `#b31217` | kickers, links, Subscribe button |
| `--color-red-dark` | `#8f0e12` | red hover state |
| `--color-bg` | `#ffffff` | page background |
| `--color-bg-off` | `#f7f7f5` | subscribe strip background |

Image placeholders are `#E5E4E0` blocks with a hairline border — real
photos land in Phase 2.

Type:
- Headlines: `font-headline` (Source Serif 4, weights 600/700/900).
  Wordmark and page H1s are `font-black` with `tracking-[-0.02em]`.
- Body: Georgia / Times New Roman serif, set inline on `<body>` in
  `layout.tsx`. Article body is `text-[17px] sm:text-[19px] leading-[1.75]`.
- UI chrome (nav, bylines, metadata, buttons, forms): `font-sans`, small
  sizes, `uppercase tracking-wide font-bold` for kickers and nav.

Layout: `max-w-[1200px]` for grids and nav, `max-w-[720px]` for article and
search pages, `px-5` gutters throughout. Mobile-first — the nav collapses to
a ☰ toggle below `sm`.

## Phase 1 — done

Homepage, article template with per-article OG/Twitter metadata, all 6
category pages, search, About/Contact/Privacy, deployed.

## Phase 2 — next: a real article editor

The goal: Rocci can write, edit, and publish articles from a browser without
anyone touching code or running a deploy.

What it needs:
- A database for articles (replacing the array in `lib/articles.ts` — keep
  the `Article` shape or migrate the components deliberately)
- An admin route with login, so only Rocci can reach the editor
- Write/edit UI: headline, dek, category picker, body, author, date, plus
  draft vs. published state
- Image upload for cover images — then swap the `/og-default.png` fallback
  in `generateMetadata()` for the real per-article image, and replace the
  `#E5E4E0` placeholder blocks
- Revalidation so a publish shows up on the live site without a redeploy
  (article and category pages currently use `generateStaticParams`)

Phase 3 (later): the subscribe form in `SubscribeStrip.tsx` is inert markup
— wire it to a subscriber list with CSV export from the admin panel.
