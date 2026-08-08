import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getActiveRedirect } from "../lib/redirects";

type Props = {
  params: Promise<{ path: string[] }>;
};

// Catch-all — Next.js only ever reaches this after every real static and
// dynamic route has already failed to match, which is exactly when a
// configured redirect should kick in. Resolved here (a normal server
// component, real Postgres access) rather than in proxy.ts's edge
// middleware, which can't reach the DB at all — see AGENTS.md/CLAUDE.md
// on the Neon HTTP-driver constraint.
export default async function CatchAllRedirect({ params }: Props) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;

  const match = await getActiveRedirect(pathname);
  if (!match) notFound();

  // 301/308 are permanent; 302/307 are temporary — permanentRedirect()
  // vs redirect() controls which the browser/crawler actually sees.
  if (match.statusCode === 301 || match.statusCode === 308) {
    permanentRedirect(match.toPath);
  }
  redirect(match.toPath);
}
