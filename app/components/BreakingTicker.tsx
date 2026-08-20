"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TickerItem = { slug: string; headline: string };

export default function BreakingTicker({ items }: { items: TickerItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, [items.length]);

  const current = items[index];
  if (!current) return null;

  return (
    <Link
      key={current.slug}
      href={`/articles/${current.slug}`}
      className="flex min-h-11 items-center text-white hover:underline animate-[fadein_0.4s_ease]"
    >
      <span className="truncate">{current.headline} →</span>
    </Link>
  );
}
