import type { Metadata, Viewport } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd, localBusinessSchema, SITE_URL } from "@/lib/seo";
import { site } from "@/content/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Gravel Driveway Grading & Repair in Durango, Colorado | Durango Driveway Grading",
    template: `%s | ${site.name}`,
  },
  description:
    "I help property owners in Durango, Bayfield, and surrounding La Plata County communities figure out why a gravel driveway is failing before I recommend what it needs. Drainage-first grading, drainage correction, and rural access maintenance.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    url: SITE_URL,
  },
  icons: {
    icon: [{ url: "/images/brand/ddg-logo-square.png", type: "image/png" }],
    apple: [{ url: "/images/brand/ddg-logo-square.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={localBusinessSchema()} />
      </body>
    </html>
  );
}
