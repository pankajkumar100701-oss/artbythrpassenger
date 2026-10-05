import Image from "next/image";
import Link from "next/link";
import { ConfirmButton } from "@/components/studio/ConfirmButton";
import { formatPrice } from "@/lib/artwork-types";
import { getArtworks, getCategories } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { deleteArtwork, moveArtwork, toggleSold } from "../actions";

export default async function ArtworksPage({ searchParams }: PageProps<"/studio/artworks">) {
  await requireAdmin();
  const [artworks, categories] = await Promise.all([getArtworks(), getCategories()]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.label ?? "No category";
  const { saved, deleted } = await searchParams;
  const savedTitle = typeof saved === "string" ? artworks.find((a) => a.slug === saved)?.title : undefined;
  const available = artworks.filter((a) => a.status === "available").length;

  return (
    <div className="container studio-page">
      <div className="studio-head">
        <div>
          <p className="eyebrow">Your gallery</p>
          <h1 className="display h2">Artworks</h1>
          <p className="muted">
            {artworks.length} works · {available} available · {artworks.length - available} sold
          </p>
        </div>
        <div className="btn-row">
          <Link href="/studio/new" className="btn btn-accent">
            + Add artwork
          </Link>
          <Link href="/studio/categories" className="btn btn-ghost">
            Gallery filters
          </Link>
        </div>
      </div>

      {savedTitle && (
        <p className="notice" role="status">
          ✦ “{savedTitle}” is saved and live on the site.{" "}
          <Link href={`/gallery/${saved}`} target="_blank" className="text-link">
            View it ↗
          </Link>
        </p>
      )}
      {deleted && (
        <p className="notice" role="status">
          Artwork deleted.
        </p>
      )}

      <p className="muted studio-hint">The order here is the order on the website. Use ↑ ↓ to rearrange.</p>

      <ol className="studio-list">
        {artworks.map((a, i) => (
          <li key={a.slug} className="studio-row">
            <div className="studio-row-order">
              <form action={moveArtwork.bind(null, a.slug, -1)}>
                <button className="icon-btn icon-btn-sm" aria-label={`Move ${a.title} up`} disabled={i === 0}>
                  ↑
                </button>
              </form>
              <form action={moveArtwork.bind(null, a.slug, 1)}>
                <button className="icon-btn icon-btn-sm" aria-label={`Move ${a.title} down`} disabled={i === artworks.length - 1}>
                  ↓
                </button>
              </form>
            </div>
            <Image src={a.images[0].src} alt="" width={72} height={72} className="studio-thumb" />
            <div className="studio-row-info">
              <Link href={`/studio/edit/${a.slug}`} className="studio-row-title">
                {a.title}
              </Link>
              <p className="muted">
                {categoryName(a.category)} · {a.images.length} image{a.images.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="studio-row-meta">
              <span className={`badge-inline ${a.status === "sold" ? "is-sold" : ""}`}>
                {a.status === "sold" ? "Sold" : "Available"}
              </span>
              <span className="price">{a.price !== null ? formatPrice(a.price) : "—"}</span>
            </div>
            <div className="studio-row-actions">
              <Link href={`/studio/edit/${a.slug}`} className="btn btn-ghost btn-sm">
                Edit
              </Link>
              <form action={toggleSold.bind(null, a.slug)}>
                <button className="btn btn-ghost btn-sm">{a.status === "sold" ? "Mark available" : "Mark sold"}</button>
              </form>
              <ConfirmButton action={deleteArtwork.bind(null, a.slug)} message={`Delete “${a.title}”? This can't be undone.`}>
                Delete
              </ConfirmButton>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
