"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Artwork, ArtworkImage, GalleryFilters, Letter, NewsPost, SiteSettings } from "@/lib/artwork-types";
import {
  getArtworks,
  getCategories,
  removeImage,
  slugify,
  storeImage,
  uniqueSlug,
  updateArtworks,
  updateCategories,
  updateLetters,
  updateNews,
  updateSettings,
} from "@/lib/artworks";
import { cancelLoginCode, changePassword, createLoginCode, requireAdmin, signIn, signInWithCode, signOut } from "@/lib/auth";
import { sendLoginCode } from "@/lib/mail";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

/** Public pages are cached; refresh all of them after any change. */
const refreshSite = () => revalidatePath("/", "layout");

// ------------------------------------------------------------------ auth

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const error = await signIn(password);
  if (error) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error };
  }
  redirect("/studio");
}

export type CodeState = { error?: string; sent?: boolean } | undefined;

/** Emails a 6-digit login code to STUDIO_RECOVERY_EMAIL. */
export async function requestLoginCode(_prev: CodeState): Promise<CodeState> {
  const created = await createLoginCode();
  if ("error" in created) return { error: created.error, sent: _prev?.sent };
  const error = await sendLoginCode(created.code);
  if (error) {
    await cancelLoginCode();
    return { error };
  }
  return { sent: true };
}

export async function loginWithCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const error = await signInWithCode(String(formData.get("code") ?? "").slice(0, 20));
  if (error) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error };
  }
  redirect("/studio");
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const field = (key: string) => String(formData.get(key) ?? "").slice(0, 200);
  const next = field("next");
  if (next !== field("confirm")) return { error: "The new passwords don't match.", fieldErrors: { confirm: "Type the same new password twice." } };
  const fieldErrors = await changePassword(field("current"), next);
  if (fieldErrors) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing the current password
    return { error: "The password was not changed.", fieldErrors };
  }
  redirect("/studio/security?changed=1");
}

export async function logout() {
  await signOut();
  redirect("/studio/login");
}

// ------------------------------------------------------------------ artworks

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function readFields(formData: FormData, categoryIds: string[]) {
  const text = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  const errors: Record<string, string> = {};

  const title = text("title", 120);
  if (!title) errors.title = "Give the artwork a title.";

  const year = Number(text("year", 4));
  if (!Number.isInteger(year) || year < 1900 || year > 2100) errors.year = "Enter a year like 2026.";

  const status = text("status", 20) === "sold" ? "sold" : "available";
  const category = text("category", 60);
  if (!categoryIds.includes(category)) errors.category = "Choose a category.";

  const rawPrice = text("price", 12).replace(/[$,\s]/g, "");
  let price: number | null = null;
  if (rawPrice) {
    price = Number(rawPrice);
    if (!Number.isFinite(price) || price < 0) errors.price = "Price should be a number, e.g. 120.";
  }

  const story = text("story", 6000)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  return {
    errors,
    fields: { title, year, status, category, medium: text("medium", 200), size: text("size", 120), price, story } as Omit<
      Artwork,
      "slug" | "images"
    >,
  };
}

/** Existing images to keep, in the order chosen in the form. Only accepts images the artwork already had. */
function readKeptImages(formData: FormData, current: ArtworkImage[]) {
  let order: string[] = [];
  try {
    order = JSON.parse(String(formData.get("keepImages") ?? "[]"));
  } catch {}
  return order.map((src) => current.find((img) => img.src === src)).filter((img): img is ArtworkImage => Boolean(img));
}

