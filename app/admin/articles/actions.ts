"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  createArticle,
  duplicateArticle,
  restoreArticle,
  purgeArticle,
  emptyArticleTrash,
  bulkRestoreArticles,
  toggleArticleBreaking,
  bulkSetArticleBreaking,
  type ArticleStatusValue,
  updateArticle,
  deleteArticle,
  getArticleByIdAdmin,
  toggleArticleFeatured,
  updateArticleCategories,
  bulkSetArticleStatus,
  bulkSetArticleFeatured,
  bulkUpdateArticleCategories,
  bulkDeleteArticles,
  type ArticleInput,
} from "../../lib/articles";
import { getCategories } from "../../lib/categories";
import { bodyInputToHtml } from "../../lib/sanitize";
import { requireStaffSession, requirePublisherSession } from "../../lib/require-admin";
import { canEditArticle, canPublish } from "../../lib/permissions";
import { recordRevision, getRevision, diffLines, type DiffLine } from "../../lib/revisions";
import { logActivity } from "../../lib/activity";
import { addLiveBlogEntry, deleteLiveBlogEntry, getLiveBlogEntryPreview } from "../../lib/live-blog";
import { sendPushToAllSubscribers } from "../../lib/push";

export type ArticleFormState = { error?: string };

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

const MAX_LENGTHS = {
  slug: 100,
  headline: 200,
  dek: 400,
  author: 100,
  seoTitle: 70,
  seoDescription: 200,
  seoKeywords: 300,
  bulletPoint: 160,
  comparisonTitle: 120,
  comparisonBody: 600,
  comparisonSourceLabel: 80,
} as const;

const URL_RE = /^https?:\/\/.+/i;

const MAX_SOCIAL_NOTES = 1000;

const STATUS_VALUES: ArticleStatusValue[] = ["draft", "in_review", "published", "archived"];

// Anything unrecognized falls back to draft rather than throwing: a
// hand-crafted POST shouldn't be able to 500 the action, and draft is the
// safe default (nothing goes live by accident).
function parseStatus(raw: FormDataEntryValue | null): ArticleStatusValue {
  const value = String(raw ?? "");
  return (STATUS_VALUES as string[]).includes(value) ? (value as ArticleStatusValue) : "draft";
}

