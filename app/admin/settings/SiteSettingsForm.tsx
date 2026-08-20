"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { updateSettingsAction } from "./actions";
import { FEATURE_FLAG_LABELS, type SettingKey, type SiteSettings } from "../../lib/setting-keys";

const SOCIAL_FIELDS: { key: SettingKey; label: string; placeholder: string }[] = [
  { key: "socialFacebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "socialX", label: "X", placeholder: "https://x.com/…" },
  { key: "socialYouTube", label: "YouTube", placeholder: "https://youtube.com/@…" },
  { key: "socialInstagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "socialRumble", label: "Rumble", placeholder: "https://rumble.com/c/…" },
];

const FLAG_KEYS: SettingKey[] = [
  "featureBreakingBar",
  "featureComments",
  "featureLikes",
  "featurePushAlerts",
  "featureDailyBrief",
];

export default function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  function set<K extends SettingKey>(key: K, value: SiteSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save(section: string, keys: SettingKey[]) {
    setSaving(section);
    const payload = Object.fromEntries(keys.map((key) => [key, values[key]])) as Partial<SiteSettings>;
    const result = await updateSettingsAction(payload);
    setSaving(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Saved.");
  }

  /** Flags save the moment they're flipped — a switch with a Save button reads as broken. */
  async function toggleFlag(key: SettingKey, next: boolean) {
    const previous = values[key];
    set(key, next as SiteSettings[typeof key]);
    const result = await updateSettingsAction({ [key]: next } as Partial<SiteSettings>);
    if (!result.success) {
      set(key, previous as SiteSettings[typeof key]);
      toast.error(result.error);
      return;
    }
    toast.success(next ? "Turned on." : "Turned off.");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>SEO defaults</CardTitle>
          <CardDescription>
            Used wherever a page or article has no title, description, or share image of its own.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultMetaTitle">Default title</Label>
            <Input
              id="defaultMetaTitle"
              value={values.defaultMetaTitle}
              onChange={(e) => set("defaultMetaTitle", e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="seoTitleSuffix">Title suffix</Label>
            <Input
              id="seoTitleSuffix"
              value={values.seoTitleSuffix}
              onChange={(e) => set("seoTitleSuffix", e.target.value)}
              maxLength={40}
            />
            <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
              Appended to every page title, e.g. &ldquo;Story headline{values.seoTitleSuffix}&rdquo;.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultMetaDescription">Default description</Label>
            <Textarea
              id="defaultMetaDescription"
              value={values.defaultMetaDescription}
              onChange={(e) => set("defaultMetaDescription", e.target.value)}
              rows={3}
              maxLength={300}
            />
            <p className="text-[11.5px] text-[var(--admin-fg-muted)]">
              {values.defaultMetaDescription.length} characters — aim for 120–160.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultShareImage">Default share image</Label>
            <Input
              id="defaultShareImage"
              value={values.defaultShareImage}
              onChange={(e) => set("defaultShareImage", e.target.value)}
              placeholder="/og-default.png"
            />
          </div>
          <Button
            className="self-start"
            onClick={() =>
              save("seo", ["defaultMetaTitle", "seoTitleSuffix", "defaultMetaDescription", "defaultShareImage"])
            }
            disabled={saving !== null}
          >
            {saving === "seo" && <Loader2 className="h-4 w-4 animate-spin" />}
            Save SEO defaults
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social accounts</CardTitle>
          <CardDescription>Leave any blank and it simply won&rsquo;t be shown.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={values[field.key] as string}
                onChange={(e) => set(field.key, e.target.value as SiteSettings[typeof field.key])}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <Button
            className="self-start"
            onClick={() => save("social", SOCIAL_FIELDS.map((f) => f.key))}
            disabled={saving !== null}
          >
            {saving === "social" && <Loader2 className="h-4 w-4 animate-spin" />}
            Save social accounts
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
          <CardDescription>Turn parts of the public site on or off. Takes effect immediately.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {FLAG_KEYS.map((key) => {
            const meta = FEATURE_FLAG_LABELS[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)] py-3 last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--admin-fg)]">{meta?.label ?? key}</div>
                  <div className="text-[12px] text-[var(--admin-fg-muted)]">{meta?.description}</div>
                </div>
                <Switch
                  checked={values[key] as boolean}
                  onCheckedChange={(next) => toggleFlag(key, next)}
                  aria-label={meta?.label ?? key}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
          <CardDescription>
            Signups are stored in this site&rsquo;s own subscriber list today. These fields hold the details for a
            mail provider once one is connected — nothing is sent from here yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newsletterProvider">Provider</Label>
            <Input
              id="newsletterProvider"
              value={values.newsletterProvider}
              onChange={(e) => set("newsletterProvider", e.target.value)}
              placeholder="Resend, Mailchimp, ConvertKit…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newsletterListId">List / audience ID</Label>
            <Input
              id="newsletterListId"
              value={values.newsletterListId}
              onChange={(e) => set("newsletterListId", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newsletterFromEmail">From address</Label>
            <Input
              id="newsletterFromEmail"
              type="email"
              value={values.newsletterFromEmail}
              onChange={(e) => set("newsletterFromEmail", e.target.value)}
              placeholder="news@stuccimedia.com"
            />
          </div>
          <Button
            className="self-start"
            onClick={() => save("newsletter", ["newsletterProvider", "newsletterListId", "newsletterFromEmail"])}
            disabled={saving !== null}
          >
            {saving === "newsletter" && <Loader2 className="h-4 w-4 animate-spin" />}
            Save newsletter settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Where contact messages and podcast pitches are emailed. Leave it empty and nothing is
            sent — every submission still lands in the admin inbox either way.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">Notification address</Label>
            <Input
              id="contactEmail"
              type="email"
              value={values.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              placeholder="rocci@stuccimedia.com"
            />
          </div>
          <Button
            className="self-start"
            onClick={() => save("inbox", ["contactEmail"])}
            disabled={saving !== null}
          >
            {saving === "inbox" && <Loader2 className="h-4 w-4 animate-spin" />}
            Save inbox settings
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
