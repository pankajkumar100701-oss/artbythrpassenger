import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkForm } from "@/components/studio/ArtworkForm";
import { getArtwork, getCategories } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { saveArtwork } from "../../actions";

export default async function EditArtworkPage({ params }: PageProps<"/studio/edit/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const [artwork, categories] = await Promise.all([getArtwork(slug), getCategories()]);
  if (!artwork) notFound();

  return (
    <div className="container studio-page">
      <Link href="/studio/artworks" className="back-link">
        ← All artworks
      </Link>
      <div className="studio-head">
        <h1 className="display h2">{artwork.title}</h1>
        <Link href={`/gallery/${artwork.slug}`} target="_blank" className="text-link">
          View on site ↗
        </Link>
      </div>
      <ArtworkForm key={artwork.slug} artwork={artwork} categories={categories} action={saveArtwork.bind(null, artwork.slug)} />
    </div>
  );
}
