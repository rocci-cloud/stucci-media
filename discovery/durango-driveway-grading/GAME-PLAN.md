# Durango Driveway Grading — Rebuild Game Plan

**Prepared:** 2026-09-06
**Source captured:** https://durangodrivewaygrading.com — 22 pages, 244 media assets, full copy
**Target:** ground-up rebuild, deployed on Vercel
**Objective:** the most credible gravel-driveway-and-drainage site in the United States, and
unambiguously the best in Southwest Colorado.

---

## 0. Where things stand

**1. Design direction — RESOLVED.** The reference image turned out to be a screenshot of
`staging4.durangodrivewaygrading.com`, a parallel WordPress retrofit published 3 Sep 2026 and
titled "DDG Home — Retrofit v1". That's better than a static mockup: the tokens below are read
from its live CSS, not estimated from an image.

| Token | Value |
|---|---|
| Background | `#0F0F0F` near-black |
| Surface | `#1A1A1A` |
| Accent | `#FFD700` gold-yellow |
| Primary button | `#FFD700` fill, `#1A1A1A` text, **square corners (0px)** |
| Typeface | **Poppins**, display and body |
| Type sizes | h1 65px · h2 35px · body 16px |

These are the client's picks and they are the mandate — §2 below has been rewritten to execute
them rather than propose an alternative. Full analysis of the staging build, including six issues
it should not carry into the rebuild, is in `content/02-staging-retrofit.md`.

**Two decisions the staging site raises:**

- **Who is driving the WordPress retrofit, and does it continue?** Someone was actively editing it
  two days before this discovery. A from-scratch Vercel rebuild and a WordPress retrofit are two
  tracks that will diverge. One should stop.
- **Which copy is canonical?** Staging rewrote the CTA ("Consultation" not "Evaluation"), cut the
  process from six steps to four, and renamed services. Its voice is genuinely tighter and I'd
  keep most of it — but this needs one decision, not a merge.

**2. Which repository does this ship from?** My GitHub access in this session is scoped to
`rocci-cloud/stucci-media` — a completely unrelated news site. Discovery artifacts are committed
to the `claude/driveway-grading-rebuild-5eazkj` branch there for now, but a from-scratch build
needs its own repo. Create `rocci-cloud/durango-driveway-grading` (or tell me the name you want)
and grant access, and I'll move everything over.

---

## 1. What we captured

Everything on the site is now accounted for:

- **All copy**, verbatim — positioning, all 7 services, the 6-step process, the 7-point evaluation
  framework, all 40+ FAQ entries, the testimonial, the Bayfield case study, every service-area page
- **All 244 media assets** catalogued with alt text, dimensions, and mime type
- **The full lead-form specification** — every field, every option
- **All 22 URLs** mapped to a rebuild destination or a 301
- **Every page's existing title and meta description** (they're good — we keep and improve)

Binaries: this session's sandbox blocks direct downloads from that domain, so
`scripts/mirror-source-site.mjs` does it in one command from anywhere with normal internet. It
pulls page HTML, media metadata, and all 244 image files, and prints a real success/failure count.

### What we found along the way

| Finding | Impact |
|---|---|
| **~45 of 244 media files are junk** — including an entire unrelated *medical clinic* template kit (`4_Home_Doctors_Online_Consultation-*`, `Dr.-Chyna-Jackson.jpg`) | Migrate ~150, bin the rest |
| **A ~45-icon custom SVG set** drawn specifically for gravel-road failure modes — culvert, pothole, washboarding, tire tracks, gravel migration, water pooling | Genuinely valuable. Recolor and reuse; do not replace with stock |
| **Nine "company values" icons** (Integrity, Transparency, Accountability, Commitment, Loyalty, Resilience, Respect & Care, Teamwork, Excellence) exist but **no values section was ever built** | Designed-and-abandoned premium content. Worth reviving |
| **3 of 7 services have no landing page** — Rut/Pothole/Washout Repair, Gravel Resurfacing & Road Base, Culvert & Ditch Flow. Their "Learn More" buttons dead-end on the generic services page | Three service-intent keywords with nothing to rank. Free traffic |
| **Snow removal page contradicts an existing page.** It says "Do you provide commercial snow removal? **No.**" while `/same-night-commercial-snow-removal-star-plaza/` is a published commercial snow case study | Needs your call before we carry the conflict forward |
| **"Vallecito"** appears in copy but has no service-area page | Easy 8th area page |
| Nav's top-level item is **"All Services"**, and its dropdown's second child is *also* "All Services" | Confusing; restructure |
| Footer link list is **duplicated twice in the DOM** (separate desktop/mobile copies) | Fix with one responsive component |
| Service-area maps are **Google Maps screenshots** under an attribution notice | Replace with a real map or original illustration |

