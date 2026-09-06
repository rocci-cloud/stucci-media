/**
 * Business facts, verbatim from the source site.
 *
 * Voice note: where the production site and the "Retrofit v1" staging build
 * disagree, this takes the staging wording — it is the newer editorial
 * decision and it is tighter. The one place production wins is depth: staging
 * cut the evaluation framework and the service list down to a homepage
 * summary, and that detail is kept on the pages built for it.
 */

export const site = {
  name: "Durango Driveway Grading",
  shortName: "DDG",
  owner: "Doug O'Dell",
  ownerNickname: "Driveway Doug",
  tagline: "Built for Colorado",
  url: "https://durangodrivewaygrading.com",

  phone: "970-360-3346",
  phoneHref: "tel:19703603346",
  email: "info@durangodrivewaygrading.com",

  facebook: "https://www.facebook.com/DurangoDrivewayGrading",

  /** Service-area business — no storefront address is published. */
  baseCity: "Durango",
  baseRegion: "CO",
  county: "La Plata County",

  /** Verbatim from the source site. Do not soften into "a deposit may apply". */
  depositTerms:
    "For approved projects, a 50% deposit reserves your spot on the schedule and allows material, equipment, and timing to be planned properly.",
  responsePromise: "Every request is reviewed personally. I'll respond within one business day.",

  closingLine:
    "No pressure. No generic grading advice. Just a clear look at what is going on and what is most likely to help.",
} as const;

/** The thesis. Every template leans on this; it is the whole business. */
export const thesis = {
  headline: "A gravel driveway needs to shed water, not carry it.",
  support:
    "Ruts, potholes, washboarding, mud, loose gravel, and washouts usually point to something deeper than a rough surface. In many Durango-area driveways, the real issue is water moving across the driveway, running down the tire tracks, collecting in low spots, or softening the base underneath.",
  consequence:
    "If the driveway is only graded smooth without correcting what is causing the failure, the same problems often come back after the next storm, snowmelt cycle, or heavy use.",
  /** Best single line either site produced. From staging v1. */
  standard: "I start with the conditions—not a predetermined fix.",
  ddgStandard: "Drainage first, structure second, finish always.",
} as const;

export const pillars = [
  {
    title: "Personally Reviewed",
    body: "When you reach out, I review your request personally and determine what makes sense next.",
  },
  {
    title: "One Owner. One Operator.",
    body: "If I take on your project, I'm the one who develops the game plan and does the work.",
  },
  {
    title: "Workmanship I Stand Behind",
    body: "I stand behind my workmanship and follow up after completed work has seen seasonal weather and use.",
  },
] as const;

/** The nine symptoms, verbatim. Used on every service page. */
export const warningSigns = [
  "Ruts keep forming in the same tire tracks",
  "Potholes return after previous grading",
  "Gravel washes downhill or off the road",
  "Water runs down the driveway instead of off it",
  "Low spots stay wet or muddy",
  "Washboarding keeps coming back",
  "The crown has flattened out",
  "The driveway feels soft, loose, or unstable",
  "Snowmelt and storms create new damage every season",
] as const;

/**
 * The four-step homepage process (staging v1). The production site's longer
 * six-step version is kept on /how-i-evaluate-driveways, where the extra
 * resolution earns its space — they describe the same process, not two.
 */
export const processSteps = [
  {
    n: "01",
    title: "Request a Driveway Consultation",
    body: "Show me what's happening and where the property is.",
  },
  {
    n: "02",
    title: "Get a Clear Game Plan",
    body: "I'll determine what makes sense next and explain what I recommend and why.",
  },
  {
    n: "03",
    title: "Approve the Work",
    body: "If the plan makes sense, approve the scope and I'll put it into action.",
  },
  {
    n: "04",
    title: "Reach the Goal",
    body: "The goal is a driveway that works better for your property—not simply one that looks freshly graded.",
  },
] as const;

/** Production's fuller six-step version, for the evaluation page. */
export const processStepsDetailed = [
  {
    n: "01",
    title: "Request an Evaluation",
    body: "Start with the online form. Share what is happening with your driveway — ruts, potholes, washouts, soft spots, loose gravel, drainage issues, or rough access. Photos and short videos are especially helpful.",
  },
  {
    n: "02",
    title: "Review the Details",
    body: "I personally review your request, property location, driveway issues, and any photos or videos you include. If the project looks like a possible fit, I'll provide an initial ballpark price range.",
  },
  {
    n: "03",
    title: "Schedule a Site Visit",
    body: "If the ballpark range makes sense, we schedule an in-person visit. This helps make sure the likely scope and budget are aligned before spending time on a full evaluation.",
  },
  {
    n: "04",
    title: "Build the Game Plan",
    body: "On site, I evaluate the driveway surface, slope, drainage, material condition, access, and problem areas. Then I develop a practical repair plan and quote based on what the driveway actually needs.",
  },
  {
    n: "05",
    title: "Approve the Quote",
    body: "If the game plan makes sense, you approve the quote and pay the deposit to reserve your spot on the schedule. From there, I coordinate the timing, material, equipment, and work plan.",
  },
  {
    n: "06",
    title: "5-Star Execution",
    body: "I complete the work, leaving you with a smoother, stronger, better-draining driveway — not just a surface that looks freshly bladed for a few days. After the work is complete, I'll review what changed and, if you're happy with the result, ask for a review.",
  },
] as const;

/** Stated plainly on the source site. Keeping it builds more trust than dropping it. */
export const scopeBoundaries = {
  does: "Gravel driveway grading, driveway drainage correction, culvert flow restoration, private road access maintenance, and seasonal snow plowing.",
  doesNot:
    "I don't take on paving, landscaping, utility work, or engineering work that requires a licensed professional engineer. If something falls outside my lane, I'll say so clearly.",
} as const;

export const nav = [
  { label: "Services", href: "/services" },
  { label: "How I Evaluate", href: "/how-i-evaluate-driveways" },
  { label: "Projects", href: "/projects" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "About", href: "/about" },
] as const;
