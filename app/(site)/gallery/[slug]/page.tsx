import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkCard } from "@/components/ArtworkCard";
import { ArtworkViewer } from "@/components/ArtworkViewer";
import { formatPrice } from "@/lib/artwork-types";
import { getArtwork, getArtworks } from "@/lib/artworks";
import { contactHref } from "@/data/site";

// Works added later from the Studio are rendered on first visit, then cached.
export async function generateStaticParams() {
  return (await getArtworks()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const art = await getArtwork(slug);
  if (!art) return {};
  return {
    title: art.title,
    description: art.story[0] ?? `${art.title} — ${art.medium}, ${art.year}.`,
    openGraph: { images: [art.images[0].src] },
  };
}

export default async function ArtworkPage({ params }: PageProps<"/gallery/[slug]">) {
  const { slug } = await params;
  const artworks = await getArtworks();
  const art = artworks.find((a) => a.slug === slug);
  if (!art) notFound();

  const sold = art.status === "sold";
  const more = artworks.filter((a) => a.slug !== art.slug && a.status === "available").slice(0, 3);
  const specs = [
    { label: "Medium", value: art.medium },
    { label: "Dimensions", value: art.size },
    { label: "Year", value: String(art.year) },
  ].filter((s) => s.value);

  return (
    <>
      <section className="section-tight" style={{ paddingTop: 48 }}>
        <div className="container">
          <Link href="/gallery" className="back-link">
            ← Gallery
          </Link>
          <div className="detail-grid">
            <ArtworkViewer key={art.slug} images={art.images} title={art.title} />

            <div className="detail-info">
              <p className="eyebrow">
                {art.year} · {sold ? "Sold" : "Available"}
              </p>
              <h1 className="display h2">{art.title}</h1>
              <dl className="specs">
                {specs.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>

              {sold ? (
                <p className="signature" style={{ marginTop: 24 }}>
                  This piece has found its home.
                </p>
              ) : (
                <>
                  <div className="buy-row">
                    <span className="muted">Price</span>
                    {art.price !== null && <span className="buy-price">{formatPrice(art.price)}</span>}
                  </div>
                  <Link
                    href={contactHref(`Purchase: ${art.title}${art.price !== null ? ` (${formatPrice(art.price)})` : ""}`)}
                    className="btn btn-ink btn-block"
                  >
                    Bring it home
                  </Link>
                  <p className="muted" style={{ fontSize: "0.85rem", marginTop: 12 }}>
                    Sold personally by email — Han will confirm availability, shipping and payment with you.
                  </p>
                </>
              )}
            </div>
          </div>

          {art.story.length > 0 && (
            <div className="story">
              <h2 className="display h3">On this piece</h2>
              <div className="prose">
                {art.story.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {more.length > 0 && (
        <section className="section band">
          <div className="container">
            <div className="section-head">
              <h2 className="display h3">More from the gallery</h2>
              <Link href="/gallery" className="text-link">
                All works →
              </Link>
            </div>
            <div className="art-grid">
              {more.map((a) => (
                <ArtworkCard key={a.slug} artwork={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
