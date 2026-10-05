import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsForm } from "@/components/studio/NewsForm";
import { getNews } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { saveNews } from "../../../actions";

export default async function EditNewsPage({ params }: PageProps<"/studio/news/edit/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const post = (await getNews()).find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div className="container studio-page" style={{ maxWidth: 860 }}>
      <Link href="/studio/news" className="back-link">
        ← All news
      </Link>
      <div className="studio-head">
        <h1 className="display h2">{post.title}</h1>
        {post.published && (
          <Link href={`/news/${post.slug}`} target="_blank" className="text-link">
            View on site ↗
          </Link>
        )}
      </div>
      <NewsForm key={post.slug} post={post} defaultDate={post.date} action={saveNews.bind(null, post.slug)} />
    </div>
  );
}
