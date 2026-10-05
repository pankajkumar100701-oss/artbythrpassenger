import Image from "next/image";
import Link from "next/link";
import { ConfirmButton } from "@/components/studio/ConfirmButton";
import { formatMonth } from "@/lib/artwork-types";
import { getLetters } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { deleteLetter, toggleLetterVisible } from "../actions";

export default async function LettersPage({ searchParams }: PageProps<"/studio/letters">) {
  await requireAdmin();
  const [letters, { saved, deleted }] = await Promise.all([getLetters(), searchParams]);

  return (
    <div className="container studio-page">
      <div className="studio-head">
        <div>
          <p className="eyebrow">Monthly letters</p>
          <h1 className="display h2">Letters</h1>
          <p className="muted">
            {letters.length} letter{letters.length === 1 ? "" : "s"} · {letters.filter((l) => l.visible).length} shown on /letters
          </p>
        </div>
        <div className="btn-row">
          <Link href="/studio/letters/new" className="btn btn-accent">
            + New letter
          </Link>
          <Link href="/studio/site#letters" className="btn btn-ghost">
            Club &amp; plans
          </Link>
        </div>
      </div>

      {saved && (
        <p className="notice" role="status">
          ✦ Letter saved.{" "}
          <Link href="/letters" target="_blank" className="text-link">
            See /letters ↗
          </Link>
        </p>
      )}
      {deleted && (
        <p className="notice" role="status">
          Letter deleted.
        </p>
      )}

      {letters.length === 0 ? (
        <section className="studio-card">
          <h2 className="studio-card-title">No letters yet</h2>
          <p className="muted">
            Add this month&apos;s message — visitors will see it on the Letters page, newest first.
          </p>
        </section>
      ) : (
        <ol className="studio-list">
          {letters.map((l) => (
            <li key={l.id} className="studio-row letter-row">
              {l.image ? (
                <Image src={l.image.src} alt="" width={72} height={72} className="studio-thumb" />
              ) : (
                <span className="studio-thumb letter-thumb" aria-hidden="true">
                  ✉
                </span>
              )}
              <div className="studio-row-info">
                <Link href={`/studio/letters/edit/${l.id}`} className="studio-row-title">
                  {l.title}
                </Link>
                <p className="muted">{formatMonth(l.month)}</p>
              </div>
              <div className="studio-row-meta">
                <span className={`badge-inline ${l.visible ? "" : "is-sold"}`}>{l.visible ? "On the site" : "Subscribers only"}</span>
              </div>
              <div className="studio-row-actions">
                <Link href={`/studio/letters/edit/${l.id}`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
                <form action={toggleLetterVisible.bind(null, l.id)}>
                  <button className="btn btn-ghost btn-sm">{l.visible ? "Hide" : "Show"}</button>
                </form>
                <ConfirmButton action={deleteLetter.bind(null, l.id)} message={`Delete the ${formatMonth(l.month)} letter? This can't be undone.`}>
                  Delete
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
