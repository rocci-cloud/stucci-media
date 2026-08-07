import Link from "next/link";
import { getAllArticlesAdmin } from "../lib/articles";
import SignOutButton from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const articles = await getAllArticlesAdmin();

  return (
    <main className="max-w-[900px] mx-auto px-5 py-10 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-[28px] font-black">Articles</h1>
        <div className="flex items-center gap-5">
          <Link href="/admin/subscribers" className="text-sm font-bold uppercase text-[var(--color-gray)] hover:text-[var(--color-text)]">
            Subscribers
          </Link>
          <Link
            href="/admin/articles/new"
            className="bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-bold uppercase tracking-wide px-4 py-2.5 rounded-control"
          >
            New Article
          </Link>
          <SignOutButton />
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-[var(--color-gray)]">No articles yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--color-hairline-strong)] text-left">
              <th className="py-2 pr-4">Headline</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Updated</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b border-[var(--color-hairline)]">
                <td className="py-3 pr-4">{a.headline}</td>
                <td className="py-3 pr-4">{a.category}</td>
                <td className="py-3 pr-4 capitalize">{a.status}</td>
                <td className="py-3 pr-4">{a.date}</td>
                <td className="py-3">
                  <Link
                    href={`/admin/articles/${a.id}/edit`}
                    className="text-[var(--color-red)] hover:underline font-bold"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