async function parseInput(formData: FormData): Promise<ArticleInput | { error: string }> {
  const slug = String(formData.get("slug") || "").trim();
  const categorySlugs = formData.getAll("categorySlugs").map(String).filter(Boolean);
  const headline = String(formData.get("headline") || "").trim();
  const dek = String(formData.get("dek") || "").trim();
  const author = String(formData.get("author") || "").trim() || "Rocci Stucci";
  const rawBody = String(formData.get("body") || "").trim();
  const coverImageUrl = String(formData.get("coverImageUrl") || "").trim() || null;
  const status = parseStatus(formData.get("status"));
  const isFeatured = formData.get("isFeatured") === "true";
  const isBreaking = formData.get("isBreaking") === "true";
  const isLiveBlog = formData.get("isLiveBlog") === "true";
  const socialNotes = String(formData.get("socialNotes") || "").trim() || null;
  const seoTitle = String(formData.get("seoTitle") || "").trim() || null;
  const seoDescription = String(formData.get("seoDescription") || "").trim() || null;
  const seoKeywords = String(formData.get("seoKeywords") || "").trim() || null;
  const ogImage = String(formData.get("ogImage") || "").trim() || null;
  const canonicalUrl = String(formData.get("canonicalUrl") || "").trim() || null;
  const publishedAt = String(formData.get("publishedAt") || "").trim() || null;
  const tags = parseTags(String(formData.get("tags") || ""));
  const isExclusive = formData.get("isExclusive") === "true";
  const bulletPoints = parseBulletPoints(String(formData.get("bulletPoints") || ""));
  const comparisonTitle = String(formData.get("comparisonTitle") || "").trim() || null;
  const comparisonBody = String(formData.get("comparisonBody") || "").trim() || null;
  const comparisonSourceLabel = String(formData.get("comparisonSourceLabel") || "").trim() || null;
  const comparisonSourceUrl = String(formData.get("comparisonSourceUrl") || "").trim() || null;

  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-article-title)." };
  }
  if (slug.length > MAX_LENGTHS.slug) return { error: `Slug must be ${MAX_LENGTHS.slug} characters or fewer.` };
  if (categorySlugs.length === 0) {
    return { error: "Choose at least one category." };
  }
  const categories = await getCategories();
  const validSlugs = new Set(categories.map((c) => c.slug));
  if (!categorySlugs.every((s) => validSlugs.has(s))) {
    return { error: "One or more selected categories no longer exist." };
  }
  if (!headline) return { error: "Headline is required." };
  if (headline.length > MAX_LENGTHS.headline) {
    return { error: `Headline must be ${MAX_LENGTHS.headline} characters or fewer.` };
  }
  if (!dek) return { error: "Dek is required." };
  if (dek.length > MAX_LENGTHS.dek) return { error: `Dek must be ${MAX_LENGTHS.dek} characters or fewer.` };
  if (author.length > MAX_LENGTHS.author) {
    return { error: `Author name must be ${MAX_LENGTHS.author} characters or fewer.` };
  }
  if (!rawBody) return { error: "Body is required." };
  if (seoTitle && seoTitle.length > MAX_LENGTHS.seoTitle) {
    return { error: `SEO title must be ${MAX_LENGTHS.seoTitle} characters or fewer.` };
  }
  if (seoDescription && seoDescription.length > MAX_LENGTHS.seoDescription) {
    return { error: `SEO description must be ${MAX_LENGTHS.seoDescription} characters or fewer.` };
  }
  if (seoKeywords && seoKeywords.length > MAX_LENGTHS.seoKeywords) {
    return { error: `SEO keywords must be ${MAX_LENGTHS.seoKeywords} characters or fewer.` };
  }
  if (canonicalUrl && !URL_RE.test(canonicalUrl)) {
    return { error: "Canonical URL must start with http:// or https://." };
  }
  if (bulletPoints.some((b) => b.length > MAX_LENGTHS.bulletPoint)) {
    return { error: `Each bullet point must be ${MAX_LENGTHS.bulletPoint} characters or fewer.` };
  }
  if (comparisonTitle && comparisonTitle.length > MAX_LENGTHS.comparisonTitle) {
    return { error: `Comparison title must be ${MAX_LENGTHS.comparisonTitle} characters or fewer.` };
  }
  if (comparisonBody && comparisonBody.length > MAX_LENGTHS.comparisonBody) {
    return { error: `Comparison text must be ${MAX_LENGTHS.comparisonBody} characters or fewer.` };
  }
  if (comparisonSourceLabel && comparisonSourceLabel.length > MAX_LENGTHS.comparisonSourceLabel) {
    return { error: `Comparison source label must be ${MAX_LENGTHS.comparisonSourceLabel} characters or fewer.` };
  }
  if (comparisonSourceUrl && !URL_RE.test(comparisonSourceUrl)) {
    return { error: "Comparison source URL must start with http:// or https://." };
  }
  if (socialNotes && socialNotes.length > MAX_SOCIAL_NOTES) {
    return { error: `Social notes must be ${MAX_SOCIAL_NOTES} characters or fewer.` };
  }

  const bodyHtml = bodyInputToHtml(rawBody);

  return {
    slug,
    categorySlugs,
    headline,
    dek,
    author,
    bodyHtml,
    coverImageUrl,
    status,
    isFeatured,
    isExclusive,
    isBreaking,
    isLiveBlog,
    socialNotes,
    tags,
    bulletPoints,
    comparisonTitle,
    comparisonBody,
    comparisonSourceLabel,
    comparisonSourceUrl,
    seoTitle,
    seoDescription,
    seoKeywords,
    ogImage,
    canonicalUrl,
    publishedAt,
  };
}

const MAX_BULLET_POINTS = 4;

// One bullet per line from the admin's textarea, trimmed, blank lines
// dropped, capped at MAX_BULLET_POINTS — the "Bottom Line Up Front" box
// is meant to stay scannable, not become a second body.
function parseBulletPoints(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_BULLET_POINTS);
}

const MAX_TAGS = 15;
const MAX_TAG_LENGTH = 40;

