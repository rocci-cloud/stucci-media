# Page Inventory — durangodrivewaygrading.com

22 URLs discovered (sitemap + crawl, 2026-09-06). Every one must have a destination in the
rebuild — either a 1:1 replacement or an explicit 301. No URL gets silently dropped.

## Live content pages (15)

| # | Current URL | Title | Rebuild plan |
|---|---|---|---|
| 1 | `/` | Gravel Driveway Grading & Drainage Repair in Durango, CO | Keep `/` |
| 2 | `/services/` | Gravel Driveway Services in Durango, CO | Keep `/services` |
| 3 | `/services/gravel-driveway-grading/` | Gravel Driveway Grading in Durango, CO | Keep |
| 4 | `/services/driveway-drainage-correction/` | Driveway Drainage Correction in Durango & La Plata County | Keep |
| 5 | `/services/private-road-rural-access-maintenance/` | Private Road & Rural Access Maintenance near Durango | Keep |
| 6 | `/services/snow-removal/` | Snow Removal for Rural Driveways in Durango, CO | Keep |
| 7 | `/about/` | Built From Experience. Focused on Better Access. | Keep |
| 8 | `/evaluate-driveways/` | How I Evaluate Gravel Driveways | Keep — **this is the crown-jewel page** |
| 9 | `/request-driveway-evaluation/` | Request a Driveway Evaluation | Keep |
| 10 | `/service-areas/` | Service Areas index | Keep |
| 11 | `/service-areas/durango-co/` | Gravel Driveway Grading in Durango, CO | Keep |
| 12 | `/service-areas/bayfield-co/` | Bayfield | Keep |
| 13 | `/service-areas/hesperus-co/` | Hesperus | Keep |
| 14 | `/service-areas/ignacio-co/` | Ignacio | Keep |
| 15 | `/service-areas/durango-hills-co/` | Durango Hills | Keep |
| 16 | `/service-areas/forest-lakes-co/` | Forest Lakes | Keep |
| 17 | `/service-areas/la-plata-county-co/` | La Plata County | Keep |
| 18 | `/transformation-driveway-bayfield-co/` | Gravel Driveway Transformation in Bayfield, CO | Move to `/projects/bayfield-driveway-transformation` + 301 |
| 19 | `/same-night-commercial-snow-removal-star-plaza/` | Same-Night Commercial Snow Removal — Star Plaza | Move to `/projects/...` + 301 — **but resolve the commercial-snow contradiction first** |
| 20 | `/privacy-policy/` | Privacy Policy | Keep |
| 21 | `/terms-of-use-disclaimer/` | Terms & Conditions | Keep |

## Navigation-only / empty container pages (3)

These exist purely as dropdown parents in the Elementor menu and hold no unique content:
`/all-services/` · `/explore/` · `/company/`

→ In the rebuild these become nav labels, not routes. 301 each to its most relevant real page
(`/all-services/` → `/services`, `/explore/` → `/projects`, `/company/` → `/about`).

## Current navigation structure

```
Logo
├── All Services        (dropdown)
│   ├── Service Areas
│   ├── All Services
│   ├── Driveway Grading
│   ├── Driveway Drainage Correction
│   ├── Private Road & Rural Access Maintenance
│   └── Snow Removal
├── Explore             (dropdown)
│   └── Driveway Transformation – Bayfield
├── Company             (dropdown)
│   ├── About Durango Driveway Grading
│   └── How I Evaluate Gravel Driveways
└── Request Evaluation  (CTA)
```

Utility bar above nav: "Call/Text Doug: 970-360-3346" + "Request Evaluation" button.

> **Finding:** the top-level label "All Services" opens a dropdown whose first child is
> "Service Areas" and whose second child is *also* "All Services". That is confusing labeling and
> a wasted nav slot. Restructure in the rebuild (see GAME-PLAN.md §4).

## Footer structure

- **Contact Information** — phone, email
- **Quick Links** — Home, About, All Services, Driveway Grading, Drainage Correction, Private Roads, Snow Removal, Gravel Driveway Transformation, Evaluation Process, Request Evaluation
- **Service Areas** — all 7
- Legal — Privacy Policy, Terms & Conditions, "© 2026 All Rights Reserved."

> **Finding:** the footer Quick Links list is duplicated twice in the DOM (a desktop copy and a
> mobile copy). Fix in rebuild with one responsive component.

## Repeated section blocks (build these as components, not copy-paste)

The current site repeats the same blocks across nearly every page. In the rebuild each becomes a
single reusable component fed by one content source, so an edit lands everywhere at once:

| Block | Appears on |
|---|---|
| "Request a Driveway Evaluation" form | almost every page |
| "A Simple Evaluation-First Process" (6 steps) | home, all services, service areas |
| "Why Homeowners Call DDG" (3 pillars) | home, service pages |
| "Meet Doug" | home, service pages |
| "Featured Project: Bayfield" | home, service pages |
| "Serving Durango-Area Rural & Mountain Properties" (6 area cards + map note) | home, all services, service areas |
| "Common signs your driveway may need more than a quick grading pass" (9 bullets) | grading, drainage, private roads |
| FAQ accordion | every page, with per-page question sets |
| "Get Started Today" closing CTA | every page |

Map attribution notice that must be carried over verbatim wherever maps appear:
> "Map screenshots use Google Maps imagery and data © Google. Shown for general service-area
> reference only."
