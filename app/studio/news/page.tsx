import Image from "next/image";
import Link from "next/link";
import { ConfirmButton } from "@/components/studio/ConfirmButton";
import { formatDate } from "@/lib/artwork-types";
import { getNews } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { deleteNews, toggleNewsPublished } from "../actions";

export default async function StudioNewsPage({ searchParams }: PageProps<"/studio/news">) {
  await requireAdmin();
  const [posts, { saved, deleted }] = await Promise.all([getNews(), searchParams]);

  return (
    <div className="container studio-page">
      <div className="studio-head">
        <div>
          <p className="eyebrow">Latest news</p>
          <h1 className="display h2">News</h1>
          <p className="muted">
            {posts.length} post{posts.length === 1 ? "" : "s"} · {posts.filter((p) => p.published).length} published on /news
          </p>
        </div>
        <Link href="/studio/news/new" className="btn btn-accent">
          + New post
        </Link>
      </div>

      {saved && (
        <p className="notice" role="status">
          ✦ Post saved.{" "}
          <Link href="/news" target="_blank" className="text-link">
            See /news ↗
          </Link>
        </p>
      )}
      {deleted && (
        <p className="notice" role="status">
          Post deleted.
        </p>
      )}

      {posts.length === 0 ? (
        <section className="studio-card">
          <h2 className="studio-card-title">No news yet</h2>
          <p className="muted">Share an exhibition, a new series, a fair or a studio update — it appears under News in the menu.</p>
        </section>
      ) : (
        <ol className="studio-list">
          {posts.map((p) => (
            <li key={p.slug} className="studio-row letter-row">
              {p.image ? (
                <Image src={p.image.src} alt="" width={72} height={72} className="studio-thumb" />
              ) : (
                <span className="studio-thumb letter-thumb" aria-hidden="true">
                  ✦
                </span>
              )}
              <div className="studio-row-info">
                <Link href={`/studio/news/edit/${p.slug}`} className="studio-row-title">
                  {p.title}
                </Link>
                <p className="muted">{formatDate(p.date)}</p>
              </div>
              <div className="studio-row-meta">
                <span className={`badge-inline ${p.published ? "" : "is-sold"}`}>{p.published ? "Published" : "Draft"}</span>
              </div>
              <div className="studio-row-actions">
                <Link href={`/studio/news/edit/${p.slug}`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
                <form action={toggleNewsPublished.bind(null, p.slug)}>
                  <button className="btn btn-ghost btn-sm">{p.published ? "Unpublish" : "Publish"}</button>
                </form>
                <ConfirmButton action={deleteNews.bind(null, p.slug)} message={`Delete “${p.title}”? This can't be undone.`}>
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
