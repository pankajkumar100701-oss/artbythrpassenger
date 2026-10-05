import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Artwork } from "@/lib/artwork-types";
import { TiltCard } from "./TiltCard";

export function ArtworkCard({ artwork, preload = false }: { artwork: Artwork; preload?: boolean }) {
  const cover = artwork.images[0];
  const sold = artwork.status === "sold";

  return (
    <Link href={`/gallery/${artwork.slug}`} className="art-card-link" aria-label={`${artwork.title}, ${sold ? "sold" : "available"}`}>
      <TiltCard className="art-card">
        <div className="art-card-media">
          <Image
            src={cover.src}
            alt={artwork.title}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 30vw"
            preload={preload}
          />
          <span className={`badge ${sold ? "badge-muted" : ""}`}>{sold ? "Sold" : "Available"}</span>
        </div>
        <div className="art-card-body">
          <div className="art-card-row">
            <h3 className="art-card-title">{artwork.title}</h3>
            {artwork.price !== null && <span className="price">{formatPrice(artwork.price)}</span>}
          </div>
          <p className="art-card-meta">{artwork.medium}</p>
        </div>
      </TiltCard>
    </Link>
  );
}
