import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSettings } from "@/lib/artworks";

export default async function NotFound() {
  const { contact } = await getSettings();
  return (
    <>
      <SiteHeader tagline={contact.tagline} />
      <main className="container not-found">
        <p className="eyebrow">404</p>
        <h1 className="display h2" style={{ marginTop: 12 }}>
          This page wandered off.
        </h1>
        <div className="btn-row">
          <Link href="/" className="btn btn-ink">
            Home
          </Link>
          <Link href="/gallery" className="btn btn-ghost">
            Gallery
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
