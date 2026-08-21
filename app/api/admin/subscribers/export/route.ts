import { NextResponse } from "next/server";
import { requireAdminSession } from "../../../../lib/require-admin";
import { getAllSubscribers, subscriberSourceLabel } from "../../../../lib/subscribers";

function toCsv(rows: { email: string; subscribedAt: string; source: string | null }[]) {
  const header = "email,subscribed_at,source";
  const lines = rows.map(
    (r) =>
      `${JSON.stringify(r.email)},${JSON.stringify(r.subscribedAt)},${JSON.stringify(
        subscriberSourceLabel(r.source),
      )}`,
  );
  return [header, ...lines].join("\n");
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await getAllSubscribers();
  const csv = toCsv(subscribers);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stucci-media-subscribers.csv"`,
    },
  });
}
