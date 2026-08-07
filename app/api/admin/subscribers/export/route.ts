import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "../../../../lib/session";
import { getAllSubscribers } from "../../../../lib/subscribers";

function toCsv(rows: { email: string; subscribedAt: string }[]) {
  const header = "email,subscribed_at";
  const lines = rows.map((r) => `${JSON.stringify(r.email)},${JSON.stringify(r.subscribedAt)}`);
  return [header, ...lines].join("\n");
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) {
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
