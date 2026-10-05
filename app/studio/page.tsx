import Link from "next/link";
import { formatDate, formatMonth, formatPrice } from "@/lib/artwork-types";
import { getArtworks, getCategories, getLetters, getNews, getSettings } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";

export default async function ControlCentre() {
  await requireAdmin();
  const [artworks, categories, settings, letters, news] = await Promise.all([
    getArtworks(),
    getCategories(),
    getSettings(),
    getLetters(),
    getNews(),
  ]);

  const available = artworks.filter((a) => a.status === "available");
  const listedValue = available.reduce((sum, a) => sum + (a.price ?? 0), 0);
  const stats = [
    { label: "Works on the site", value: String(artworks.length) },
    { label: "Available", value: String(available.length) },
    { label: "Found a home", value: String(artworks.length - available.length) },
    { label: "Available, listed value", value: formatPrice(listedValue) },
  ];

  // Small things that make the site look unfinished to visitors.
  const todos = [
    ...available.filter((a) => a.price === null).map((a) => ({ href: `/studio/edit/${a.slug}`, text: `“${a.title}” is available but has no price.` })),
    ...artworks.filter((a) => a.story.length === 0).map((a) => ({ href: `/studio/edit/${a.slug}`, text: `“${a.title}” has no story yet.` })),
    ...categories
      .filter((c) => !settings.gallery.showEmpty && !artworks.some((a) => a.category === c.id))
      .map((c) => ({ href: "/studio/categories", text: `The “${c.label}” category is empty, so visitors don't see it.` })),
  ];

  const sections = [
    { href: "/studio/artworks", title: "Artworks", text: "Add, edit, reorder, mark sold." },
    { href: "/studio/categories", title: "Gallery filters", text: `${categories.length} categories, plus the built-in buttons.` },
    {
      href: "/studio/letters",
      title: "Letters",
      text: letters[0] ? `Latest: ${formatMonth(letters[0].month)}.` : "No letters yet — add this month's.",
    },
    {
      href: "/studio/news",
      title: "News",
      text: news[0] ? `Latest: ${formatDate(news[0].date)}${news[0].published ? "" : " (draft)"}.` : "No news yet — share an update.",
    },
    { href: "/studio/security", title: "Security", text: "Password and sign-in activity." },
    { href: "/studio/site", title: "Site content", text: "Tagline, contact, About, Letters, Book." },
  ];

  return (
    <div className="container studio-page">
      <div className="studio-head">
        <div>
          <p className="eyebrow">Host control centre</p>
          <h1 className="display h2">Welcome back, Han.</h1>
          <p className="muted">{settings.contact.tagline}</p>
        </div>
        <div className="btn-row">
          <Link href="/studio/new" className="btn btn-accent">
            + Add artwork
          </Link>
        </div>
      </div>

      <dl className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="hub-grid">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="hub-card">
            <span className="hub-card-title">{s.title} →</span>
            <span className="muted">{s.text}</span>
          </Link>
        ))}
      </div>

      <section className="studio-card" style={{ marginTop: 24 }}>
        <h2 className="studio-card-title">Worth a look</h2>
        {todos.length === 0 ? (
          <p className="muted">Nothing — every work has a price and a story, and every category has works. ✦</p>
        ) : (
          <ul className="todo-list">
            {todos.map((t) => (
              <li key={t.text}>
                <Link href={t.href} className="text-link">
                  {t.text}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="studio-card" style={{ marginTop: 24 }}>
        <h2 className="studio-card-title">Where enquiries go</h2>
        <p className="muted">
          Visitors write to <strong>{settings.contact.email}</strong> — every “Bring it home” and “Join” button opens a letter
          to this address.{" "}
          <Link href="/studio/site#contact" className="text-link">
            Change it
          </Link>
        </p>
      </section>
    </div>
  );
}

