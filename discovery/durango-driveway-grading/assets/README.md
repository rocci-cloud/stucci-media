# Image & Asset Inventory

**244 media items** in the WordPress library (confirmed via three paginated REST API calls,
2026-09-06).

## Why the binaries aren't in this folder yet

This Claude Code session runs behind a network policy that only permits a fixed allowlist of
hosts. `durangodrivewaygrading.com` is not on it — `curl`/`wget` to that host return
`403 CONNECT tunnel failed`. Page *content* was captured through the Firecrawl MCP tool (which is
allowlisted), but that tool returns text, not image bytes.

So the binaries need one command run from anywhere with ordinary internet access:

```bash
cd discovery/durango-driveway-grading
node scripts/mirror-source-site.mjs
```

That writes `export/media/` (all 244 originals), `export/media-manifest.json` (URL, alt text,
title, caption, mime, dimensions), and `export/pages/` (raw HTML + metadata for every page).
It is idempotent and prints a real summary — **read the summary, not the exit code.**

Run it on your machine, in CI, or in a session with open egress. It takes about a minute.

## What's in the 244

### Real project photography — the valuable stuff (~90 files)

**Bayfield HWY160 project** — the flagship case study, shot as a full Before / During / After set:
- `Bayfield-HWY160-Before-*.jpg` (10, 14, 16, 21, 23, 25, 30, 37)
- `Bayfield-HWY160-During-*.jpg` (1, 13, 16, 29, 34, 35)
- `Bayfield-HWY160-After-*.jpg` (4, 7, 13, 18, 21, 23, 27)
- `bayfield-driveway-drainage-correction-ditch-excavation.jpg`
- `bayfield-road-base-delivery-gravel-driveway-restoration.jpg`
- `bayfield-gravel-driveway-compaction-roller-skid-steer.jpg`

**Doug / brand portraits** — irreplaceable, the whole site's owner-operator positioning rests here:
- `DrivewayDoug_Owner-Operator_DurangoDrivewayGrading_800x1200.jpg` (cowboy hat + work vest, pines)
- `doug-odell-durango-driveway-grading-owner-operator-1.jpg` + `-square.jpg`
- `durango-driveway-grading-truck-trailer-skid-steer.jpg`

**Equipment / process library** (~40 PNGs from 2025/11) — CMP Hydra Bucket, SkidPro land leveler,
vibratory roller, compact track loader, several matched before/after pairs.

**Problem-diagnosis photos** — used to illustrate the drainage argument:
- `Driveway-water-in-tire-tracks*.jpg` · `Driveway-Loss-of-Crown.jpg`
- `Culvert-Buried-Inlet-Outlet.jpg` · `driveway-culvert-drainage-issue.jpg`
- `1-Where-is-it-coming-from.jpg` · `2-Where-is-it-going.jpg` · `3-What-is-it-doing.jpg` · `4-Water-takes-the-easy-path.jpg`
- `durango-hills-driveway-snowmelt-erosion.jpg`

**Service-area location photography** (one per area page):
`durango-colorado-gravel-driveway-mountain-property.jpg` · `forest-lakes-colorado-gravel-driveway.jpg` ·
`durango-hills-colorado-mountain-gravel-driveway.jpg` · `colorado-rural-landscape-la-plata-mountains.jpg` ·
`la-plata-county-colorado-landscape-la-plata-mountains.jpg` · `rural-gravel-driveway-colorado.jpg` ·
`colorado-gravel-driveway-grading-skid-steer-*.jpg`

**Snow removal:** `Snow-Removal-Durango-Hills-Colorado.jpg` · `skidsteer-plowing-snow-driveway.jpg` ·
`skidsteer-plowing-snow-driveway-drone.jpg` · `DDG-Rigging-Up-Snow-Plowing.jpg`

**Service-area maps** (7): `Service-Area-{Durango,Bayfield,Hesperus,Ignacio,Durango-Hills,Forest-Lakes,La-Plata-County}.jpg`
⚠️ These are Google Maps screenshots. The site carries an attribution line for them. In the
rebuild, prefer a real map component or original illustration — see GAME-PLAN.md §7.

### Logo & brand marks (~15 files) — capture ALL variants

