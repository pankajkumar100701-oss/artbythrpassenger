import Link from "next/link";
import { ArtworkCard } from "@/components/ArtworkCard";
import { AboutSection, ClubSection, ContactBand } from "@/components/Sections";
import { getArtworks, getSettings } from "@/lib/artworks";

const FEATURED = 6;

export default async function Home() {
  const [artworks, { contact, about, club }] = await Promise.all([getArtworks(), getSettings()]);
  // Available works first, so the home page leads with pieces people can bring home.
  const featured = [...artworks].sort((a, b) => Number(a.status === "sold") - Number(b.status === "sold")).slice(0, FEATURED);

  return (
    <>
      {/* 1. Gallery first */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">{contact.tagline}</p>
            <h1 className="display h1">
              Art by the <em>Passenger.</em>
            </h1>
          </div>
          <div className="hero-side">
            <p className="lead">{contact.description}</p>
            <div className="btn-row">
              <Link href="/gallery" className="btn btn-ink">
                Enter the gallery
              </Link>
              <Link href="/who-i-am" className="btn btn-ghost">
                Who I am
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Lately in the studio</p>
              <h2 className="display h3">Works, gathered as they arrive.</h2>
            </div>
            <Link href="/gallery" className="text-link">
              See all {artworks.length} works →
            </Link>
          </div>
          <div className="art-grid">
            {featured.map((a, i) => (
              <ArtworkCard key={a.slug} artwork={a} preload={i < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Who I am */}
      <AboutSection about={about} />

      {/* 3. Letters */}
      <ClubSection club={club} />

      <ContactBand />
    </>
  );
}
