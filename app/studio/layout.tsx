import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppearanceControls } from "@/components/AppearanceControls";
import { StudioNav } from "@/components/studio/StudioNav";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

// Layout is chrome only — every Studio page and action checks the login itself.
export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <div className="studio">
      <header className="studio-bar">
        <Link href="/studio" className="brand">
          <Image src="/brand/logo.webp" alt="" width={36} height={36} className="brand-logo" />
          <span className="brand-text">
            <span className="brand-name">Control centre</span>
            <span className="brand-sub">Art by the Passenger</span>
          </span>
        </Link>
        <details className="studio-appearance">
          <summary className="icon-btn" aria-label="Appearance">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
            </svg>
          </summary>
          <div className="header-panel">
            <AppearanceControls />
          </div>
        </details>
        <Link href="/" className="btn btn-ghost btn-sm" target="_blank">
          View site ↗
        </Link>
      </header>
      <StudioNav />
      <main className="studio-main">{children}</main>
    </div>
  );
}
