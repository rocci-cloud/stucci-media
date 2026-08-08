import { prisma } from "./prisma";
import type { Banner as PrismaBanner, BannerPlacement as PrismaBannerPlacement } from "@prisma/client";
import { BANNER_PLACEMENT_LABELS, type BannerPlacement } from "./banner-placements";

// Re-exported for server-side callers that already import everything
// banner-related from this one module — client components should import
// these two directly from ./banner-placements instead (see that file's
// comment for why).
export { BANNER_PLACEMENT_LABELS };
export type { BannerPlacement };

export type Banner = {
  id: string;
  name: string | null;
  imageUrl: string;
  destinationUrl: string;
  placement: BannerPlacement;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BannerInput = {
  name: string | null;
  imageUrl: string;
  destinationUrl: string;
  placement: BannerPlacement;
  isActive: boolean;
  startDate: string | null; // ISO string, or null for no start bound
  endDate: string | null; // ISO string, or null for no end bound
  sortOrder: number;
};

function mapRow(row: PrismaBanner): Banner {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    destinationUrl: row.destinationUrl,
    placement: row.placement as BannerPlacement,
    isActive: row.isActive,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// --- Public read: the only query the frontend slot components use ---

// Active, within its optional date window, for one placement — ordered so
// the admin's sortOrder (lower first) decides display order, with
// createdAt as a stable tiebreaker. No caching/complexity beyond a plain
// indexed query; Next's page-level revalidate handles freshness.
export async function getActiveBanners(placement: BannerPlacement): Promise<Banner[]> {
  const now = new Date();
  const rows = await prisma.banner.findMany({
    where: {
      placement: placement as PrismaBannerPlacement,
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapRow);
}

// --- Admin: full CRUD ---

export async function getAllBannersAdmin(): Promise<Banner[]> {
  const rows = await prisma.banner.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(mapRow);
}

export async function getBannerById(id: string): Promise<Banner | undefined> {
  const row = await prisma.banner.findUnique({ where: { id } });
  return row ? mapRow(row) : undefined;
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  const row = await prisma.banner.create({
    data: {
      name: input.name,
      imageUrl: input.imageUrl,
      destinationUrl: input.destinationUrl,
      placement: input.placement as PrismaBannerPlacement,
      isActive: input.isActive,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      sortOrder: input.sortOrder,
    },
  });
  return mapRow(row);
}

export async function updateBanner(id: string, input: BannerInput): Promise<Banner> {
  const row = await prisma.banner.update({
    where: { id },
    data: {
      name: input.name,
      imageUrl: input.imageUrl,
      destinationUrl: input.destinationUrl,
      placement: input.placement as PrismaBannerPlacement,
      isActive: input.isActive,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      sortOrder: input.sortOrder,
    },
  });
  return mapRow(row);
}

export async function setBannerActive(id: string, isActive: boolean): Promise<Banner> {
  const row = await prisma.banner.update({ where: { id }, data: { isActive } });
  return mapRow(row);
}

export async function deleteBanner(id: string): Promise<void> {
  await prisma.banner.delete({ where: { id } });
}
