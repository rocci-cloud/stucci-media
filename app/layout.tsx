import type { Metadata } from "next";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
import "./globals.css";

const title = "Stucci Media — Independent News That Matters";
const description =
  "Independent news, analysis, and podcasts from Florida — the stories mainstream media won't run.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://stuccimedia.com"
  ),
  title: {
    default: title,
    template: "%s | Stucci Media",
  },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {children}
      </body>
    </html>
  );
}
