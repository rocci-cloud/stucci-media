// Builds the three data graphics for the Nepal floods feature.
//
// These are deliberately GRAPHICS, not photographs. An AI-generated
// photoreal image of a real, ongoing disaster in which ~676 people are
// confirmed dead is indistinguishable from documentary photography of
// that disaster, and publishing one as a news cover would be dishonest
// in exactly the way this article argues against. Everything drawn here
// is a figure from a named source, rendered as an obvious diagram.
//
// Run: node scripts/build-nepal-graphics.mjs
// Output: scripts/data/nepal-graphics/*.png (1600x900, 16:9)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "data", "nepal-graphics");
mkdirSync(OUT, { recursive: true });

// Night-desk tokens, straight from app/globals.css.
const INK = "#F7F5F2";
const MUTED = "#A8B0BC";
const DIM = "#8E97A5";
const RED = "#C8102E";
const RED_INK = "#F04458";
const HAIR = "#262B34";

// Shared defs: the ground gradient, the crimson glow that gives the
// panel depth, a soft drop shadow for the elevated cards, and a vignette.
// Flat fills would read as clip art; these are what make it look lit.
const DEFS = `
<defs>
  <linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0%" stop-color="#171B22"/>
    <stop offset="55%" stop-color="#0E1116"/>
    <stop offset="100%" stop-color="#08090C"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.16" cy="0.14" r="0.62">
    <stop offset="0%" stop-color="${RED}" stop-opacity="0.34"/>
    <stop offset="45%" stop-color="${RED}" stop-opacity="0.09"/>
    <stop offset="100%" stop-color="${RED}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.78">
    <stop offset="55%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <linearGradient id="card" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0%" stop-color="#1C212B"/>
    <stop offset="100%" stop-color="#12161D"/>
  </linearGradient>
  <linearGradient id="river" x1="0" y1="0" x2="1" y2="0.6">
    <stop offset="0%" stop-color="${RED}"/>
    <stop offset="42%" stop-color="#B4442F"/>
    <stop offset="100%" stop-color="#5E6470"/>
  </linearGradient>
  <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${RED}"/>
    <stop offset="100%" stop-color="${RED}" stop-opacity="0"/>
  </linearGradient>
  <filter id="drop" x="-25%" y="-25%" width="150%" height="170%">
    <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.62"/>
  </filter>
  <filter id="softglow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="9" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;

// Greedy word wrap. librsvg has no auto-wrapping, and slicing by character
// index splits words in half — so lines are built word by word against an
// approximate advance width for the face and size in use.
function wrap(text, maxChars, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

const W = 1600;
const H = 900;

const base = () => `
<rect width="${W}" height="${H}" fill="url(#ground)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>`;

const vignette = () => `<rect width="${W}" height="${H}" fill="url(#vignette)"/>`;

const kicker = (x, y, text) => `
<rect x="${x}" y="${y - 15}" width="5" height="20" fill="${RED}"/>
<text x="${x + 16}" y="${y}" font-family="Archivo SemiBold" font-size="19"
  font-weight="700" letter-spacing="3.4" fill="${RED_INK}">${text}</text>`;

const footer = (label) => `
<rect x="72" y="${H - 92}" width="${W - 144}" height="1" fill="${HAIR}"/>
<text x="72" y="${H - 54}" font-family="Archivo SemiBold" font-size="17"
  fill="${DIM}" letter-spacing="0.4">${label}</text>
<text x="${W - 72}" y="${H - 54}" text-anchor="end" font-family="Oswald"
  font-size="20" font-weight="600" letter-spacing="2.6" fill="${MUTED}">STUCCI MEDIA</text>`;

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}${base()}${inner}${vignette()}</svg>`;

// ---------------------------------------------------------------- cover
// The corridor: where the glacier fell, and everywhere the water went.
// Drawn as a descending profile so the reader gets the one fact that
// explains the speed — this is a 4,000-metre drop, not a flat plain.
const STOPS = [
  { x: 215, y: 372, label: "LANGTANG LIRUNG", sub: "Glacier collapse", r: 15, hot: true },
  { x: 410, y: 436, label: "TIMURE", sub: "Rasuwa", r: 10, hot: true },
  { x: 596, y: 490, label: "SYABRUBESI", sub: "Rasuwa", r: 10, hot: true },
  { x: 794, y: 536, label: "BETRAWATI", sub: "Nuwakot", r: 9 },
  { x: 992, y: 572, label: "TRISHULI BAZAAR", sub: "Nuwakot", r: 9 },
  { x: 1192, y: 600, label: "DHADING", sub: "District", r: 8 },
  { x: 1386, y: 620, label: "GORKHA / CHITWAN", sub: "Downstream", r: 8 },
];

const riverPath =
  "M 215 372 C 310 418, 330 420, 410 436 S 528 472, 596 490 " +
  "S 724 524, 794 536 S 922 564, 992 572 S 1122 594, 1192 600 " +
  "S 1322 616, 1406 622";

const coverInner = `
${kicker(72, 108, "NEPAL FLOODS · 26 AUGUST 2026")}

