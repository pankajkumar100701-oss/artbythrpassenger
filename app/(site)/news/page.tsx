import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/artwork-types";
import { getNews } from "@/lib/artworks";

export const metadata: Metadata = {
  title: "News",
  description: "Latest news from the studio of Bao Han — new works, exhibitions and updates.",
};

export default async function NewsPage() {
  const posts = (await getNews()).filter((p) => p.published);

  return (
    <section className="section-tight" style={{ paddingTop: 72 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <p className="eyebrow">Latest news</p>
        <h1 className="display h1" style={{ margin: "12px 0 16px" }}>
          From <em>the studio.</em>
        </h1>
        <p className="lead" style={{ marginBottom: 40 }}>
          New works, exhibitions and little updates from the mountains.
        </p>

        {posts.length === 0 ? (
          <p className="muted">Nothing new just yet — check back soon.</p>
        ) : (
          <div className="news-list">
            {posts.map((p) => (
              <Link key={p.slug} href={`/news/${p.slug}`} className={`news-card ${p.image ? "" : "no-image"}`}>
                {p.image && (
                  <Image src={p.image.src} alt="" width={p.image.width} height={p.image.height} sizes="(max-width: 700px) 92vw, 280px" className="news-card-image" />
                )}
                <div className="news-card-body">
                  <time className="eyebrow" dateTime={p.date}>
                    {formatDate(p.date)}
                  </time>
                  <h2 className="display h3">{p.title}</h2>
                  <p className="muted">{p.summary}</p>
                  <span className="text-link">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