export async function saveArtwork(originalSlug: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const categoryIds = (await getCategories()).map((c) => c.id);
  const { errors, fields } = readFields(formData, categoryIds);
  const files = formData
    .getAll("newImages")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const f of files) {
    if (!f.type.startsWith("image/")) errors.newImages = `“${f.name}” is not an image.`;
    else if (f.size > MAX_IMAGE_BYTES) errors.newImages = `“${f.name}” is larger than 15 MB.`;
  }
  if (Object.keys(errors).length) return { error: "Please fix the highlighted fields.", fieldErrors: errors };

  let uploaded: ArtworkImage[];
  try {
    uploaded = await Promise.all(files.map(storeImage));
  } catch {
    return { error: "One of the images could not be read. Try saving it as JPG or PNG." };
  }

  let savedSlug = "";
  const result = await updateArtworks(async (list) => {
    const index = originalSlug ? list.findIndex((a) => a.slug === originalSlug) : -1;
    if (originalSlug && index === -1) return "This artwork no longer exists.";

    const existing = index >= 0 ? list[index] : null;
    const kept = existing ? readKeptImages(formData, existing.images) : [];
    const images = [...kept, ...uploaded];
    if (images.length === 0) return "Add at least one image.";

    // Keep the old slug so existing links keep working; new works get one from the title.
    const slug = existing
      ? existing.slug
      : uniqueSlug(
          slugify(fields.title),
          list.map((a) => a.slug),
        );
    const artwork: Artwork = { slug, ...fields, images };

    if (existing) {
      list[index] = artwork;
      await Promise.all(existing.images.filter((img) => !kept.includes(img)).map(removeImage));
    } else {
      list.unshift(artwork); // newest first
    }
    savedSlug = slug;
    return null;
  });

  if (result) {
    await Promise.all(uploaded.map(removeImage));
    return { error: result };
  }

  refreshSite();
  redirect(`/studio/artworks?saved=${encodeURIComponent(savedSlug)}`);
}

export async function deleteArtwork(slug: string) {
  await requireAdmin();
  const removed = await updateArtworks((list) => {
    const i = list.findIndex((a) => a.slug === slug);
    return i === -1 ? null : list.splice(i, 1)[0];
  });
  if (removed) await Promise.all(removed.images.map(removeImage));
  refreshSite();
  redirect("/studio/artworks?deleted=1");
}

