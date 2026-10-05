import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { DEFAULT_GALLERY_FILTERS, type Artwork, type ArtworkImage, type Category, type Letter, type NewsPost, type SiteSettings } from "./artwork-types";

// Everything the Studio edits lives in /content, so the site never needs a code change.
const CONTENT_DIR = path.join(process.cwd(), "content");
export const UPLOAD_DIR = path.join(CONTENT_DIR, "uploads");
/** Public URL prefix for uploaded images, served by app/media/[...path]/route.ts */
export const UPLOAD_URL = "/media";

const ARTWORKS_FILE = path.join(CONTENT_DIR, "artworks.json");
const CATEGORIES_FILE = path.join(CONTENT_DIR, "categories.json");
const SETTINGS_FILE = path.join(CONTENT_DIR, "site.json");
const LETTERS_FILE = path.join(CONTENT_DIR, "letters.json");
const NEWS_FILE = path.join(CONTENT_DIR, "news.json");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

// One queue for all writes, so two quick saves can't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

/** Applies a change to a JSON file and saves it atomically (write temp file, then rename). */
function updateJson<T, R>(file: string, change: (data: T) => R | Promise<R>): Promise<R> {
  const run = queue.then(async () => {
    const data = await readJson<T>(file);
    const result = await change(data);
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
    await rename(tmp, file);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export const getArtworks = () => readJson<Artwork[]>(ARTWORKS_FILE);
export const getCategories = () => readJson<Category[]>(CATEGORIES_FILE);
export async function getSettings() {
  const settings = await readJson<SiteSettings>(SETTINGS_FILE);
  // Fill in settings added after the file was first written.
  return { ...settings, gallery: { ...DEFAULT_GALLERY_FILTERS, ...settings.gallery } };
}

/** Newest first. */
export async function getNews() {
  return (await readJson<NewsPost[]>(NEWS_FILE)).sort((a, b) => b.date.localeCompare(a.date));
}

/** Newest month first. */
export async function getLetters() {
  return (await readJson<Letter[]>(LETTERS_FILE)).sort((a, b) => b.month.localeCompare(a.month));
}

export async function getArtwork(slug: string) {
  return (await getArtworks()).find((a) => a.slug === slug);
}

export const updateArtworks = <R>(change: (list: Artwork[]) => R | Promise<R>) => updateJson(ARTWORKS_FILE, change);
export const updateCategories = <R>(change: (list: Category[]) => R | Promise<R>) => updateJson(CATEGORIES_FILE, change);
export const updateSettings = <R>(change: (settings: SiteSettings) => R | Promise<R>) => updateJson(SETTINGS_FILE, change);
export const updateNews = <R>(change: (list: NewsPost[]) => R | Promise<R>) => updateJson(NEWS_FILE, change);
export const updateLetters = <R>(change: (list: Letter[]) => R | Promise<R>) => updateJson(LETTERS_FILE, change);

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
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(UPLOAD_DIR, name), data);
  return { src: `${UPLOAD_URL}/${name}`, width: info.width, height: info.height };
}

/** Deletes an uploaded image file. Images shipped in /public are left alone. */
export async function removeImage(image: ArtworkImage) {
  if (!image.src.startsWith(`${UPLOAD_URL}/`)) return;
  const file = path.join(UPLOAD_DIR, path.basename(image.src));
  await unlink(file).catch(() => {});
}