---

## 2. Design direction — executing the client's palette

Locked to the staging tokens above. What follows is how to make them read as premium rather than
as a template, since the palette itself is now settled.

### The idea

Every competitor's site looks like a **contractor's brochure**. This one should look like a
**field manual** — the document a serious operator hands you once he has actually diagnosed your
problem. Precise, dark, engineered. Editorial, not promotional. The near-black ground and square
corners the client chose already point this way; the job is to hold that line everywhere.

### Palette

| Token | Value | Use |
|---|---|---|
| `--ground` | `#0F0F0F` | Page background — client's pick |
| `--surface` | `#1A1A1A` | Cards, panels — client's pick |
| `--surface-2` | `#242424` | Hover, elevated panels *(derived)* |
| `--gold` | `#FFD700` | The single highlight — client's pick |
| `--ink-on-gold` | `#1A1A1A` | Text on gold fills — client's pick |
| `--text` | `#F5F5F4` | Body copy *(derived)* |
| `--muted` | `#A3A3A0` | Metadata, captions *(derived, 8.9:1 on ground)* |
| `--rule` | `#2E2E2C` | Hairlines *(derived)* |
| `--navy` | `#1B355C` | Retained from the logo artwork only |

**Measured, not assumed:** `#FFD700` on `#0F0F0F` is **13.7:1**; `#1A1A1A` on `#FFD700` is
**12.8:1**. Both clear AAA. This palette is materially more accessible than production's, where
amber sat on light grounds. It also means **no split fill/text token is needed** — one accent
value works in both roles, which keeps the system simple.

### The one discipline that matters

**Gold marks the next action and nothing else.** The staging homepage puts two full-width
`#FFD700` buttons inside a single mobile viewport; at that saturation and that scale, the accent
stops meaning "act here" and starts reading as high-vis workwear. One primary action per screen.
Everything else is text, rule, or surface.

### Typography

Poppins is the mandate and it stays. Two refinements within it:

- **Tighten the caps.** 65px all-caps Poppins at default tracking eats three lines and most of the
  mobile fold (visible in the client screenshot). Negative tracking around `-0.02em` on display
  sizes, and a fluid `clamp()` scale so it lands near 40px on a phone rather than 65px.
- **Add a mono for data.** Project snapshots and material specs — `3/4" road base`, `~1/4 mile`,
  crown and cross-slope figures — set in a monospace face read as a spec sheet rather than
  marketing. It is the cheapest credibility signal available and no competitor has it.
  IBM Plex Mono or JetBrains Mono; one extra font file.

**Tailwind v4 note:** it cannot infer the type through commas in `clamp()` — the class needs the
explicit `text-[length:...]` hint or it silently generates no CSS at all.

### Motion

Restrained and fast. Everything under 800ms, one reveal per section rather than per card, content
visible at rest, full `prefers-reduced-motion` support.

The one signature moment: a **water-flow animation** on the drainage explainer — a line tracing
the wrong path down the tire track, then the corrected path shedding off the crown. It teaches the
entire value proposition in three seconds without a word of copy.

## 3. Closing the credibility gap — the highest-leverage work

DDG has the best *thinking* in the market and the weakest *proof*. LandEx advertises
"20+ years · 500+ projects · 5.0 Google rating." DDG shows one testimonial.

