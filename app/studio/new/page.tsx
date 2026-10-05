import Link from "next/link";
import { ArtworkForm } from "@/components/studio/ArtworkForm";
import { getCategories } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { saveArtwork } from "../actions";

export default async function NewArtworkPage() {
  await requireAdmin();
  const categories = await getCategories();
  return (
    <div className="container studio-page">
      <Link href="/studio/artworks" className="back-link">
        ← All artworks
      </Link>
      <h1 className="display h2" style={{ marginBottom: 32 }}>
        Add an artwork
      </h1>
      <ArtworkForm categories={categories} action={saveArtwork.bind(null, null)} />
    </div>
  );
}
