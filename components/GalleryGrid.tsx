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

type Props = { artworks: Artwork[]; categories: Category[]; settings: GalleryFilters };

export function GalleryGrid({ artworks, categories, settings }: Props) {
  const [filter, setFilter] = useState("all");
  // Hide empty filters (except "All") so visitors never land on a blank page — unless the host chose to show them.
  const filters = buildFilters(categories, settings).filter((f) => f.id === "all" || settings.showEmpty || artworks.some(f.test));
  const active = filters.find((f) => f.id === filter) ?? filters[0];
  const shown = artworks.filter(active.test);

  return (
    <>
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
    </>
  );
}
