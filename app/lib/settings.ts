import { prisma } from "./prisma";
import { SETTING_DEFAULTS, type SettingKey, type SiteSettings } from "./setting-keys";

export type { SettingKey, SiteSettings };
export { SETTING_DEFAULTS };

/**
 * Reads every setting, falling back to the code-defined default for any
 * key that has never been written. Callers therefore always get a fully
 * populated object and never have to null-check a setting — the DB
 * holding no rows at all is a valid, working state.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany();
  const stored = new Map(rows.map((r) => [r.key, r.value]));

  const result = {} as SiteSettings;
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    const raw = stored.get(key);
    const fallback = SETTING_DEFAULTS[key];
    if (raw === undefined) {
      (result as Record<string, string | boolean>)[key] = fallback;
      continue;
    }
    // Booleans (feature flags) are stored as "true"/"false" strings —
    // the column is TEXT so one table can hold both kinds of setting.
    (result as Record<string, string | boolean>)[key] =
      typeof fallback === "boolean" ? raw === "true" : raw;
  }
  return result;
}

export async function updateSiteSettings(values: Partial<SiteSettings>): Promise<void> {
  const entries = Object.entries(values).filter(([key]) => key in SETTING_DEFAULTS);
  if (entries.length === 0) return;

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );
}
