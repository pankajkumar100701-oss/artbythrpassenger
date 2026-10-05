import Link from "next/link";
import { SiteSettingsForm } from "@/components/studio/SiteSettingsForm";
import { getSettings } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";

export default async function SiteContentPage({ searchParams }: PageProps<"/studio/site">) {
  await requireAdmin();
  const [settings, { saved }] = await Promise.all([getSettings(), searchParams]);

  return (
    <div className="container studio-page" style={{ maxWidth: 860 }}>
      <Link href="/studio" className="back-link">
        ← Control centre
      </Link>
      <p className="eyebrow">Words on the website</p>
      <h1 className="display h2">Site content</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>
        Everything here goes live as soon as you save. Jump to{" "}
        <a href="#contact" className="text-link">contact</a>, <a href="#about" className="text-link">who I am</a>,{" "}
        <a href="#letters" className="text-link">letters</a> or <a href="#book" className="text-link">the book</a>.
      </p>

      {saved && (
        <p className="notice" role="status">
          ✦ Saved — the website is updated.{" "}
          <Link href="/" target="_blank" className="text-link">
            Have a look ↗
          </Link>
        </p>
      )}

      <SiteSettingsForm settings={settings} />
    </div>
  );
}