<text x="72" y="182" font-family="Oswald" font-size="66" font-weight="700"
  letter-spacing="-0.6" fill="${INK}">THE TRISHULI CORRIDOR</text>
<text x="72" y="228" font-family="Archivo SemiBold" font-size="25" fill="${MUTED}">
  A glacier fell above Langtang. This is every district the water reached.</text>

<!-- the ridge silhouette behind the route: depth, and a reminder of scale -->
<path d="M 0 536 L 152 322 L 264 404 L 376 296 L 474 390 L 606 330 L 722 428
         L 862 372 L 1012 452 L 1162 402 L 1322 476 L 1462 434 L 1600 494
         L 1600 900 L 0 900 Z"
      fill="#0B0E13" opacity="0.72"/>
<path d="M 0 536 L 152 322 L 264 404 L 376 296 L 474 390 L 606 330 L 722 428
         L 862 372 L 1012 452 L 1162 402 L 1322 476 L 1462 434 L 1600 494"
      fill="none" stroke="#333B47" stroke-width="2.5"/>

<!-- the route itself, tapering as the surge loses height -->
<path d="${riverPath}" fill="none" stroke="#000" stroke-opacity="0.55"
      stroke-width="26" stroke-linecap="round" transform="translate(0,7)"/>
<path d="${riverPath}" fill="none" stroke="url(#river)" stroke-width="17"
      stroke-linecap="round" filter="url(#softglow)"/>

${STOPS.map((s) => `
<circle cx="${s.x}" cy="${s.y}" r="${s.r + 9}" fill="${s.hot ? RED : "#5E6470"}" opacity="0.16"/>
<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#0C0F14" stroke="${s.hot ? RED : "#7C8593"}" stroke-width="3.5"/>
<line x1="${s.x}" y1="${s.y - s.r - 8}" x2="${s.x}" y2="${s.y - 52}"
      stroke="${HAIR}" stroke-width="2"/>
<text x="${s.x}" y="${s.y - 62}" text-anchor="middle" font-family="Oswald"
  font-size="21" font-weight="600" letter-spacing="1.1"
  fill="${s.hot ? INK : MUTED}">${s.label}</text>
<text x="${s.x}" y="${s.y - 40}" text-anchor="middle" font-family="Archivo SemiBold"
  font-size="15" letter-spacing="0.6" fill="${DIM}">${s.sub}</text>`).join("")}

<!-- headline figures, on a lifted card so they read at thumbnail size -->
<g filter="url(#drop)">
  <rect x="72" y="654" width="1456" height="120" rx="4" fill="url(#card)"/>
  <rect x="72" y="654" width="1456" height="3" fill="url(#rule)"/>
</g>
${[
  ["676", "CONFIRMED DEAD", true],
  ["~3,000", "STILL MISSING", true],
  ["93,000", "PEOPLE IN NEED", false],
  ["17,000", "CHILDREN AFFECTED", false],
  ["$4–5B", "TO REBUILD", false],
]
  .map(([n, l, hot], i) => {
    const x = 132 + i * 288;
    return `
<text x="${x}" y="716" font-family="Oswald" font-size="46" font-weight="700"
  letter-spacing="-0.4" fill="${hot ? RED_INK : INK}">${n}</text>
<text x="${x}" y="748" font-family="Archivo SemiBold" font-size="15"
  letter-spacing="2.2" fill="${DIM}">${l}</text>
${i < 4 ? `<rect x="${x + 246}" y="682" width="1" height="66" fill="${HAIR}"/>` : ""}`;
  })
  .join("")}

${footer("Figures as of 29 August 2026 · Sources: Reuters, IFRC, UNICEF, Nepal Ministry of Finance")}`;

// ------------------------------------------------------------- timeline
const DAYS = [
  {
    d: "WED 26",
    t: "The mountain comes down",
    b: "The lower section of a glacier near Langtang Lirung breaks away, touching off an ice-and-rock avalanche and a landslide that funnels into the Trishuli corridor. No warning is issued. Entire communities are levelled within minutes.",
    n: "8",
    nl: "initial confirmed toll",
  },
  {
    d: "THU 27",
    t: "The scale becomes visible",
    b: "The UN releases $2m from its emergency fund. UNICEF counts 17,000 children affected across Rasuwa, Nuwakot and Dhading. Roads, bridges, water systems and telecoms are gone, leaving the worst-hit areas unreachable by land.",
    n: "165",
    nl: "confirmed dead",
  },
  {
    d: "FRI 28",
    t: "A new lake overflows",
    b: "A lake formed by the debris spills into the Lhende Khola and Trishuli. Rescue work halts; relief trucks stop where they stand. The IFRC puts the number of people in great need at 93,000. Six health facilities are damaged; eight health workers are missing.",
    n: "580",
    nl: "confirmed dead",
  },
  {
    d: "SAT 29",
    t: "Rescue resumes. Counting begins.",
    b: "The lake risk eases and search work restarts. Nepal asks the world not for rescuers but for tunnel specialists, bridge engineers, DNA testing and morgue capacity. The finance ministry estimates rebuilding at $4–5 billion.",
    n: "676",
    nl: "confirmed dead · ~3,000 missing",
  },
];

const timelineInner = `
${kicker(72, 104, "FOUR DAYS")}
<text x="72" y="176" font-family="Oswald" font-size="60" font-weight="700"
  letter-spacing="-0.5" fill="${INK}">HOW THE WEEK MOVED</text>
