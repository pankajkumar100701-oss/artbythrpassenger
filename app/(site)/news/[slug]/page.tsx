import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/artwork-types";
import { getNews } from "@/lib/artworks";

async function getPost(slug: string) {
  return (await getNews()).find((p) => p.slug === slug && p.published);
}

// Posts added later from the Studio are rendered on first visit, then cached.
export async function generateStaticParams() {
  return (await getNews()).filter((p) => p.published).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    openGraph: post.image ? { images: [post.image.src] } : undefined,
  };
}

export default async function NewsPostPage({ params }: PageProps<"/news/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  return (
    <section className="section-tight" style={{ paddingTop: 48 }}>
      <article className="container" style={{ maxWidth: 780 }}>
        <Link href="/news" className="back-link">
          ← All news
        </Link>
        <time className="eyebrow" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        <h1 className="display h2" style={{ margin: "12px 0 28px" }}>
          {post.title}
        </h1>
        {post.image && (
          <Image
            src={post.image.src}
            alt=""
            width={post.image.width}
            height={post.image.height}
            sizes="(max-width: 820px) 92vw, 780px"
            className="letter-image"
            style={{ marginBottom: 32 }}
            preload
          />
        )}
        <div className="prose">
          {post.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </article>
    </section>
  );
}
