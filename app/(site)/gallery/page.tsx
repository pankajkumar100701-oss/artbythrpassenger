import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getArtworks, getCategories, getSettings } from "@/lib/artworks";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Original paintings by Bao Han — acrylics and watercolours, each one-of-a-kind.",
};

export default async function GalleryPage() {
  const [artworks, categories, { gallery }] = await Promise.all([getArtworks(), getCategories(), getSettings()]);
  return (
    <section className="section-tight" style={{ paddingTop: 72 }}>
      <div className="container">
        <p className="eyebrow">Gallery</p>
        <h1 className="display h1" style={{ margin: "12px 0 16px" }}>
          Works, gathered <em>as they arrive.</em>
        </h1>
        <p className="lead" style={{ marginBottom: 40 }}>
          Click into any piece to read the story behind it &amp; bring it home.
        </p>
        <GalleryGrid artworks={artworks} categories={categories} settings={gallery} />
      </div>
    </section>
  );
}
