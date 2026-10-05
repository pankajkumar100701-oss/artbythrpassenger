import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { deleteFile, readDoc, saveFile, updateDoc, type JsonDoc } from "./store";
import { DEFAULT_GALLERY_FILTERS, type Artwork, type ArtworkImage, type Category, type Letter, type NewsPost, type SiteSettings } from "./artwork-types";

// Everything the Studio edits lives in /content, so the site never needs a code change.
const CONTENT_DIR = path.join(process.cwd(), "content");
export const UPLOAD_DIR = path.join(CONTENT_DIR, "uploads");
/** Public URL prefix for uploaded images, served by app/media/[...path]/route.ts */
export const UPLOAD_URL = "/media";

// On a live host these are only the starting content; saves go to Vercel Blob (see lib/store.ts).
const doc = <T>(name: string): JsonDoc<T> => ({ key: `content/${name}`, file: path.join(CONTENT_DIR, name) });
const ARTWORKS_DOC = doc<Artwork[]>("artworks.json");
const CATEGORIES_DOC = doc<Category[]>("categories.json");
const SETTINGS_DOC = doc<SiteSettings>("site.json");
const LETTERS_DOC = doc<Letter[]>("letters.json");
const NEWS_DOC = doc<NewsPost[]>("news.json");

export const getArtworks = () => readDoc<Artwork[]>(ARTWORKS_DOC);
export const getCategories = () => readDoc<Category[]>(CATEGORIES_DOC);
export async function getSettings() {
  const settings = await readDoc<SiteSettings>(SETTINGS_DOC);
  // Fill in settings added after the file was first written.
  return { ...settings, gallery: { ...DEFAULT_GALLERY_FILTERS, ...settings.gallery } };
}

/** Newest first. */
export async function getNews() {
  return (await readDoc<NewsPost[]>(NEWS_DOC)).sort((a, b) => b.date.localeCompare(a.date));
}

/** Newest month first. */
export async function getLetters() {
  return (await readDoc<Letter[]>(LETTERS_DOC)).sort((a, b) => b.month.localeCompare(a.month));
}

export async function getArtwork(slug: string) {
  return (await getArtworks()).find((a) => a.slug === slug);
}

export const updateArtworks = <R>(change: (list: Artwork[]) => R | Promise<R>) => updateDoc(ARTWORKS_DOC, change);
export const updateCategories = <R>(change: (list: Category[]) => R | Promise<R>) => updateDoc(CATEGORIES_DOC, change);
export const updateSettings = <R>(change: (settings: SiteSettings) => R | Promise<R>) => updateDoc(SETTINGS_DOC, change);
export const updateNews = <R>(change: (list: NewsPost[]) => R | Promise<R>) => updateDoc(NEWS_DOC, change);
export const updateLetters = <R>(change: (list: Letter[]) => R | Promise<R>) => updateDoc(LETTERS_DOC, change);

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "artwork"
  );
}

export function uniqueSlug(base: string, taken: string[]) {
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Resizes, fixes rotation and converts an upload to WebP. */
export async function storeImage(file: File): Promise<ArtworkImage> {
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const name = `${randomUUID()}.webp`;
  await saveFile(UPLOAD_DIR, name, data, "image/webp");
  return { src: `${UPLOAD_URL}/${name}`, width: info.width, height: info.height };
}

/** Deletes an uploaded image file. Images shipped in /public are left alone. */
export async function removeImage(image: ArtworkImage) {
  if (!image.src.startsWith(`${UPLOAD_URL}/`)) return;
  await deleteFile(UPLOAD_DIR, path.basename(image.src));
}