// Accepts a comma-separated string from the form (however the admin typed
// it — with or without leading "#", mixed case, extra whitespace) and
// normalizes to a clean, deduped, lowercase list for storage.
function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(",")) {
    const tag = part.trim().replace(/^#/, "").toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

// Fire-and-forget — never awaited by the caller (a slow/failed push send
// must never delay redirecting the admin back to the articles list).
// Skips scheduled articles (isScheduled true means publishedAt is still in
// the future — nothing is actually live yet) and no-ops entirely when
// VAPID isn't configured (see lib/push.ts).
function notifyOnPublish(article: { status: ArticleStatusValue; isScheduled: boolean; headline: string; dek: string; slug: string }) {
  if (article.status !== "published" || article.isScheduled) return;
  sendPushToAllSubscribers({
    title: article.headline,
    body: article.dek,
    url: `${SITE_URL}/articles/${article.slug}`,
  }).catch(() => {});
}

export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const session = await requireStaffSession();
  if (!session) return { error: "You must be signed in as staff to do that." };

  const input = await parseInput(formData);
  if ("error" in input) return input;

  // An author can write and submit, but can't put anything live. Enforced
  // here rather than only by hiding the option in the UI: server actions
  // are independently reachable once deployed.
  if (!canPublish(session.user.role) && (input.status === "published" || input.status === "archived")) {
    return { error: "Authors can't publish directly — save it as In Review and an editor will take it from there." };
  }

  let created;
  try {
    created = await createArticle({ ...input, authorId: session.user.id });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Slug "${input.slug}" is already in use.` };
    }
    return { error: "Something went wrong saving the article." };
  }

  await logActivity({ actor: session.user, action: "article.created", targetType: "article", targetLabel: input.headline });
  await recordRevision({
    articleId: created.id,
    headline: created.headline,
    dek: created.dek,
    body: created.bodyHtml,
    authorName: session.user.name,
    authorEmail: session.user.email,
    note: "Created",
  }).catch(() => {});
  notifyOnPublish(created);
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function updateArticleAction(
  id: number,
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const session = await requireStaffSession();
  if (!session) return { error: "You must be signed in as staff to do that." };

  const input = await parseInput(formData);
  if ("error" in input) return input;

  const before = await getArticleByIdAdmin(id);
  if (!before) return { error: "That article no longer exists." };
  if (!canEditArticle(session.user.role, session.user.id, before.authorId)) {
    return { error: "You can only edit articles you wrote." };
  }
  if (!canPublish(session.user.role) && (input.status === "published" || input.status === "archived")) {
    return { error: "Authors can't publish directly — save it as In Review and an editor will take it from there." };
  }

  let updated;
  try {
    updated = await updateArticle(id, input);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Slug "${input.slug}" is already in use.` };
    }
    return { error: "Something went wrong saving the article." };
  }

  await logActivity({ actor: session.user, action: "article.updated", targetType: "article", targetLabel: input.headline });
  await recordRevision({
    articleId: id,
    headline: updated.headline,
    dek: updated.dek,
    body: updated.bodyHtml,
    authorName: session.user.name,
    authorEmail: session.user.email,
  }).catch(() => {});
  // Only a genuine draft → published transition triggers a push — saving
  // an already-published article again (a typo fix, a re-categorize)
  // shouldn't re-notify every subscriber.
  if (before?.status !== "published") notifyOnPublish(updated);
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function deleteArticleAction(id: number) {
  const session = await requireStaffSession();
  if (!session) redirect("/login?from=/admin/articles");
  const article = await getArticleByIdAdmin(id);
  await deleteArticle(id);
  await logActivity({
    actor: session.user,
    action: "article.deleted",
    targetType: "article",
    targetLabel: article?.headline ?? `#${id}`,
  });
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

// --- Row-level / bulk actions from the Articles list — no redirect, so the
// client can update in place (optimistic) and stay on the list. ---

export type ActionResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED: ActionResult = { success: false, error: "You must be signed in as staff to do that." };
const FORBIDDEN: ActionResult = { success: false, error: "You do not have permission to change this article." };

export async function deleteArticleFromListAction(id: number): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  try {
    const article = await getArticleByIdAdmin(id);
    await deleteArticle(id);
    await logActivity({
      actor: session.user,
      action: "article.deleted",
      targetType: "article",
      targetLabel: article?.headline ?? `#${id}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the article." };
  }
}

export async function toggleFeaturedAction(id: number, isFeatured: boolean): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  try {
    await toggleArticleFeatured(id, isFeatured);
    const article = await getArticleByIdAdmin(id);
    await logActivity({
      actor: session.user,
      action: isFeatured ? "article.featured" : "article.unfeatured",
      targetType: "article",
      targetLabel: article?.headline ?? `#${id}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update featured status." };
  }
}

export async function updateArticleCategoriesAction(
  id: number,
  categorySlugs: string[]
): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  if (categorySlugs.length === 0) {
    return { success: false, error: "An article needs at least one category." };
  }
  try {
    await updateArticleCategories(id, categorySlugs);
    const article = await getArticleByIdAdmin(id);
    await logActivity({
      actor: session.user,
      action: "article.recategorized",
      targetType: "article",
      targetLabel: article?.headline ?? `#${id}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update categories." };
  }
}

export async function bulkSetStatusAction(
  ids: number[],
  status: ArticleStatusValue
): Promise<ActionResult> {
  // Publishing or archiving in bulk is a publisher action; an author
  // moving their own drafts to review is not, so the gate is on the
  // destination status rather than the operation.
  const session =
    status === "published" || status === "archived"
      ? await requirePublisherSession()
      : await requireStaffSession();
  if (!session) return status === "published" || status === "archived" ? FORBIDDEN : UNAUTHORIZED;
  try {
    await bulkSetArticleStatus(ids, status);
    await logActivity({
      actor: session.user,
      action: `article.bulk_${status}`,
      targetType: "article",
      targetLabel: `${ids.length} article${ids.length === 1 ? "" : "s"}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong updating those articles." };
  }
}

export async function bulkDeleteAction(ids: number[]): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  try {
    await bulkDeleteArticles(ids);
    await logActivity({
      actor: session.user,
      action: "article.bulk_deleted",
      targetType: "article",
      targetLabel: `${ids.length} article${ids.length === 1 ? "" : "s"}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting those articles." };
  }
}

export async function bulkSetFeaturedAction(ids: number[], isFeatured: boolean): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  try {
    await bulkSetArticleFeatured(ids, isFeatured);
    await logActivity({
      actor: session.user,
      action: isFeatured ? "article.bulk_featured" : "article.bulk_unfeatured",
      targetType: "article",
      targetLabel: `${ids.length} article${ids.length === 1 ? "" : "s"}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong updating those articles." };
  }
}

// --- Live blog entries (see lib/live-blog.ts) — managed independently of
// the main article form, since an entry is its own timestamped, append-
// only record rather than a field the big Save button submits. ---

const MAX_LIVE_BLOG_HEADLINE = 120;
const MAX_LIVE_BLOG_BODY = 2000;

export async function addLiveBlogEntryAction(
  articleId: number,
  headline: string,
  body: string
): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  const trimmedBody = body.trim();
  if (!trimmedBody) return { success: false, error: "Entry text is required." };
  if (trimmedBody.length > MAX_LIVE_BLOG_BODY) {
    return { success: false, error: `Entry must be ${MAX_LIVE_BLOG_BODY} characters or fewer.` };
  }
  const trimmedHeadline = headline.trim().slice(0, MAX_LIVE_BLOG_HEADLINE) || null;
  try {
    await addLiveBlogEntry(articleId, { headline: trimmedHeadline, bodyHtml: bodyInputToHtml(trimmedBody) });
    const article = await getArticleByIdAdmin(articleId);
    await logActivity({
      actor: session.user,
      action: "live_blog.entry_added",
      targetType: "article",
      targetLabel: article?.headline ?? `#${articleId}`,
    });
    revalidatePath("/", "layout");
    revalidatePath(`/admin/articles/${articleId}/edit`);
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't add that update." };
  }
}

export async function deleteLiveBlogEntryAction(entryId: string, articleId: number): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  try {
    const preview = await getLiveBlogEntryPreview(entryId);
    await deleteLiveBlogEntry(entryId);
    const article = await getArticleByIdAdmin(articleId);
    await logActivity({
      actor: session.user,
      action: "live_blog.entry_deleted",
      targetType: "article",
      targetLabel: `${article?.headline ?? `#${articleId}`} — ${preview ?? entryId}`,
    });
    revalidatePath("/", "layout");
    revalidatePath(`/admin/articles/${articleId}/edit`);
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that update." };
  }
}

export async function bulkSetCategoriesAction(ids: number[], categorySlugs: string[]): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  if (categorySlugs.length === 0) {
    return { success: false, error: "Choose at least one category." };
  }
  try {
    await bulkUpdateArticleCategories(ids, categorySlugs);
    await logActivity({
      actor: session.user,
      action: "article.bulk_recategorized",
      targetType: "article",
      targetLabel: `${ids.length} article${ids.length === 1 ? "" : "s"}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong updating those categories." };
  }
}

// --- Trash, duplication, and revisions ---

/**
 * Delete/restore/purge all share one ownership rule: an author may bin
 * their own drafts, but only a publisher may touch anyone else's work.
 * Returns the loaded article so callers don't re-fetch it.
 */
type EditableResult =
  | { ok: true; article: NonNullable<Awaited<ReturnType<typeof getArticleByIdAdmin>>> }
  | { ok: false; error: string };

async function loadEditable(
  id: number,
  session: { user: { id: string; role?: string | null } }
): Promise<EditableResult> {
  const article = await getArticleByIdAdmin(id);
  if (!article) return { ok: false, error: "That article no longer exists." };
  if (!canEditArticle(session.user.role, session.user.id, article.authorId)) {
    return { ok: false, error: "You do not have permission to change this article." };
  }
  return { ok: true, article };
}

export async function restoreArticleAction(id: number): Promise<ActionResult> {
  const session = await requirePublisherSession();
  if (!session) return FORBIDDEN;
  try {
    const article = await getArticleByIdAdmin(id);
    await restoreArticle(id);
    await logActivity({
      actor: session.user,
      action: "article.restored",
      targetType: "article",
      targetLabel: article?.headline ?? `#${id}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't restore that article." };
  }
}

export async function bulkRestoreArticlesAction(ids: number[]): Promise<ActionResult> {
  const session = await requirePublisherSession();
  if (!session) return FORBIDDEN;
  try {
    await bulkRestoreArticles(ids);
    await logActivity({
      actor: session.user,
      action: "article.bulk_restored",
      targetType: "article",
      targetLabel: `${ids.length} article${ids.length === 1 ? "" : "s"}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't restore those articles." };
  }
}

/** Irreversible — only from the trash screen, and only for an admin/editor. */
export async function purgeArticleAction(id: number): Promise<ActionResult> {
  const session = await requirePublisherSession();
  if (!session) return FORBIDDEN;
  try {
    const article = await getArticleByIdAdmin(id);
    await purgeArticle(id);
    await logActivity({
      actor: session.user,
      action: "article.purged",
      targetType: "article",
      targetLabel: article?.headline ?? `#${id}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't permanently delete that article." };
  }
}

export async function emptyTrashAction(): Promise<ActionResult> {
  const session = await requirePublisherSession();
  if (!session) return FORBIDDEN;
  try {
    const count = await emptyArticleTrash();
    await logActivity({
      actor: session.user,
      action: "article.trash_emptied",
      targetType: "article",
      targetLabel: `${count} article${count === 1 ? "" : "s"}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't empty the trash." };
  }
}

export type DuplicateResult = { success: true; id: number } | { success: false; error: string };

export async function duplicateArticleAction(id: number): Promise<DuplicateResult> {
  const session = await requireStaffSession();
  if (!session) return { success: false, error: "You must be signed in as staff to do that." };
  try {
    const copy = await duplicateArticle(id, session.user.id);
    await logActivity({
      actor: session.user,
      action: "article.duplicated",
      targetType: "article",
      targetLabel: copy.headline,
    });
    revalidatePath("/admin/articles");
    return { success: true, id: copy.id };
  } catch {
    return { success: false, error: "Couldn't duplicate that article." };
  }
}

export async function toggleBreakingAction(id: number, isBreaking: boolean): Promise<ActionResult> {
  const session = await requirePublisherSession();
  if (!session) return FORBIDDEN;
  try {
    await toggleArticleBreaking(id, isBreaking);
    const article = await getArticleByIdAdmin(id);
    await logActivity({
      actor: session.user,
      action: isBreaking ? "article.marked_breaking" : "article.unmarked_breaking",
      targetType: "article",
      targetLabel: article?.headline ?? `#${id}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update breaking status." };
  }
}

export async function bulkSetBreakingAction(ids: number[], isBreaking: boolean): Promise<ActionResult> {
  const session = await requirePublisherSession();
  if (!session) return FORBIDDEN;
  try {
    await bulkSetArticleBreaking(ids, isBreaking);
    await logActivity({
      actor: session.user,
      action: isBreaking ? "article.bulk_marked_breaking" : "article.bulk_unmarked_breaking",
      targetType: "article",
      targetLabel: `${ids.length} article${ids.length === 1 ? "" : "s"}`,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong updating those articles." };
  }
}

export type AutosaveResult = { success: true; savedAt: string } | { success: false; error: string };

/**
 * Periodic content-only checkpoint from the editor. Deliberately writes
 * ONLY to the revision history and never to the article row itself: an
 * autosave must never publish a change the writer hasn't committed to, and
 * a half-finished sentence must never reach the live site. Recovery is
 * "restore this revision", which is an explicit act.
 */
export async function autosaveArticleAction(
  id: number,
  content: { headline: string; dek: string; body: string }
): Promise<AutosaveResult> {
  const session = await requireStaffSession();
  if (!session) return { success: false, error: "You must be signed in as staff to do that." };

  const loaded = await loadEditable(id, session);
  if (!loaded.ok) return { success: false, error: loaded.error };

  try {
    await recordRevision({
      articleId: id,
      headline: content.headline,
      dek: content.dek,
      body: bodyInputToHtml(content.body),
      authorName: session.user.name,
      authorEmail: session.user.email,
      isAutosave: true,
    });
    return { success: true, savedAt: new Date().toISOString() };
  } catch {
    return { success: false, error: "Autosave failed." };
  }
}

export async function restoreRevisionAction(articleId: number, revisionId: string): Promise<ActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;

  const loaded = await loadEditable(articleId, session);
  if (!loaded.ok) return { success: false, error: loaded.error };

  const revision = await getRevision(revisionId);
  if (!revision || revision.articleId !== articleId) {
    return { success: false, error: "That revision doesn't belong to this article." };
  }

  try {
    // Snapshot the current state first, so "restore" is itself undoable
    // rather than silently discarding whatever was there.
    await recordRevision({
      articleId,
      headline: loaded.article.headline,
      dek: loaded.article.dek,
      body: loaded.article.bodyHtml,
      authorName: session.user.name,
      authorEmail: session.user.email,
      note: "Before restore",
    });

    await updateArticle(articleId, {
      ...toInput(loaded.article),
      headline: revision.headline,
      dek: revision.dek,
      bodyHtml: revision.body,
    });

    await logActivity({
      actor: session.user,
      action: "article.revision_restored",
      targetType: "article",
      targetLabel: loaded.article.headline,
    });
    revalidatePath("/", "layout");
    revalidatePath(`/admin/articles/${articleId}/edit`);
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't restore that revision." };
  }
}

/** Article → the ArticleInput shape, for edits that only change a few fields. */
function toInput(article: Awaited<ReturnType<typeof getArticleByIdAdmin>> & object): ArticleInput {
  return {
    slug: article.slug,
    categorySlugs: article.categorySlugs,
    headline: article.headline,
    dek: article.dek,
    author: article.author,
    bodyHtml: article.bodyHtml,
    coverImageUrl: article.coverImageUrl,
    status: article.status,
    isFeatured: article.isFeatured,
    isExclusive: article.isExclusive,
    isBreaking: article.isBreaking,
    isLiveBlog: article.isLiveBlog,
    socialNotes: article.socialNotes,
    tags: article.tags,
    bulletPoints: article.bulletPoints,
    comparisonTitle: article.comparisonTitle,
    comparisonBody: article.comparisonBody,
    comparisonSourceLabel: article.comparisonSourceLabel,
    comparisonSourceUrl: article.comparisonSourceUrl,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    seoKeywords: article.seoKeywords,
    ogImage: article.ogImage,
    canonicalUrl: article.canonicalUrl,
    publishedAt: article.publishedAt,
  };
}

export type DiffResult = { success: true; diff: DiffLine[] } | { success: false; error: string };

/**
 * Diffs a stored revision against the article's current content. Computed
 * server-side rather than in the browser so the full body text of every
 * revision never has to be shipped to the client just to render a diff.
 */
export async function diffRevisionAction(articleId: number, revisionId: string): Promise<DiffResult> {
  const session = await requireStaffSession();
  if (!session) return { success: false, error: "You must be signed in as staff to do that." };

  const loaded = await loadEditable(articleId, session);
  if (!loaded.ok) return { success: false, error: loaded.error };

  const revision = await getRevision(revisionId);
  if (!revision || revision.articleId !== articleId) {
    return { success: false, error: "That revision doesn't belong to this article." };
  }

  return { success: true, diff: diffLines(revision.body, loaded.article.bodyHtml) };
}
