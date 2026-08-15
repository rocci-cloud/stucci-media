// Setting keys + their defaults, kept in a Prisma-free module so client
// components (the settings form) can import the shape and the labels
// without dragging the Prisma client — and its DATABASE_URL check — into
// the browser bundle. This is the same split that lib/banner-placements.ts
// exists for; see the Phase 36 note in CLAUDE.md.

export const SETTING_DEFAULTS = {
  // SEO defaults — used as the fallback whenever a page or article has no
  // value of its own.
  defaultMetaTitle: "Stucci Media | Independent News That Matters",
  defaultMetaDescription:
    "Independent reporting on politics, world events, crime, veterans, social issues, and free speech — the stories mainstream media won't run.",
  defaultShareImage: "/og-default.png",
  seoTitleSuffix: " | Stucci Media",

  // Social accounts.
  socialFacebook: "https://www.facebook.com/roccistucci",
  socialX: "",
  socialYouTube: "",
  socialInstagram: "",
  socialRumble: "",

  // Newsletter integration placeholders — the site's own subscribers
  // table is the real list today; these hold the details for whichever
  // provider gets wired up later.
  newsletterProvider: "",
  newsletterListId: "",
  newsletterFromEmail: "",

  // Feature flags.
  featureBreakingBar: true,
  featureComments: true,
  featureLikes: true,
  featurePushAlerts: true,
  featureDailyBrief: true,
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

export type SiteSettings = {
  [K in SettingKey]: (typeof SETTING_DEFAULTS)[K] extends boolean ? boolean : string;
};

export const BOOLEAN_SETTING_KEYS = (Object.keys(SETTING_DEFAULTS) as SettingKey[]).filter(
  (key) => typeof SETTING_DEFAULTS[key] === "boolean"
);

export const FEATURE_FLAG_LABELS: Partial<Record<SettingKey, { label: string; description: string }>> = {
  featureBreakingBar: {
    label: "Breaking news bar",
    description: "The red ticker across the top of every page.",
  },
  featureComments: {
    label: "Reader comments",
    description: "Comment threads at the bottom of articles.",
  },
  featureLikes: { label: "Article likes", description: "The like button on articles." },
  featurePushAlerts: {
    label: "Push alerts",
    description: "Browser notification opt-in for breaking stories.",
  },
  featureDailyBrief: { label: "Daily Brief quiz", description: "The daily news quiz at /daily-brief." },
};
