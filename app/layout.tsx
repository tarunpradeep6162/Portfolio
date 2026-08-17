import type { Metadata } from "next";
import { SkipLink } from "@/components/layout/SkipLink";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { CompanionRoot } from "@/components/companion/CompanionRoot";
import { ExperienceProvider } from "@/lib/v6/ExperienceProvider";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { CustomCursor } from "@/components/shared/CustomCursor";
import { AnalyticsTracker } from "@/components/shared/AnalyticsTracker";
import { Canvas3D } from "@/components/shared/Canvas3D";
import { AudioToggle } from "@/components/shared/AudioToggle";
import { SoundDesign } from "@/components/shared/SoundDesign";
import { ScrollAnimationsRoot } from "@/components/shared/ScrollAnimationsRoot";
import { site } from "@/content/site";
import { personJsonLd } from "@/lib/seo/metadata";
import "@fontsource-variable/syne";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-field="control" className="h-full scroll-smooth">
      <body className="flex min-h-full flex-col font-body antialiased cursor-none">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <SmoothScroll />
        <CustomCursor />
        <AnalyticsTracker />
        <Canvas3D />
        <AudioToggle />
        <SoundDesign />
        <ScrollAnimationsRoot />
        <ExperienceProvider>
          <SkipLink />
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <CompanionRoot />
        </ExperienceProvider>
      </body>
    </html>
  );
}
