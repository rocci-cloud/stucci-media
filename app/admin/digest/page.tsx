import { redirect } from "next/navigation";
import { requireAdminSession } from "../../lib/require-admin";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getTopArticlesThisWeek, getWeeklyDigestForUser, getReadersWithInterests } from "../../lib/digest";
import DigestPreview from "./DigestPreview";

type Props = {
  searchParams: Promise<{ user?: string }>;
};

export const dynamic = "force-dynamic";

// Content + preview only — see CLAUDE.md Phase 55: no email provider is
// wired up yet, so this can't actually send anything. It exists so the
// digest's real content/personalization logic (lib/digest.ts) can be
// reviewed and iterated on before that provider decision is made.
export default async function DigestPreviewPage({ searchParams }: Props) {
  // Admin-only. The /admin layout now admits editors and authors
  // too, so this section re-checks rather than relying on it.
  if (!(await requireAdminSession())) redirect("/admin");

  const { user: userId } = await searchParams;
  const [readers, articles] = await Promise.all([
    getReadersWithInterests(),
    userId ? getWeeklyDigestForUser(userId) : getTopArticlesThisWeek(),
  ]);

  const selectedReader = readers.find((r) => r.id === userId);

  return (
    <div className="max-w-[900px]">
      <h2 className="mb-2 text-lg font-semibold text-[var(--admin-fg)]">Weekly Digest</h2>
      <div className="mb-6 flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Email sending isn&rsquo;t connected yet — no email provider is configured for this project. This page
          previews the exact content a weekly digest would contain once one is set up.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-1">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--admin-fg-muted)]">
            Preview as
          </p>
          <Link
            href="/admin/digest"
            className={`rounded-md px-3 py-2 text-[13px] ${
              !userId ? "bg-[var(--admin-primary)]/10 font-medium text-[var(--admin-primary)]" : "text-[var(--admin-fg-muted)] hover:bg-[var(--admin-border)]/50"
            }`}
          >
            General (most-read this week)
          </Link>
          {readers.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-[var(--admin-fg-muted)]">
              No readers with reading history yet.
            </p>
          ) : (
            readers.map((reader) => (
              <Link
                key={reader.id}
                href={`/admin/digest?user=${reader.id}`}
                className={`truncate rounded-md px-3 py-2 text-[13px] ${
                  userId === reader.id
                    ? "bg-[var(--admin-primary)]/10 font-medium text-[var(--admin-primary)]"
                    : "text-[var(--admin-fg-muted)] hover:bg-[var(--admin-border)]/50"
                }`}
                title={reader.email}
              >
                {reader.name}
              </Link>
            ))
          )}
        </div>

        <DigestPreview
          recipientLabel={selectedReader ? `${selectedReader.name} <${selectedReader.email}>` : "General audience"}
          articles={articles}
        />
      </div>
    </div>
  );
}
