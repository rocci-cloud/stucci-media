import { prisma } from "./prisma";

export type Redirect = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RedirectInput = {
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
};

function mapRow(row: {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Redirect {
  return {
    id: row.id,
    fromPath: row.fromPath,
    toPath: row.toPath,
    statusCode: row.statusCode,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// The one query the public catch-all route uses — see
// app/[...path]/page.tsx. `fromPath` is stored/looked-up normalized
// (leading slash, no trailing slash) so admin-entered variations still
// match.
export async function getActiveRedirect(fromPath: string): Promise<Redirect | undefined> {
  const row = await prisma.redirect.findFirst({ where: { fromPath, isActive: true } });
  return row ? mapRow(row) : undefined;
}

export async function getAllRedirects(): Promise<Redirect[]> {
  const rows = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapRow);
}

export async function createRedirect(input: RedirectInput): Promise<Redirect> {
  const row = await prisma.redirect.create({ data: input });
  return mapRow(row);
}

export async function updateRedirect(id: string, input: RedirectInput): Promise<Redirect> {
  const row = await prisma.redirect.update({ where: { id }, data: input });
  return mapRow(row);
}

export async function deleteRedirect(id: string): Promise<void> {
  await prisma.redirect.delete({ where: { id } });
}

// Normalizes a path an admin might type in any number of equivalent
// forms ("/old-page", "old-page", "/old-page/", a full URL pasted by
// mistake) into the bare "/old-page" shape both storage and lookup use.
export function normalizePath(input: string): string {
  let path = input.trim();
  try {
    if (/^https?:\/\//i.test(path)) {
      path = new URL(path).pathname;
    }
  } catch {
    // not a valid absolute URL — fall through and treat as a raw path
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}
