import { prisma } from "./prisma";

export type SubmissionKind = "GENERAL" | "PODCAST" | "FEATURE_ARTICLE";
export type SubmissionStatus = "NEW" | "REVIEWING" | "APPROVED" | "DECLINED" | "ARCHIVED";

export type Submission = {
  id: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  name: string;
  email: string;
  contact: string | null;
  subject: string | null;
  message: string;
  showName: string | null;
  feedUrl: string | null;
  importedPodcastId: string | null;
  adminNotes: string | null;
  createdAt: string;
};

export type SubmissionInput = {
  kind: SubmissionKind;
  name: string;
  email: string;
  contact?: string | null;
  subject?: string | null;
  message: string;
  showName?: string | null;
  feedUrl?: string | null;
};

type Row = {
  id: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  name: string;
  email: string;
  contact: string | null;
  subject: string | null;
  message: string;
  showName: string | null;
  feedUrl: string | null;
  importedPodcastId: string | null;
  adminNotes: string | null;
  createdAt: Date;
};

function mapRow(row: Row): Submission {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function createSubmission(input: SubmissionInput): Promise<Submission> {
  const row = await prisma.submission.create({
    data: {
      kind: input.kind,
      name: input.name,
      email: input.email,
      contact: input.contact ?? null,
      subject: input.subject ?? null,
      message: input.message,
      showName: input.showName ?? null,
      feedUrl: input.feedUrl ?? null,
    },
  });
  return mapRow(row);
}

export async function getSubmissions(filter?: {
  kind?: SubmissionKind;
  status?: SubmissionStatus;
}): Promise<Submission[]> {
  const rows = await prisma.submission.findMany({
    where: {
      ...(filter?.kind ? { kind: filter.kind } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return rows.map(mapRow);
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  const row = await prisma.submission.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}

/** Unread count for the admin nav badge. */
export async function getNewSubmissionCount(): Promise<number> {
  return prisma.submission.count({ where: { status: "NEW" } });
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  adminNotes?: string | null
): Promise<Submission> {
  const row = await prisma.submission.update({
    where: { id },
    data: { status, ...(adminNotes === undefined ? {} : { adminNotes }) },
  });
  return mapRow(row);
}

/** Records which show a pitch became, so it can't be imported twice. */
export async function markSubmissionImported(
  id: string,
  podcastId: string
): Promise<Submission> {
  const row = await prisma.submission.update({
    where: { id },
    data: { importedPodcastId: podcastId, status: "APPROVED" },
  });
  return mapRow(row);
}

export async function deleteSubmission(id: string): Promise<void> {
  await prisma.submission.delete({ where: { id } });
}

/**
 * How many submissions came from this email address in the last hour.
 *
 * A public form with no captcha needs some ceiling, and email is the only
 * stable identifier available here — a request IP behind Vercel's proxy is
 * both spoofable and shared. This won't stop a determined spammer with
 * throwaway addresses; it stops the accidental double-submit and the
 * unsophisticated flood, which is most of it.
 */
export async function countRecentFromEmail(email: string): Promise<number> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.submission.count({
    where: { email, createdAt: { gte: hourAgo } },
  });
}
