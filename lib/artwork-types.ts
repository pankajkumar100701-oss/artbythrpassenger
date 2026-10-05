// Shared by server and client code — no file-system access here.

export type ArtworkImage = { src: string; width: number; height: number };

export type Artwork = {
  slug: string;
  title: string;
  year: number;
  status: "available" | "sold";
  medium: string;
  /** id of a Category */
  category: string;
  size: string;
  /** USD; null when not listed */
  price: number | null;
  story: string[];
  images: ArtworkImage[];
};

/** A gallery filter, managed from Studio → Categories. */
export type Category = { id: string; label: string };

export type ClubPlan = { id: string; label: string; price: string; cadence: string; note: string };

/** Site copy the host edits under Studio → Site content (stored in content/site.json). */
export type SiteSettings = {
  contact: { tagline: string; description: string; email: string; instagram: string };
  about: { greeting: string; paragraphs: string[]; signoff: string };
  club: { name: string; summary: string; plans: ClubPlan[]; details: string[] };
  book: { title: string; summary: string; quote: string };
  gallery: GalleryFilters;
};

/** The built-in filter chips on /gallery. Category chips come from Studio → Categories. */
export type GalleryFilters = {
  allLabel: string;
  availableLabel: string;
  soldLabel: string;
  showAvailable: boolean;
  showSold: boolean;
  showCounts: boolean;
  /** Also show category chips that have no works yet. */
  showEmpty: boolean;
};

export const DEFAULT_GALLERY_FILTERS: GalleryFilters = {
  allLabel: "All works",
  availableLabel: "Available",
  soldLabel: "Found a home",
  showAvailable: true,
  showSold: true,
  showCounts: true,
  showEmpty: false,
};

/** A monthly letter, added from Studio → Letters. */
export type Letter = {
  id: string;
  /** "YYYY-MM" */
  month: string;
  title: string;
  message: string[];
  image: ArtworkImage | null;
  /** Shown in the archive on /letters. */
  visible: boolean;
};

/** A post on /news, added from Studio → News. */
export type NewsPost = {
  slug: string;
  /** "YYYY-MM-DD" */
  date: string;
  title: string;
  /** One or two lines for the list and link previews. */
  summary: string;
  body: string[];
  image: ArtworkImage | null;
  /** Drafts stay in the Studio. */
  published: boolean;
};

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export const formatMonth = (month: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
