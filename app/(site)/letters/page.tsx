import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookCard, ClubPlans } from "@/components/Sections";
import { formatMonth } from "@/lib/artwork-types";
import { getLetters, getSettings } from "@/lib/artworks";

export async function generateMetadata(): Promise<Metadata> {
  const { club } = await getSettings();
  return {
    title: "Letters",
    description: `${club.name} — a handwritten letter, sealed with wax and posted to you every month.`,
  };
}

export default async function LettersPage() {
  const [{ club, book }, allLetters] = await Promise.all([getSettings(), getLetters()]);
  const letters = allLetters.filter((l) => l.visible);
  return (
    <>
      <section className="section-tight" style={{ paddingTop: 72 }}>
        <div className="container club-grid">
          <div>
            <p className="eyebrow">Monthly letters</p>
            <h1 className="display h1" style={{ margin: "12px 0 20px" }}>
              A letter from <em>the Universe.</em>
            </h1>
            <p className="lead">{club.summary}</p>
            <ul className="ticks">
              {club.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="muted" style={{ marginTop: 24, fontSize: "0.9rem" }}>
              Billing is arranged personally by email for now. See the{" "}
              <Link href="/terms#3-message-from-universe-mail-club-subscription" className="text-link">
                subscription terms
              </Link>
              .
            </p>
          </div>
          <ClubPlans club={club} />
        </div>
      </section>

      {letters.length > 0 && (
        <section className="section-tight">
          <div className="container" style={{ maxWidth: 820 }}>
            <p className="eyebrow">Letters so far</p>
            <h2 className="display h2" style={{ margin: "10px 0 32px" }}>
              Messages from <em>the Universe.</em>
            </h2>
            <div className="letter-archive">
              {letters.map((l, i) => (
                <details key={l.id} className="letter" open={i === 0}>
                  <summary>
                    <span className="eyebrow">{formatMonth(l.month)}</span>
                    <span className="letter-title display">{l.title}</span>
                  </summary>
                  <div className="letter-body">
                    {l.image && (
                      <Image
                        src={l.image.src}
                        alt={`Painting for ${formatMonth(l.month)}`}
                        width={l.image.width}
                        height={l.image.height}
                        sizes="(max-width: 860px) 92vw, 760px"
                        className="letter-image"
                      />
                    )}
                    <div className="prose">
                      {l.message.map((p) => (
                        <p key={p.slice(0, 24)}>{p}</p>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section band">
        <div className="container" style={{ maxWidth: 820 }}>
          <BookCard book={book} />
        </div>
      </section>
    </>
  );
}
