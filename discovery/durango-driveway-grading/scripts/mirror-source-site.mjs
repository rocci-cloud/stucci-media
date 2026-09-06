#!/usr/bin/env node
/**
 * Mirrors durangodrivewaygrading.com into ./export/ using the site's open
 * WordPress REST API.
 *
 * Captures, in full and verbatim:
 *   export/media/<filename>          every original-size image binary (244 as of 2026-09-06)
 *   export/media-manifest.json       id, url, alt text, title, mime, dimensions, local path
 *   export/pages/<slug>.html         raw rendered page HTML (Elementor markup)
 *   export/pages/<slug>.json         title, slug, meta, modified date
 *   export/pages-index.json          every page with its URL and local file
 *   export/rankmath-seo.json         per-URL title/description/canonical/schema
 *
 * Run it anywhere with plain outbound HTTPS (local machine, CI, a Vercel build
 * step). It will NOT run inside the Claude Code sandbox — that environment's
 * network policy blocks arbitrary hosts, which is the whole reason this exists
 * as a script instead of having been executed already.
 *
 *   node scripts/mirror-source-site.mjs
 *
 * Idempotent: an image already present on disk with a non-zero size is skipped,
 * so a partial run can simply be re-run.
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const ORIGIN = "https://durangodrivewaygrading.com";
const OUT = path.resolve(process.cwd(), "export");
const CONCURRENCY = 6;

async function api(route) {
  const all = [];
  for (let page = 1; ; page++) {
    const url = `${ORIGIN}/wp-json/wp/v2/${route}${route.includes("?") ? "&" : "?"}per_page=100&page=${page}`;
    const res = await fetch(url);
    if (res.status === 400) break; // WP returns 400 past the last page
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") || 1);
    if (page >= totalPages) break;
  }
  return all;
}

async function mapLimit(items, limit, fn) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function exists(p) {
  try {
    return (await stat(p)).size > 0;
  } catch {
    return false;
  }
}

async function downloadMedia(items) {
  const dir = path.join(OUT, "media");
  await mkdir(dir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  const failures = [];

  const manifest = await mapLimit(items, CONCURRENCY, async (m) => {
    const src = m.source_url;
    const filename = decodeURIComponent(src.split("/").pop());
    const dest = path.join(dir, filename);

    const record = {
      id: m.id,
      sourceUrl: src,
      filename,
      localPath: `media/${filename}`,
      altText: m.alt_text || "",
      title: m.title?.rendered ?? "",
      caption: (m.caption?.rendered ?? "").replace(/<[^>]+>/g, "").trim(),
      mimeType: m.mime_type,
      width: m.media_details?.width ?? null,
      height: m.media_details?.height ?? null,
      uploadedAt: m.date_gmt ?? null,
      downloaded: false,
    };

    if (await exists(dest)) {
      skipped++;
      record.downloaded = true;
      return record;
    }

    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      downloaded++;
      record.downloaded = true;
    } catch (err) {
      // Record the failure instead of swallowing it. A green exit code that
      // hides 244 failed uploads is exactly the trap Phase 11 of this repo
      // documented; the summary below is the thing to actually read.
      failures.push({ url: src, error: String(err.message ?? err) });
      record.error = String(err.message ?? err);
    }
    return record;
  });

  return { manifest, downloaded, skipped, failures };
}

async function savePages(pages) {
  const dir = path.join(OUT, "pages");
  await mkdir(dir, { recursive: true });

  const index = [];
  for (const p of pages) {
    const slug = p.slug || `page-${p.id}`;
    await writeFile(path.join(dir, `${slug}.html`), p.content?.rendered ?? "", "utf8");
    const meta = {
      id: p.id,
      slug,
      link: p.link,
      title: p.title?.rendered ?? "",
      parent: p.parent ?? 0,
      status: p.status,
      modifiedGmt: p.modified_gmt,
      excerpt: (p.excerpt?.rendered ?? "").replace(/<[^>]+>/g, "").trim(),
      seo: p.rank_math_seo ?? p.yoast_head_json ?? null,
    };
    await writeFile(path.join(dir, `${slug}.json`), JSON.stringify(meta, null, 2), "utf8");
    index.push({ slug, link: p.link, title: meta.title, html: `pages/${slug}.html` });
  }
  await writeFile(path.join(OUT, "pages-index.json"), JSON.stringify(index, null, 2), "utf8");
  return index;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log("Fetching page content from the WordPress REST API…");
  const pages = await api("pages?status=publish");
  const posts = await api("posts?status=publish").catch(() => []);
  const index = await savePages([...pages, ...posts]);
  console.log(`  ${index.length} pages/posts written to export/pages/`);

  console.log("Fetching media library…");
  const media = await api("media");
  console.log(`  ${media.length} media records found`);

  console.log("Downloading image binaries…");
  const { manifest, downloaded, skipped, failures } = await downloadMedia(media);
  await writeFile(
    path.join(OUT, "media-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log("\n─── SUMMARY (read this, not the exit code) ───");
  console.log(`  pages written:     ${index.length}`);
  console.log(`  media records:     ${manifest.length}`);
  console.log(`  images downloaded: ${downloaded}`);
  console.log(`  images skipped:    ${skipped} (already on disk)`);
  console.log(`  failures:          ${failures.length}`);
  for (const f of failures) console.log(`    ✗ ${f.url} — ${f.error}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
