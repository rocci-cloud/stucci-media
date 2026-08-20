import { redirect } from "next/navigation";
import { requireAdminSession } from "../../lib/require-admin";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getTopArticlesThisWeek, getWeeklyDigestForUser, getReadersWithInterests } from "../../lib/digest";
import { getAllSubscribers } from "../../lib/subscribers";
import { isEmailConfigured } from "../../lib/email";
import DigestPreview from "./DigestPreview";
import SendDigest from "./SendDigest";

type Props = {
  searchParams: Promise<{ user?: string }>;
};

export const dynamic = "force-dynamic";

// Preview plus a real send. Sending is gated on RESEND_API_KEY being set —
// without it the controls stay disabled and say so, rather than appearing to
// work and silently doing nothing.
export default async function DigestPreviewPage({ searchParams }: Props) {
  // Admin-only. The /admin layout now admits editors and authors
  // too, so this section re-checks rather than relying on it.
  if (!(await requireAdminSession())) redirect("/admin");

  const session = await requireAdminSession();
  const { user: userId } = await searchParams;
  const [readers, articles, subscribers] = await Promise.all([
    getReadersWithInterests(),
    userId ? getWeeklyDigestForUser(userId) : getTopArticlesThisWeek(),
    getAllSubscribers(),
  ]);

  const selectedReader = readers.find((r) => r.id === userId);
  const configured = isEmailConfigured();

  return (
    <div className="max-w-[900px]">
      <h2 className="mb-2 text-lg font-semibold text-[var(--admin-fg)]">Weekly Digest</h2>
      {!configured && (
        <div className="mb-6 flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Sending is turned off because no email provider is configured. Set{" "}
            <code className="font-mono">RESEND_API_KEY</code> and{" "}
            <code className="font-mono">EMAIL_FROM</code> in the deployment&rsquo;s environment
            variables to enable it. The preview below is the exact content that would be sent.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
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

          <div className="mt-4">
            <SendDigest
              configured={configured}
              subscriberCount={subscribers.length}
              defaultTestEmail={session?.user.email ?? ""}
            />
          </div>
        </div>

        <DigestPreview
          recipientLabel={selectedReader ? `${selectedReader.name} <${selectedReader.email}>` : "General audience"}
          articles={articles}
        />
      </div>
    </div>
  );
}