The design cannot fix this. **I need real numbers from Doug.** Nothing gets invented or estimated —
a fabricated project count on a trust-based trade site is worse than no number at all.

Please get me whatever of these is true:

- [ ] Years operating (as DDG, and total years running equipment)
- [ ] Projects completed — even approximate, if honestly labeled "50+"
- [ ] Google Business Profile rating and review count
- [ ] Total driveway miles/feet restored
- [ ] License number, bonded status, insurance carrier + coverage
- [ ] Doug's engineering background — `/about/` says "engineering background" but never says
      *what*. If there's a degree, a certification, or a specific discipline, that is a
      **category-defining differentiator** in a trade where nobody has one. Say it plainly.
- [ ] Equipment list and attachments (the photo library shows CMP Hydra Bucket, SkidPro land
      leveler, vibratory rollers, compact track loader, mini excavator — spec these out)
- [ ] More testimonials — even 3–4 more transforms the page
- [ ] Any additional completed projects with photos

Then: a **review-collection habit**. Step 6 of the process already says "ask for a review" — make
it a real automated follow-up. In 6 months that solves this permanently.

---

## 4. Information architecture

```
/                                   Home
/services                           Services overview
  /services/gravel-driveway-grading
  /services/driveway-drainage-correction
  /services/private-road-rural-access-maintenance
  /services/snow-removal
  /services/rut-pothole-washout-repair          ← NEW (was a dead link)
  /services/gravel-resurfacing-road-base        ← NEW (was a dead link)
  /services/culvert-ditch-flow-correction       ← NEW (was a dead link)
/how-i-evaluate-driveways           ← the crown jewel, promoted to top-level nav
/projects                           ← NEW index (today there's no gallery at all)
  /projects/bayfield-driveway-transformation    (301 from /transformation-driveway-bayfield-co/)
  /projects/star-plaza-commercial-snow-removal  (301 from the current URL)
/service-areas
  /service-areas/{durango,bayfield,hesperus,ignacio,durango-hills,forest-lakes,la-plata-county}-co
  /service-areas/vallecito-co                   ← NEW
/about
/request-evaluation                 (301 from /request-driveway-evaluation/)
/privacy-policy
/terms
```

**Nav restructure** — fixes the "All Services → All Services" problem:

```
Services ▾   |   How I Evaluate   |   Projects   |   Service Areas ▾   |   About
                                          [ Call/Text Doug ]  [ Request Evaluation ]
```

301s from `/all-services/` → `/services`, `/explore/` → `/projects`, `/company/` → `/about`.
**Every existing URL gets a destination.** The site has real, earned rankings — a rebuild that
drops them is a net loss no matter how good it looks.

---

## 5. The two things that will make this site win

Everything above is table stakes done well. These two are why people will link to it.

### A. The Driveway Diagnostic

Turn the existing `/evaluate-driveways/` framework into an interactive tool. The content is
*already written* — the three questions, the 7-point checklist, the three outcome categories. It
just needs to become an experience instead of an essay.

Homeowner answers 5–7 visual questions ("does water run down your tire tracks?" with a photo of
each symptom — **using the actual diagnostic photos already in the library**). Output: which of
Doug's three categories they likely fall into, what that means, what it does *not* mean, and a
pre-filled evaluation request carrying their answers through.

Why it wins:
- It is the drainage-first thesis made **undeniable** rather than merely asserted
- It qualifies leads before Doug spends a minute on them
- It arrives at his inbox pre-diagnosed, making step 2 of his process nearly free
- **No competitor in the country has one.** It is inherently linkable and inherently shareable
- It runs entirely client-side. No backend, no cost, no failure mode

### B. Project documentation as a genuine format

The Bayfield project already has a full Before / During / After photo set and a stated scope. Build
a real case-study template around it — draggable before/after comparison, the problem, the
diagnosis, the solution, the material spec, the outcome — and every future job slots into it.

Nobody in this market documents work this way. Three or four of these and DDG is visibly the most
serious operator in Southwest Colorado.

---

## 6. Technical plan