`Asset-2.00.svg` (primary header logo, SVG) · `Asset-4.00.png` / `Asset-4.01.png` (with "Built for
Colorado" tagline) · `Asset-4.00-Blues.svg` / `Asset-4.00-Browns.svg` (colorway variants) ·
`Asset-5.00.png` (with phone number) · `Asset-3.00.png` · `Asset-6.00.png` (footer) ·
`DDG-CO-ForDarkBG-PNG.png` · `DDG-FC-Square-PNG.png` · `DDG-Mono-PNG.png` · `DDG-FC-PNG.png` ·
`DDG-CO-FC-Round-PNG-scaled.png` · `DDG-CO-FC-PNG-lockedin.png` · `DDG-Site-Favicon.png` ·
`DDG-CO-Social-Sharing-Image.png`

The two SVG colorways (`-Blues`, `-Browns`) are worth a look — they suggest the brand has already
been explored in more than one palette.

### Custom icon set (~45 SVGs) — genuinely reusable, keep all of it

Domain-specific icons someone actually drew for this business, not stock:
`Culvert.svg` · `Culvert-Drainage.svg` · `Pothole.svg` · `Washout.svg` · `Washboarding.svg` ·
`Tire-Tracks.svg` · `Gravel-Migration.svg` · `Water-Pooling.svg` · `Blockage.svg` · `Drainage.svg` ·
`Compactor.svg` · `Compaction-Roller.svg` · `Excavator.svg` · `Dozer.svg` · `Dump-Truck.svg` ·
`Grade-Check.svg` · `Gravel-1.svg` · `Stone.svg` · `Speed-Bump.svg` · `Private-Road.svg` ·
`Maintenance.svg` · `Drone.svg` · `Camera.svg` · `Film-Take.svg` · `Contractor.svg` /
`Contractor2.svg` · `Builder.svg` · `Man-Wrench.svg` · `Blueprint.svg` · `Budget.svg` ·
`Contract.svg` · `CC-Transaction.svg` · `Checklist.svg` · `5-Star-Checklist.svg` ·
`Quality-Check.svg` · `Quality-Management.svg` · `Certified.svg` · `Guarantee.svg` · `Shield.svg` ·
`Standard.svg` · `Excellence.svg` · `Integrity.svg` · `Accountability.svg` · `Transparency.svg` ·
`Commitment.svg` · `Loyalty.svg` · `Resilience.svg` · `Respect-Care.svg` · `Teamwork.svg` ·
`No-Pressure.svg` · `Location.svg` · `Phone.svg` · `Instagram_Fill.svg`

An SVG icon set this specific to gravel-road failure modes is a real asset. Recolor to the new
palette and reuse — do not replace with generic stock icons.

> The `Accountability / Integrity / Transparency / Commitment / Loyalty / Resilience / Respect &
> Care / Teamwork / Excellence` icons imply a **company-values section that was designed but never
> shipped** on the current site. Worth asking Doug — it's ready-made premium content.

### Junk — do NOT migrate (~45 files)

- `4_Home_Doctors_Online_Consultation-*` (~20 files) — an **unrelated medical template demo kit**
  left in the library. Includes `Dr.-Chyna-Jackson.jpg`. Nothing to do with this business.
- Elementor theme-kit placeholders: `*-400_380.jpg` (Homepage, About, Services, Contact-US, Header,
  Footer, Blog, Single, Pop-Up, 404, Global-Styles), `1920x540.jpg`, `1920x844.jpg`, `63x63.jpg`,
  `placeholder*.png`
- `Elementor-post-screenshot_*.png` — builder artifact
- `Article-img_3-13122021-1.jpg`, `quate.svg`, `icon2.svg`, `Asset-1..6.svg` — unused template bits

**Net: roughly 150 of 244 files are worth migrating.** The rest is template debris — a good
argument for the rebuild on its own.

## Missing from the client

Doug should supply, if they exist:
- Any raw/original-resolution versions of the Bayfield set (site copies are web-compressed)
- Drone video (there's a drone photo and a `Drone.svg` icon, so footage may exist)
- Logo source files (`.ai` / `.svg` masters) rather than exported PNGs
- Additional completed projects — the site leans on a single case study
