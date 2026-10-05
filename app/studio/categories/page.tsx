import Link from "next/link";
import { ConfirmButton } from "@/components/studio/ConfirmButton";
import { getArtworks, getCategories, getSettings } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { addCategory, deleteCategory, moveCategory, renameCategory, saveGalleryFilters } from "../actions";

export default async function CategoriesPage({ searchParams }: PageProps<"/studio/categories">) {
  await requireAdmin();
  const [categories, artworks, { gallery }, { error, saved }] = await Promise.all([
    getCategories(),
    getArtworks(),
    getSettings(),
    searchParams,
  ]);
  const count = (id: string) => artworks.filter((a) => a.category === id).length;
  const available = artworks.filter((a) => a.status === "available").length;

  // Mirrors what visitors see on /gallery (see components/GalleryGrid.tsx).
  const preview = [
    { id: "all", label: gallery.allLabel, n: artworks.length },
    ...(gallery.showAvailable ? [{ id: "available", label: gallery.availableLabel, n: available }] : []),
    ...categories.map((c) => ({ id: c.id, label: c.label, n: count(c.id) })),
    ...(gallery.showSold ? [{ id: "sold", label: gallery.soldLabel, n: artworks.length - available }] : []),
  ].filter((f) => f.id === "all" || gallery.showEmpty || f.n > 0);

  return (
    <div className="container studio-page" style={{ maxWidth: 760 }}>
      <Link href="/studio" className="back-link">
        ← Control centre
      </Link>
      <p className="eyebrow">Gallery page</p>
      <h1 className="display h2">Gallery filters</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>
        The filter buttons above the gallery. Rename them, choose which ones show, and add or reorder your own categories.
      </p>

      {saved && (
        <p className="notice" role="status">
          ✦ Filters saved — the gallery is updated.
        </p>
      )}

      {typeof error === "string" && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      <section className="studio-card" style={{ marginBottom: 24 }}>
        <p className="field-label">What visitors see</p>
        <div className="filters" style={{ margin: "12px 0 0" }} aria-hidden="true">
          {preview.map((f, i) => (
            <span key={f.id} className="chip" aria-pressed={i === 0}>
              {f.label}
              {gallery.showCounts && <span className="chip-count">{f.n}</span>}
            </span>
          ))}
        </div>
      </section>

      <form action={saveGalleryFilters} className="studio-card" style={{ marginBottom: 32 }}>
        <h2 className="studio-card-title">Built-in filters</h2>
        <p className="muted">Always first and last in the row, around your categories.</p>
        <div className="form">
          <label className="field">
            <span className="field-label">First button (everything)</span>
            <input name="allLabel" className="input" defaultValue={gallery.allLabel} maxLength={30} required />
          </label>
          <div className="filter-toggle">
            <label className="check">
              <input type="checkbox" name="showAvailable" defaultChecked={gallery.showAvailable} />
              <span>Show</span>
            </label>
            <label className="field">
              <span className="field-label">Available works</span>
              <input name="availableLabel" className="input" defaultValue={gallery.availableLabel} maxLength={30} />
            </label>
          </div>
          <div className="filter-toggle">
            <label className="check">
              <input type="checkbox" name="showSold" defaultChecked={gallery.showSold} />
              <span>Show</span>
            </label>
            <label className="field">
              <span className="field-label">Sold works (last button)</span>
              <input name="soldLabel" className="input" defaultValue={gallery.soldLabel} maxLength={30} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" name="showCounts" defaultChecked={gallery.showCounts} />
            <span>Show the number of works on each button</span>
          </label>
          <label className="check">
            <input type="checkbox" name="showEmpty" defaultChecked={gallery.showEmpty} />
            <span>Show categories that have no works yet</span>
          </label>
          <div>
            <button className="btn btn-accent btn-sm">Save filters</button>
          </div>
        </div>
      </form>

      <h2 className="studio-card-title" style={{ marginBottom: 12 }}>
        Your categories
      </h2>
      <ol className="studio-list">
        {categories.map((c, i) => (
          <li key={c.id} className="category-row">
            <div className="studio-row-order">
              <form action={moveCategory.bind(null, c.id, -1)}>
                <button className="icon-btn icon-btn-sm" aria-label={`Move ${c.label} up`} disabled={i === 0}>
                  ↑
                </button>
              </form>
              <form action={moveCategory.bind(null, c.id, 1)}>
                <button className="icon-btn icon-btn-sm" aria-label={`Move ${c.label} down`} disabled={i === categories.length - 1}>
                  ↓
                </button>
              </form>
            </div>
            <form action={renameCategory.bind(null, c.id)} className="category-rename">
              <input name="label" className="input" defaultValue={c.label} aria-label="Category name" maxLength={40} required />
              <button className="btn btn-ghost btn-sm">Rename</button>
            </form>
            <span className="muted category-count">
              {count(c.id)} work{count(c.id) === 1 ? "" : "s"}
            </span>
            <ConfirmButton action={deleteCategory.bind(null, c.id)} message={`Delete the “${c.label}” category?`}>
              Delete
            </ConfirmButton>
          </li>
        ))}
      </ol>

      <form action={addCategory} className="studio-card category-add">
        <label className="field" style={{ flex: 1 }}>
          <span className="field-label">New category</span>
          <input name="label" className="input" placeholder="e.g. Oil, Sketches, Mini works" maxLength={40} required />
        </label>
        <button className="btn btn-accent">+ Add</button>
      </form>
    </div>
  );
}
