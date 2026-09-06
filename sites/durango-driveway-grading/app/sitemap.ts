import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { areas } from "@/content/areas";
import { projects } from "@/content/projects";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (p: string) => new URL(p, SITE_URL).toString();

  return [
    { url: url("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: url("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/how-i-evaluate-driveways"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/projects"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/service-areas"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: url("/request-consultation"), lastModified: now, changeFrequency: "yearly", priority: 0.9 },
    ...services.map((s) => ({
      url: url(`/services/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...areas.map((a) => ({
      url: url(`/service-areas/${a.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...projects.map((p) => ({
      url: url(`/projects/${p.slug}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    { url: url("/privacy-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
