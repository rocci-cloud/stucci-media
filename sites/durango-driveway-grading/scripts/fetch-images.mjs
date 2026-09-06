#!/usr/bin/env node
/**
 * Pulls the project photography this site references out of the legacy
 * WordPress media library and into ./public/images/.
 *
 * Runs as a prebuild step because the Claude Code sandbox that authored this
 * site cannot reach that host (network policy), but a Vercel build can. That
 * makes the first preview deploy render real photography instead of gaps.
 *
 * IMPORTANT — this is a bridge, not the final state. It depends on the old
 * WordPress site staying online. Before DNS cutover, run this once locally and
 * commit ./public/images so the site owns its own assets and this script can be
 * deleted. See discovery/durango-driveway-grading/GAME-PLAN.md.
 *
 * Never fails the build: a missing photo should not block a deploy, so a failed
 * download is logged loudly and skipped. Read the summary, not the exit code.
 */

import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "https://durangodrivewaygrading.com/wp-content/uploads";
const OUT = path.resolve(process.cwd(), "public/images");

/** local path -> source path under /wp-content/uploads */
const IMAGES = {
  // ── Brand marks ──────────────────────────────────────────────────────────
  // The official lockup is navy type on a light ground. Navy #1B355C on this
  // site's #0F0F0F measures 1.56:1 — invisible — so the header and footer use
  // the reversed variant the brand already has. Both are pulled so the light
  // version is available for any light surface (print, email, OG cards).
  "brand/ddg-logo-dark-bg.png": "2025/10/DDG-CO-ForDarkBG-PNG.png",
  "brand/ddg-logo-full-color.png": "2025/10/DDG-CO-FC-PNG-lockedin.png",
  "brand/ddg-logo-mono.png": "2025/10/DDG-Mono-PNG.png",
  "brand/ddg-logo-square.png": "2025/10/DDG-FC-Square-PNG.png",
  "brand/ddg-badge-tagline.png": "2025/10/Asset-4.01.png",
  "brand/ddg-social-share.png": "2025/10/DDG-CO-Social-Sharing-Image.png",

  // Doug / brand
  "doug/driveway-doug-owner-operator.jpg": "2025/11/DrivewayDoug_Owner-Operator_DurangoDrivewayGrading_800x1200.jpg",
  "doug/doug-odell-owner-operator.jpg": "2026/06/doug-odell-durango-driveway-grading-owner-operator-square.jpg",
  "doug/durango-driveway-grading-truck-trailer-skid-steer.jpg": "2026/06/durango-driveway-grading-truck-trailer-skid-steer.jpg",

  // Bayfield project — before
  "projects/bayfield-before-16.jpg": "2026/05/Bayfield-HWY160-Before-16.jpg",
  "projects/bayfield-before-23.jpg": "2026/05/Bayfield-HWY160-Before-23.jpg",
  "projects/bayfield-before-30.jpg": "2026/05/Bayfield-HWY160-Before-30.jpg",
  // during
  "projects/bayfield-during-1.jpg": "2026/05/Bayfield-HWY160-During-1.jpg",
  "projects/bayfield-during-13.jpg": "2026/05/Bayfield-HWY160-During-13.jpg",
  "projects/bayfield-during-34.jpg": "2026/05/Bayfield-HWY160-During-34.jpg",
  // after
  "projects/bayfield-after-27.jpg": "2026/05/Bayfield-HWY160-After-27.jpg",
  "projects/bayfield-after-23.jpg": "2026/05/Bayfield-HWY160-After-23.jpg",
  "projects/bayfield-after-18.jpg": "2026/05/Bayfield-HWY160-After-18.jpg",
  "projects/bayfield-after-13.jpg": "2026/05/Bayfield-HWY160-After-13.jpg",
  "projects/bayfield-after-7.jpg": "2026/05/Bayfield-HWY160-After-7.jpg",
  // process
  "projects/bayfield-drainage-ditch-excavation.jpg": "2026/06/bayfield-driveway-drainage-correction-ditch-excavation.jpg",
  "projects/bayfield-road-base-delivery.jpg": "2026/06/bayfield-road-base-delivery-gravel-driveway-restoration.jpg",

  // Evaluation — the three water questions
  "evaluation/1-where-is-it-coming-from.jpg": "2026/01/1-Where-is-it-coming-from.jpg",
  "evaluation/2-where-is-it-going.jpg": "2026/01/2-Where-is-it-going.jpg",
  "evaluation/3-what-is-it-doing.jpg": "2026/01/3-What-is-it-doing.jpg",

  // Problem diagnosis
  "problems/driveway-culvert-drainage-issue.jpg": "2026/06/driveway-culvert-drainage-issue.jpg",
  "problems/gravel-driveway-washout-potholes.png": "2025/11/gravel-driveway-washout-potholes.png",

  // Service areas
  "areas/durango-colorado-gravel-driveway-mountain-property.jpg": "2026/06/durango-colorado-gravel-driveway-mountain-property.jpg",
  "areas/colorado-rural-landscape-la-plata-mountains.jpg": "2026/06/colorado-rural-landscape-la-plata-mountains.jpg",
  "areas/rural-gravel-driveway-colorado.jpg": "2026/06/rural-gravel-driveway-colorado.jpg",
  "areas/durango-hills-colorado-mountain-gravel-driveway.jpg": "2026/06/durango-hills-colorado-mountain-gravel-driveway.jpg",
  "areas/forest-lakes-colorado-gravel-driveway.jpg": "2026/06/forest-lakes-colorado-gravel-driveway.jpg",
  "areas/la-plata-county-colorado-landscape.jpg": "2026/06/la-plata-county-colorado-landscape-la-plata-mountains.jpg",

  // Snow
  "snow/snow-removal-durango-hills.jpg": "2026/06/Snow-Removal-Durango-Hills-Colorado.jpg",
};

async function exists(p) {
  try {
    return (await stat(p)).size > 0;
  } catch {
    return false;
  }
}

let fetched = 0;
let skipped = 0;
const failures = [];

await Promise.all(
  Object.entries(IMAGES).map(async ([localPath, srcPath]) => {
    const dest = path.join(OUT, localPath);
    if (await exists(dest)) {
      skipped++;
      return;
    }
    await mkdir(path.dirname(dest), { recursive: true });
    try {
      const res = await fetch(`${SRC}/${srcPath}`, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      fetched++;
    } catch (err) {
      failures.push(`${localPath} <- ${srcPath}: ${err.message ?? err}`);
    }
  }),
);

console.log(`\n[images] fetched ${fetched} · already present ${skipped} · failed ${failures.length}`);
for (const f of failures) console.warn(`[images]   ✗ ${f}`);
if (failures.length > 0) {
  console.warn(
    "[images] Some photography is missing. The build continues — those slots will 404 until the assets are committed.",
  );
}
