"use client";

import { useState } from "react";
import type { Artwork, Category, GalleryFilters } from "@/lib/artwork-types";
import { ArtworkCard } from "./ArtworkCard";

type Filter = { id: string; label: string; test: (a: Artwork) => boolean };

/** "All" and "Available" first, then the categories from the Studio, then sold works. Labels and toggles come from Studio → Categories. */
export function buildFilters(categories: Category[], settings: GalleryFilters): Filter[] {
  return [
    { id: "all", label: settings.allLabel, test: () => true },
    ...(settings.showAvailable ? [{ id: "available", label: settings.availableLabel, test: (a: Artwork) => a.status === "available" }] : []),
    ...categories.map((c) => ({ id: `cat:${c.id}`, label: c.label, test: (a: Artwork) => a.category === c.id })),
    ...(settings.showSold ? [{ id: "sold", label: settings.soldLabel, test: (a: Artwork) => a.status === "sold" }] : []),
  ];
}

type Sort = { id: string; label: string; compare?: (a: Artwork, b: Artwork) => number };

/** Works without a price go last when sorting by price. */
const byPrice = (dir: 1 | -1) => (a: Artwork, b: Artwork) =>
  a.price === null ? (b.price === null ? 0 : 1) : b.price === null ? -1 : (a.price - b.price) * dir;

/** "Featured" keeps the order set in the Studio. */
const SORTS: Sort[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest first", compare: (a, b) => b.year - a.year },
  { id: "oldest", label: "Oldest first", compare: (a, b) => a.year - b.year },
  { id: "price-asc", label: "Price: low to high", compare: byPrice(1) },
  { id: "price-desc", label: "Price: high to low", compare: byPrice(-1) },
  { id: "title", label: "Title: A to Z", compare: (a, b) => a.title.localeCompare(b.title) },
];

type Props = { artworks: Artwork[]; categories: Category[]; settings: GalleryFilters };

export function GalleryGrid({ artworks, categories, settings }: Props) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(SORTS[0].id);
  // Hide empty filters (except "All") so visitors never land on a blank page — unless the host chose to show them.
  const filters = buildFilters(categories, settings).filter((f) => f.id === "all" || settings.showEmpty || artworks.some(f.test));
  const active = filters.find((f) => f.id === filter) ?? filters[0];
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? "";
  const matches = (a: Artwork) => {
    const text = [a.title, a.medium, a.size, a.year, categoryLabel(a.category)].join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  };
  const compare = SORTS.find((s) => s.id === sort)?.compare;
  const shown = artworks.filter((a) => active.test(a) && matches(a));
  if (compare) shown.sort(compare);

  return (
    <>
      <div className="gallery-tools">
        <input
          type="search"
          className="input"
          placeholder="Search by title, medium, year…"
          aria-label="Search works"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="input" aria-label="Sort works" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="filters" role="toolbar" aria-label="Filter works">
        {filters.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={f.id === active.id} onClick={() => setFilter(f.id)}>
            {f.label}
            {settings.showCounts && <span className="chip-count">{artworks.filter(f.test).length}</span>}
          </button>
        ))}
      </div>
      <div className="art-grid">
        {shown.map((a, i) => (
          <ArtworkCard key={a.slug} artwork={a} preload={i < 3} />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="gallery-empty">
          No works match{query ? ` “${query}”` : ""}.{" "}
          {query && (
            <button type="button" className="link-button" onClick={() => setQuery("")}>
              Clear search
            </button>
          )}
        </p>
      )}
    </>
  );
}
