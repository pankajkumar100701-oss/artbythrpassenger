import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { site } from "@/data/site";
import { getSettings } from "@/lib/artworks";
import { DEFAULT_ACCENT, appearanceScript } from "@/lib/theme";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { contact } = await getSettings();
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name} — ${site.artist}`, template: `%s — ${site.name}` },
    description: contact.description,
    icons: { icon: "/brand/logo.webp" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-accent={DEFAULT_ACCENT}
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
