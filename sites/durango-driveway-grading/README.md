# Durango Driveway Grading

Next.js 16 site for [durangodrivewaygrading.com](https://durangodrivewaygrading.com), replacing
the WordPress/Elementor build.

Lives in a subdirectory of the `stucci-media` repo and deploys as its **own Vercel project** with
Root Directory `sites/durango-driveway-grading`. It shares nothing with the news site at the repo
root — separate `package.json`, separate dependency tree, separate deploy.

## Local development

```bash
cd sites/durango-driveway-grading
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (runs the image fetch first)
npm run typecheck
```

## Environment variables

| Variable | Required | What it does |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin for metadata, sitemap, robots, JSON-LD. Defaults to `https://durangodrivewaygrading.com`. **Set this on preview deployments** or previews will advertise production canonicals. |
| `RESEND_API_KEY` | **Yes, to receive leads** | Delivers consultation requests. |
| `CONSULTATION_FROM_EMAIL` | **Yes, to receive leads** | Verified Resend sender, e.g. `web@durangodrivewaygrading.com`. |
| `CONSULTATION_TO_EMAIL` | No | Where leads land. Defaults to `info@durangodrivewaygrading.com`. |

**Until `RESEND_API_KEY` and `CONSULTATION_FROM_EMAIL` are set, the form does not deliver.** It
fails loudly — an error in the server log and a message telling the visitor to call Doug directly.
That is deliberate: a lead that silently evaporates is worse than one that never got submitted.

## Structure

```
app/            routes — all statically prerendered (29 of them)
components/     ui.tsx primitives, blocks.tsx shared sections, header/footer,
                ConsultationForm, CrossSection
content/        every word of copy, as typed data
lib/seo.tsx     metadata helpers + JSON-LD builders
scripts/        fetch-images.mjs — see below
```

Copy lives in `content/`, not in JSX. Editing a service description, an FAQ answer, or a service
area means editing one data file, and every page that renders it updates together.

## Design tokens

Set once in `app/globals.css`. These are the client's own values, read from the CSS of the
"Retrofit v1" staging build rather than estimated from a screenshot:

| Token | Value |
|---|---|
| Ground | `#0F0F0F` |
| Surface | `#1A1A1A` |
| Accent | `#FFD700` |
| Text | `#F5F5F4` · muted `#A3A3A0` |
| Type | Poppins (display + body), IBM Plex Mono (specs) |
| Radius | `0` — square by decision |

Measured contrast: `#FFD700` on `#0F0F0F` is **13.7:1**, `#1A1A1A` on `#FFD700` is **12.8:1**.
Both clear AAA, so one accent value works as fill *and* text — there is no split token to keep in
sync.

Single-theme by intent. A contractor's field manual is a dark document; there is no light
counterpart to design, so every color is painted explicitly rather than inheriting a host ground.

**One accent discipline:** gold means "this is the next action". At most one gold fill per screen.
The staging build put two full-width `#FFD700` buttons in a single mobile viewport, and at that
saturation the accent stops meaning anything.

## Images

`scripts/fetch-images.mjs` pulls project photography from the legacy WordPress media library into
`public/images/` and runs automatically before every build.

**This is a bridge, not the final state.** It depends on the old WordPress site staying online.
Before DNS cutover:

```bash
npm run fetch:images
git add -f public/images && git commit
```

Then delete the script and its `prebuild` hook. `public/images` is currently gitignored precisely
so the bridge stays obvious rather than half-committed.

## SEO

- Every old URL has a destination. Changed paths are in `next.config.ts`; unchanged paths resolve
  directly. Old WordPress URLs carried trailing slashes, so they resolve in two hops
  (slash strip → mapped redirect) — normal and fine.
- `LocalBusiness` + `HomeAndConstructionBusiness` schema sitewide; `Service`, `FAQPage` and
  `BreadcrumbList` on the pages that warrant them. No competitor in this market publishes any.
- `aggregateRating`, `foundingDate` and `priceRange` are deliberately **absent** from the schema
  until the client supplies real figures. Inventing them on a trust-based trade site is worse than
  omitting the field.

## Known gaps

- **Credibility numbers.** Years operating, projects completed, Google rating, licence and
  insurance are all missing because they have not been supplied. This is the single highest-leverage
  thing outstanding — the nearest competitor advertises "20+ years · 500+ projects · 5.0 rating".
- **One testimonial**, sitewide.
- **Star Plaza commercial snow project** is not migrated. The old snow page said commercial work
  was not offered while a published case study documented it; the copy here softens that to
  "considered case by case", but the project page waits on the client's decision.
- **Legal pages** are written to describe what this site actually does, but have not been legally
  reviewed. If the previous policies were reviewed by counsel, use those instead.
- **Logo.** The wordmark is set in type. The emblem SVG exists in the old media library and should
  replace it once migrated.
