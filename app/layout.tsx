import type { Metadata } from "next";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/700.css";
import "@fontsource/source-serif-4/900.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://stuccimedia.com"
  ),
  title: {
    default: "Stucci Media — Independent News That Matters",
    template: "%s | Stucci Media",
  },
  description:
    "Independent news, analysis, and podcasts from Hammond, WI — the stories mainstream media won't run.",
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