<text x="72" y="218" font-family="Archivo SemiBold" font-size="23" fill="${MUTED}">
  The toll did not rise because the disaster kept happening. It rose because rescuers kept reaching people.</text>

<line x1="128" y1="288" x2="128" y2="784" stroke="${HAIR}" stroke-width="3"/>

${DAYS.map((day, i) => {
  const y = 300 + i * 132;
  return `
<circle cx="128" cy="${y + 22}" r="17" fill="${RED}" opacity="0.14"/>
<circle cx="128" cy="${y + 22}" r="9" fill="#0C0F14" stroke="${RED}" stroke-width="3.5"/>
<text x="176" y="${y + 16}" font-family="Oswald" font-size="24" font-weight="700"
  letter-spacing="1.8" fill="${RED_INK}">${day.d}</text>
<text x="300" y="${y + 16}" font-family="Oswald" font-size="26" font-weight="600"
  letter-spacing="0.2" fill="${INK}">${day.t}</text>
${wrap(day.b, 108, 3)
  .map((line, li) => `<text x="300" y="${y + 46 + li * 25}" font-family="Archivo SemiBold"
  font-size="17" fill="${MUTED}">${line}</text>`)
  .join("")}
<text x="${W - 72}" y="${y + 24}" text-anchor="end" font-family="Oswald"
  font-size="38" font-weight="700" fill="${INK}">${day.n}</text>
<text x="${W - 72}" y="${y + 48}" text-anchor="end" font-family="Archivo SemiBold"
  font-size="14" letter-spacing="1.4" fill="${DIM}">${day.nl}</text>
${i < DAYS.length - 1 ? `<rect x="176" y="${y + 106}" width="${W - 248}" height="1" fill="${HAIR}"/>` : ""}`;
}).join("")}

${footer("Daily figures as reported by Reuters, UN News and the IFRC · Counts remain provisional")}`;

// ---------------------------------------------------------------- toll
const CARDS = [
  { n: "676", l: "CONFIRMED DEAD", s: "669 in Nepal, 7 in Tibet", hot: true },
  { n: "~3,000", l: "STILL MISSING", s: "2,426 Nepal · 554 Tibet", hot: true },
  { n: "540+", l: "FOREIGN NATIONALS MISSING", s: "Many Indian pilgrims", hot: false },
  { n: "93,000", l: "DIRECTLY AFFECTED", s: "IFRC estimate", hot: false },
  { n: "17,000", l: "CHILDREN IMPACTED", s: "UNICEF, three districts", hot: false },
  { n: "10,000+", l: "HOUSEHOLDS NEED SHELTER", s: "Trishuli corridor", hot: false },
  { n: "12%", l: "OF NATIONAL POWER LOST", s: "Damaged hydropower", hot: false },
  { n: "$4–5B", l: "TO REBUILD", s: "~a tenth of the economy", hot: false },
];

const tollInner = `
${kicker(72, 104, "THE TOLL")}
<text x="72" y="176" font-family="Oswald" font-size="60" font-weight="700"
  letter-spacing="-0.5" fill="${INK}">WHAT ONE MORNING COST</text>
<text x="72" y="218" font-family="Archivo SemiBold" font-size="23" fill="${MUTED}">
  Every figure below is attributed. All of them are still moving.</text>

${CARDS.map((c, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 72 + col * 368;
  const y = 288 + row * 244;
  return `
<g filter="url(#drop)">
  <rect x="${x}" y="${y}" width="344" height="204" rx="4" fill="url(#card)"/>
  <rect x="${x}" y="${y}" width="344" height="3" fill="${c.hot ? RED : HAIR}"/>
</g>
<text x="${x + 30}" y="${y + 96}" font-family="Oswald" font-size="60"
  font-weight="700" letter-spacing="-1" fill="${c.hot ? RED_INK : INK}">${c.n}</text>
<text x="${x + 30}" y="${y + 134}" font-family="Archivo SemiBold" font-size="15"
  font-weight="700" letter-spacing="1.9" fill="${INK}">${c.l}</text>
<text x="${x + 30}" y="${y + 164}" font-family="Archivo SemiBold" font-size="16"
  fill="${DIM}">${c.s}</text>`;
}).join("")}

${footer("As of 29 August 2026 · Reuters, IFRC, UNICEF, WHO, Nepal Ministry of Finance")}`;

const JOBS = [
  ["nepal-floods-corridor.png", coverInner],
  ["nepal-floods-timeline.png", timelineInner],
  ["nepal-floods-toll.png", tollInner],
];

for (const [name, inner] of JOBS) {
  const markup = svg(inner);
  writeFileSync(join(OUT, name.replace(".png", ".svg")), markup);
  await sharp(Buffer.from(markup), { density: 144 })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, name));
  console.log("  wrote", name);
}
console.log("done —", JOBS.length, "graphics in", OUT);