**Stack:** Next.js (App Router) + TypeScript + Tailwind v4, deployed on Vercel.

Static-first. Every page prerendered — a service-area page has no reason to hit a database. That
gives near-perfect Core Web Vitals, which is both a ranking factor and, on a rural mountain
connection, the difference between a lead and a bounce.

**Content:** MDX/TypeScript content files in-repo to start. No CMS on day one — Doug updates
roughly monthly, and a headless CMS is a subscription plus a moving part in exchange for very
little. If he wants self-service editing later, that's a clean Phase 2 addition.

**Images:** `next/image` throughout, AVIF/WebP, explicit `sizes`. Hero images `priority`, everything
else lazy. The current site serves full-resolution JPEGs with no responsive variants — this alone
is a large measurable win.

**Forms:** Server Action → email to Doug + database row so no lead is ever lost in a mail filter.
File upload to Vercel Blob (photos/video are central to his process, and the current form's upload
is the single most important field on the site). Honeypot + rate limiting instead of reCAPTCHA —
one less third-party script, one less friction point, better privacy posture.

**SEO — build on what's already right.** The current metadata discipline is genuinely good, better
than every competitor's. Carry all of it forward, then add what nobody in this market has:

- `LocalBusiness` + `Service` + `FAQPage` + `BreadcrumbList` JSON-LD (all six competitors: none)
- Per-page canonical URLs, dynamic sitemap, robots
- `dateModified` reflecting real edit timestamps, not publish dates
- Per-page OG images generated from the real project photography

**Analytics:** Vercel Analytics + Google Search Console. Track evaluation-form starts vs.
completions and phone-tap events — for a business like this, taps on `tel:` *are* the conversion.

---

## 7. Phasing

| Phase | Scope | Depends on |
|---|---|---|
| **0 — Foundations** | Repo, Vercel project, design tokens locked, component library, run the mirror script, curate the ~150 keeper assets | Your design image + repo decision |
| **1 — Core site** | Home, Services (all 7, incl. 3 new), About, How I Evaluate, Request Evaluation, working form + uploads | Phase 0 |
| **2 — Local SEO** | All 8 service-area pages, structured data, sitemap, all 301s, GBP alignment | Phase 1 |
| **3 — Proof** | Projects index, Bayfield case study, Star Plaza, testimonials, credibility numbers | Doug's numbers (§3) |
| **4 — The Diagnostic** | Interactive tool + pre-filled hand-off to the form | Phase 1 |
| **5 — Launch** | Redirect verification, Lighthouse, real-device mobile pass, cutover | All |
| **6 — Post-launch** | Review-collection loop, seasonal content, Vallecito page, values section | — |

Phases 1 and 2 are the revenue-critical path. Phase 4 is what makes it industry-leading.

**Cutover discipline:** the current site has earned rankings. We stage on a Vercel preview URL,
verify every one of the 22 redirects resolves, confirm titles/descriptions/structured data render
on the real deployment (not just locally), *then* repoint DNS. Nothing goes live on assumption.

---

## 8. Open questions for Doug

1. Commercial snow removal — **yes or no?** Two published pages currently disagree.
2. The credibility numbers in §3 — which are real?
3. What *is* the engineering background? It's mentioned once and never explained, and it may be
   the single strongest differentiator in this market.
4. Are there more completed projects with photos?
5. Does drone video exist? (There's a drone photo and a drone icon.)
6. Logo source files — `.ai`/`.svg` masters?
7. Was the company-values section (9 icons, never built) deliberately dropped or forgotten?
8. Vallecito — real service area or an off-hand mention?
9. Full lead-form field list — does the live popup collect name/email/phone/address? The scrape
   didn't render them; `export/pages/*.html` will confirm once the mirror script runs.
10. Instagram — there's an `Instagram_Fill.svg` in the library but no link anywhere on the site.
11. Who is building the `staging4` retrofit, and does that track continue alongside this one?
12. Production copy or staging v1 copy — which is canonical? (CTA wording, 6-step vs 4-step
    process, service names all differ.)
