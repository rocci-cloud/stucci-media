import Link from "next/link";
import { getAllSubscribers } from "../../lib/subscribers";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const subscribers = await getAllSubscribers();

  return (
    <main className="max-w-[900px] mx-auto px-5 py-10 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-[var(--color-gray)] hover:underline">
            ← Articles
          </Link>
          <h1 className="font-headline text-[28px] font-black mt-2">
            Subscribers <span className="text-[var(--color-gray)] font-normal">({subscribers.length})</span>
          </h1>
        </div>
        <a
          href="/api/admin/subscribers/export"
          className="bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-bold uppercase tracking-wide px-4 py-2.5 rounded-control"
        >
          Export CSV
        </a>
      </div>

      {subscribers.length === 0 ? (
        <p className="text-sm text-[var(--color-gray)]">No subscribers yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--color-hairline-strong)] text-left">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-hairline)]">
                <td className="py-3 pr-4">{s.email}</td>
                <td className="py-3 pr-4">
                  {new Date(s.subscribedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
