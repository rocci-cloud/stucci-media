"use server";

import { revalidatePath } from "next/cache";
import { updateSiteSettings } from "../../lib/settings";
import { SETTING_DEFAULTS, type SettingKey, type SiteSettings } from "../../lib/setting-keys";
import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";

export type SettingsResult = { success: true } | { success: false; error: string };

const MAX_LENGTHS: Partial<Record<SettingKey, number>> = {
  defaultMetaTitle: 120,
  defaultMetaDescription: 300,
  seoTitleSuffix: 40,
};

const URL_KEYS: SettingKey[] = [
  "socialFacebook",
  "socialX",
  "socialYouTube",
  "socialInstagram",
  "socialRumble",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateSettingsAction(values: Partial<SiteSettings>): Promise<SettingsResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Only an admin can change site settings." };

  for (const [key, value] of Object.entries(values)) {
    const settingKey = key as SettingKey;
    if (!(settingKey in SETTING_DEFAULTS)) continue;

    if (typeof value === "string") {
      const max = MAX_LENGTHS[settingKey];
      if (max && value.length > max) {
        return { success: false, error: `That value is too long — keep it under ${max} characters.` };
      }
      // Social links are optional; only a non-empty value has to be a
      // real URL, so clearing one is never rejected as invalid.
      if (URL_KEYS.includes(settingKey) && value.trim() && !/^https?:\/\/.+/i.test(value.trim())) {
        return { success: false, error: "Social links must start with http:// or https://." };
      }
      if (settingKey === "newsletterFromEmail" && value.trim() && !EMAIL_RE.test(value.trim())) {
        return { success: false, error: "That doesn't look like an email address." };
      }
    }
  }

  try {
    await updateSiteSettings(values);
    await logActivity({
      actor: session.user,
      action: "settings.updated",
      targetType: "settings",
      targetLabel: Object.keys(values).join(", "),
    });
    // Settings feed metadata and feature flags across the whole public
    // site, so the entire tree is revalidated, not just this page.
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't save those settings." };
  }
}
