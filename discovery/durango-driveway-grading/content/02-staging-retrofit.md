# staging4.durangodrivewaygrading.com — "Retrofit v1"

Discovered 2026-09-06 from a client screenshot. A parallel WordPress/Elementor redesign,
**published 3 Sep 2026, last modified 4 Sep 2026** — three days before this discovery started.
Correctly `noindex, nofollow`.

This is the source of the client's design direction, and it is authoritative in a way a screenshot
is not: the tokens below are read from the live CSS, not eyeballed off an image.

## Design tokens — the client's mandate

| Token | Value | Note |
|---|---|---|
| Background | `#0F0F0F` | Near-black. Replaces production's `#DDDDDD` light grey |
| Surface / button-2 | `#1A1A1A` | |
| Accent | `#FFD700` | Pure gold-yellow. **Brighter and more saturated than production's `#F9C235`** |
| Button (primary) | `#FFD700` fill, `#1A1A1A` text | **0px radius — square corners** |
| Global radius | `3px` | |
| Display + body face | **Poppins** | Both roles. Geometric sans |
| Type sizes | h1 `65px` · h2 `35px` · body `16px` | h1 size carried over from production |
| Colour scheme | `dark` | |

### Contrast — computed, not assumed

| Pair | Ratio | Verdict |
|---|---|---|
| `#FFD700` on `#0F0F0F` | **13.7:1** | Passes AAA comfortably |
| `#1A1A1A` on `#FFD700` (button) | **12.8:1** | Passes AAA comfortably |

The client's palette is genuinely accessible — notably better than production, where the amber
`#F9C235` was used as text on light grounds. **No red/gold split token is needed here**, unlike the
proposal drafted before this was found. The single accent works as both fill and text on this
ground. That simplifies the token system.

## Copy — substantially rewritten, and mostly better

Staging is not a reskin. The copy is tighter, more first-person, and less repetitive:

| | Production | Staging v1 |
|---|---|---|
| CTA | "Request a Driveway **Evaluation**" | "Request a Driveway **Consultation**" |
| Eyebrow | "Gravel Driveway Grading · Drainage Correction · Private Road Access" | "Gravel Driveways Are My Specialty" |
| H1 | "Gravel Driveway Grading & Drainage Repair in Durango, CO" | "Gravel Driveway Grading & Repair in Durango, Colorado" |
| Process | **6 steps** | **4 steps** |
| Services shown | 6 cards | 4 cards |
| Trust pillars | Owner-Operated / Drainage-First / Built for Colorado | Personally Reviewed / One Owner. One Operator. / Workmanship I Stand Behind |

New line worth keeping — it states the thesis better than production does:
> "I start with the conditions—not a predetermined fix."

New commitment not present on production:
> "I stand behind my workmanship and proactively follow up after completed work has experienced
> seasonal weather and normal use."

**Open question:** which copy is canonical for the rebuild — production's or staging v1's? They
differ on CTA wording, process step count, and service naming. This needs one decision, not a
merge, or the rebuild inherits both.

## Problems in the staging build

These are the things a rebuild should fix rather than carry forward.

1. **The template's demo content was never deleted.** The staging site's URL map is full of a
   *fitness and nutrition blog*:
   `/in-shape-for-good-nutrition-plan` · `/in-shape-for-good-workout-plan` ·
   `/in-shape-for-good-mindset-guide` · `/best-workout-routine-for-a-busy-lifestyle` ·
   `/10-workout-tips-for-increasing-muscle-size` · `/best-meals-for-increasing-muscle-mass` ·
   `/how-to-find-the-right-cardio-routine` · `/mistakes-to-avoid-when-lifting-weights` ·
   `/great-weight-exercises-for-burning-fat` · `/how-to-eat-healthy-without-being-miserable` ·
   `/the-influence-of-exercise-on-your-mental-health` · `/how-exercise-influences-mental-health` ·
   `/how-to-get-motivated-when-thinking-of-giving-up` ·
   `/lazy-tips-for-how-to-make-a-healthy-dinner-in-minutes` · `/e-books`

   Same failure mode as the *medical clinic* demo kit sitting in production's media library. Two
   purchased templates, neither cleaned out. If staging ever goes live without a purge, Google
   indexes a gravel-driveway contractor publishing muscle-building advice.

2. **Duplicate card in the problems list.** "Washouts, Mud & Soft Areas" appears **twice** in the
   four-item grid — items 1 and 4 are identical, word for word. So the list actually shows three
   distinct problems, not four.

3. **"SEE FULL PROJECT" links to `/about/`.** The featured-project CTA does not go to a project
   page. There is no project page on staging.

4. **The OG image is a placeholder.** `Home.jpg` is **400×380** — the same `400_380` dimension as
   Elementor's theme-kit placeholders found in production. Every social share renders a tiny,
   wrong image. Should be 1200×630.

5. **Two identical full-width yellow CTAs inside one mobile viewport** (visible in the client
   screenshot) — one above the hero photo, one below the intro. At `#FFD700` full-bleed, twice in
   one screen, the accent stops reading as "the next action."

6. **The hero photo is a thin letterboxed band** wedged between those two CTAs, and the 65px
   all-caps Poppins H1 consumes most of the first screen. The strongest asset on the page — Doug,
   on site, with his machine — is the smallest element in the fold.

## What to carry into the rebuild

- ✅ The palette: `#0F0F0F` ground, `#FFD700` accent, `#1A1A1A` surface
- ✅ Poppins
- ✅ Square-cornered buttons — suits the industrial read
- ✅ The tighter first-person copy voice
- ✅ "I start with the conditions—not a predetermined fix."
- ✅ The workmanship follow-up commitment
- ❌ Not the fitness blog
- ❌ Not the duplicate card, the wrong link, or the placeholder OG image
- ❌ Not two identical CTAs per screen