export async function moveArtwork(slug: string, direction: -1 | 1) {
  await requireAdmin();
  await updateArtworks((list) => {
    const i = list.findIndex((a) => a.slug === slug);
    const j = i + direction;
    if (i === -1 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  });
  refreshSite();
  revalidatePath("/studio", "layout");
}

export async function toggleSold(slug: string) {
  await requireAdmin();
  await updateArtworks((list) => {
    const art = list.find((a) => a.slug === slug);
    if (art) art.status = art.status === "sold" ? "available" : "sold";
  });
  refreshSite();
  revalidatePath("/studio", "layout");
}

// ------------------------------------------------------------------ categories (gallery filters)

const categoriesPage = (message?: string) =>
  redirect(message ? `/studio/categories?error=${encodeURIComponent(message)}` : "/studio/categories");

export async function addCategory(formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim().slice(0, 40);
  if (!label) categoriesPage("Give the category a name.");
  const error = await updateCategories((list) => {
    if (list.some((c) => c.label.toLowerCase() === label.toLowerCase())) return `“${label}” already exists.`;
    list.push({ id: uniqueSlug(slugify(label), list.map((c) => c.id)), label });
    return null;
  });
  refreshSite();
  categoriesPage(error ?? undefined);
}

export async function renameCategory(id: string, formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim().slice(0, 40);
  if (!label) categoriesPage("A category name can't be empty.");
  // The id never changes, so artworks stay linked after a rename.
  await updateCategories((list) => {
    const cat = list.find((c) => c.id === id);
    if (cat) cat.label = label;
  });
  refreshSite();
  categoriesPage();
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const used = (await getArtworks()).filter((a) => a.category === id).length;
  if (used > 0) categoriesPage(`That category still has ${used} artwork${used === 1 ? "" : "s"}. Move them to another category first.`);
  const error = await updateCategories((list) => {
    if (list.length <= 1) return "Keep at least one category.";
    const i = list.findIndex((c) => c.id === id);
    if (i !== -1) list.splice(i, 1);
    return null;
  });
  refreshSite();
  categoriesPage(error ?? undefined);
}

export async function moveCategory(id: string, direction: -1 | 1) {
  await requireAdmin();
  await updateCategories((list) => {
    const i = list.findIndex((c) => c.id === id);
    const j = i + direction;
    if (i === -1 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  });
  refreshSite();
  categoriesPage();
}

// ------------------------------------------------------------------ site content

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const text = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  /** Paragraphs are separated by an empty line. */
  const paragraphs = (key: string) =>
    text(key, 6000)
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
  /** One item per line. */
  const lines = (key: string) =>
    text(key, 2000)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

  const errors: Record<string, string> = {};
  const required = (key: string, max: number, message: string) => {
    const value = text(key, max);
    if (!value) errors[key] = message;
    return value;
  };

  const email = required("email", 120, "Add the studio email.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That doesn't look like an email address.";
  const instagram = required("instagram", 200, "Add the Instagram link.");
  if (instagram && !/^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/.test(instagram))
    errors.instagram = "Paste the full profile link, e.g. https://www.instagram.com/art.bythepassenger/";

  const settings: Omit<SiteSettings, "gallery"> = {
    contact: {
      tagline: required("tagline", 80, "Add a short tagline."),
      description: required("description", 300, "Add a one-line description."),
      email,
      instagram,
    },
    about: {
      greeting: required("aboutGreeting", 80, "Add a greeting."),
      paragraphs: paragraphs("aboutParagraphs"),
      signoff: text("aboutSignoff", 200),
    },
    club: {
      name: required("clubName", 80, "Give the club a name."),
      summary: required("clubSummary", 600, "Describe the club in a sentence or two."),
      details: lines("clubDetails"),
      plans: ["monthly", "yearly"].map((id) => ({
        id,
        label: required(`${id}Label`, 30, "Add a plan name."),
        price: required(`${id}Price`, 20, "Add a price, e.g. $8."),
        cadence: text(`${id}Cadence`, 30),
        note: text(`${id}Note`, 120),
      })),
    },
    book: {
      title: required("bookTitle", 120, "Add the book title."),
      summary: text("bookSummary", 600),
      quote: text("bookQuote", 300),
    },
  };
  if (settings.about.paragraphs.length === 0) errors.aboutParagraphs = "Write at least one paragraph.";
  if (Object.keys(errors).length) return { error: "Please fix the highlighted fields.", fieldErrors: errors };

  await updateSettings((current) => Object.assign(current, settings));
  refreshSite();
  redirect("/studio/site?saved=1");
}

// ------------------------------------------------------------------ gallery filters (built-in chips)

export async function saveGalleryFilters(formData: FormData) {
  await requireAdmin();
  const label = (key: string, fallback: string) => String(formData.get(key) ?? "").trim().slice(0, 30) || fallback;
  const on = (key: string) => formData.get(key) === "on";
  const gallery: GalleryFilters = {
    allLabel: label("allLabel", "All works"),
    availableLabel: label("availableLabel", "Available"),
    soldLabel: label("soldLabel", "Found a home"),
    showAvailable: on("showAvailable"),
    showSold: on("showSold"),
    showCounts: on("showCounts"),
    showEmpty: on("showEmpty"),
  };
  await updateSettings((settings) => {
    settings.gallery = gallery;
  });
  refreshSite();
  redirect("/studio/categories?saved=1");
}

// ------------------------------------------------------------------ single-photo forms (letters, news)

/** The optional "image" upload, or null. Adds an error to `errors` when the file isn't usable. */
function readSingleImage(formData: FormData, errors: Record<string, string>) {
  const file = formData.get("image");
  const upload = file instanceof File && file.size > 0 ? file : null;
  if (upload && !upload.type.startsWith("image/")) errors.image = `“${upload.name}” is not an image.`;
  else if (upload && upload.size > MAX_IMAGE_BYTES) errors.image = `“${upload.name}” is larger than 15 MB.`;
  return errors.image ? null : upload;
}

// ------------------------------------------------------------------ letters

export async function saveLetter(originalId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const text = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  const errors: Record<string, string> = {};

  const month = text("month", 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) errors.month = "Choose the month this letter is for.";
  const title = text("title", 120);
  if (!title) errors.title = "Give the letter a title — the message of the month.";
  const message = text("message", 10000)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (message.length === 0) errors.message = "Write the letter (or a preview of it).";
  const visible = formData.get("visible") === "on";
  const removeCurrent = formData.get("removeImage") === "on";
  const upload = readSingleImage(formData, errors);
  if (Object.keys(errors).length) return { error: "Please fix the highlighted fields.", fieldErrors: errors };

  let image: ArtworkImage | null = null;
  if (upload) {
    try {
      image = await storeImage(upload);
    } catch {
      return { error: "The image could not be read. Try saving it as JPG or PNG." };
    }
  }

  const error = await updateLetters(async (list) => {
    const index = originalId ? list.findIndex((l) => l.id === originalId) : -1;
    if (originalId && index === -1) return "This letter no longer exists.";
    if (list.some((l) => l.month === month && l.id !== originalId)) return `There is already a letter for ${month}.`;

    const existing = index >= 0 ? list[index] : null;
    const keepOld = existing?.image && !image && !removeCurrent;
    const letter: Letter = {
      id: existing?.id ?? randomUUID(),
      month,
      title,
      message,
      image: image ?? (keepOld ? existing!.image : null),
      visible,
    };
    // A replaced or removed picture is deleted from disk.
    if (existing?.image && !keepOld) await removeImage(existing.image);
    if (existing) list[index] = letter;
    else list.push(letter);
    return null;
  });

  if (error) {
    if (image) await removeImage(image);
    return { error, fieldErrors: error.startsWith("There is already") ? { month: error } : undefined };
  }
  refreshSite();
  redirect("/studio/letters?saved=1");
}

export async function deleteLetter(id: string) {
  await requireAdmin();
  const removed = await updateLetters((list) => {
    const i = list.findIndex((l) => l.id === id);
    return i === -1 ? null : list.splice(i, 1)[0];
  });
  if (removed?.image) await removeImage(removed.image);
  refreshSite();
  redirect("/studio/letters?deleted=1");
}

export async function toggleLetterVisible(id: string) {
  await requireAdmin();
  await updateLetters((list) => {
    const letter = list.find((l) => l.id === id);
    if (letter) letter.visible = !letter.visible;
  });
  refreshSite();
}

// ------------------------------------------------------------------ news

export async function saveNews(originalSlug: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const text = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  const errors: Record<string, string> = {};

  const date = text("date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) errors.date = "Choose a date.";
  const title = text("title", 140);
  if (!title) errors.title = "Give the post a headline.";
  const summary = text("summary", 280);
  const body = text("body", 20000)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (body.length === 0) errors.body = "Write the news.";
  const published = formData.get("published") === "on";
  const removeCurrent = formData.get("removeImage") === "on";
  const upload = readSingleImage(formData, errors);
  if (Object.keys(errors).length) return { error: "Please fix the highlighted fields.", fieldErrors: errors };

  let image: ArtworkImage | null = null;
  if (upload) {
    try {
      image = await storeImage(upload);
    } catch {
      return { error: "The image could not be read. Try saving it as JPG or PNG." };
    }
  }

  const error = await updateNews(async (list) => {
    const index = originalSlug ? list.findIndex((p) => p.slug === originalSlug) : -1;
    if (originalSlug && index === -1) return "This post no longer exists.";

    const existing = index >= 0 ? list[index] : null;
    const keepOld = existing?.image && !image && !removeCurrent;
    const post: NewsPost = {
      // Keep the old slug so shared links keep working.
      slug: existing?.slug ?? uniqueSlug(slugify(title), list.map((p) => p.slug)),
      date,
      title,
      summary: summary || body[0].slice(0, 200),
      body,
      image: image ?? (keepOld ? existing!.image : null),
      published,
    };
    if (existing?.image && !keepOld) await removeImage(existing.image);
    if (existing) list[index] = post;
    else list.push(post);
    return null;
  });

  if (error) {
    if (image) await removeImage(image);
    return { error };
  }
  refreshSite();
  redirect("/studio/news?saved=1");
}

export async function deleteNews(slug: string) {
  await requireAdmin();
  const removed = await updateNews((list) => {
    const i = list.findIndex((p) => p.slug === slug);
    return i === -1 ? null : list.splice(i, 1)[0];
  });
  if (removed?.image) await removeImage(removed.image);
  refreshSite();
  redirect("/studio/news?deleted=1");
}

export async function toggleNewsPublished(slug: string) {
  await requireAdmin();
  await updateNews((list) => {
    const post = list.find((p) => p.slug === slug);
    if (post) post.published = !post.published;
  });
  refreshSite();
}
