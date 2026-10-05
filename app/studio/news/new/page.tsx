import Link from "next/link";
import { NewsForm } from "@/components/studio/NewsForm";
import { requireAdmin } from "@/lib/auth";
import { saveNews } from "../../actions";

export default async function NewNewsPage() {
  await requireAdmin();
  const defaultDate = new Date().toISOString().slice(0, 10);
  return (
    <div className="container studio-page" style={{ maxWidth: 860 }}>
      <Link href="/studio/news" className="back-link">
        ← All news
      </Link>
      <h1 className="display h2" style={{ marginBottom: 32 }}>
        New post
      </h1>
      <NewsForm defaultDate={defaultDate} action={saveNews.bind(null, null)} />
    </div>
  );
}
