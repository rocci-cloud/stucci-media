import { sql } from "./db";

export type Subscriber = {
  id: number;
  email: string;
  subscribedAt: string;
};

type SubscriberRow = {
  id: number;
  email: string;
  subscribed_at: string;
};

function mapRow(row: SubscriberRow): Subscriber {
  return { id: row.id, email: row.email, subscribedAt: row.subscribed_at };
}

// Returns true if a new subscriber was added, false if the email was
// already on the list (not treated as an error — just a silent no-op).
export async function addSubscriber(email: string): Promise<boolean> {
  const rows = (await sql`
    insert into subscribers (email)
    values (${email})
    on conflict (email) do nothing
    returning id
  `) as { id: number }[];
  return rows.length > 0;
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const rows = (await sql`
    select * from subscribers order by subscribed_at desc
  `) as SubscriberRow[];
  return rows.map(mapRow);
}
