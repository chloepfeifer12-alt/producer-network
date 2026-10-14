import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { brand } from "@/config/brand";
import { DemoBanner } from "@/components/layout/demo-banner";
import { StoreHydrator } from "@/components/providers/store-hydrator";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.heroSupporting,
  robots: { index: false, follow: false }, // prototype: keep out of search indexes
};

export const viewport: Viewport = { themeColor: "#faf8f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-12 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop">
          Skip to content
        </a>
        <StoreHydrator />
        <DemoBanner />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
