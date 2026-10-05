"use client";

import Image from "next/image";
import { startTransition, useActionState, useRef, useState } from "react";
import type { FormState } from "@/app/studio/actions";
import type { Artwork, Category } from "@/lib/artwork-types";
import { shrink } from "./shrink";

type Props = {
  artwork?: Artwork;
  categories: Category[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

type NewImage = { id: string; file: File; preview: string };

export function ArtworkForm({ artwork, categories, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [kept, setKept] = useState(artwork?.images ?? []);
  const [added, setAdded] = useState<NewImage[]>([]);
  const [preparing, setPreparing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const errors = state?.fieldErrors ?? {};
  const busy = pending || preparing;

  function addFiles(files: FileList | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/") || f.name.match(/\.(heic|heif)$/i));
    setAdded((cur) => [...cur, ...list.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeAdded(id: string) {
    setAdded((cur) => {
      const item = cur.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return cur.filter((i) => i.id !== id);
    });
  }

  function moveKept(index: number, dir: -1 | 1) {
    setKept((cur) => {
      const next = [...cur];
      const j = index + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.delete("newImages");
    data.set("keepImages", JSON.stringify(kept.map((img) => img.src)));
    setPreparing(true);
    const blobs = await Promise.all(added.map((a) => shrink(a.file)));
    blobs.forEach((blob, i) => data.append("newImages", blob, added[i].file.name.replace(/\.\w+$/, ".jpg")));
    setPreparing(false);
    startTransition(() => formAction(data));
  }

  const totalImages = kept.length + added.length;

  return (
    <form className="studio-form" onSubmit={handleSubmit} noValidate>
      {state?.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}

      <section className="studio-card">
        <h2 className="studio-card-title">Images</h2>
        <p className="muted">The first image is the cover shown in the gallery.</p>

        <div className="image-grid">
          {kept.map((img, i) => (
            <figure key={img.src} className="image-tile">
              <Image src={img.src} alt="" width={160} height={160} />
              {i === 0 && <span className="image-cover">Cover</span>}
              <div className="image-tools">
                <button type="button" onClick={() => moveKept(i, -1)} disabled={i === 0} aria-label="Move earlier">
                  ←
                </button>
                <button type="button" onClick={() => moveKept(i, 1)} disabled={i === kept.length - 1} aria-label="Move later">
                  →
                </button>
                <button type="button" onClick={() => setKept((c) => c.filter((x) => x.src !== img.src))} aria-label="Remove image">
                  ✕
                </button>
              </div>
            </figure>
          ))}
          {added.map((img, i) => (
            <figure key={img.id} className="image-tile is-new">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={img.preview} alt="" />
              {kept.length === 0 && i === 0 && <span className="image-cover">Cover</span>}
              <span className="image-new">New</span>
              <div className="image-tools">
                <button type="button" onClick={() => removeAdded(img.id)} aria-label="Remove image">
                  ✕
                </button>
              </div>
            </figure>
          ))}
          <button
            type="button"
            className="image-add"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <span aria-hidden="true">＋</span>
            Add photos
            <small>or drop them here</small>
          </button>
        </div>
        <input ref={fileInput} type="file" name="newImages" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        {(errors.newImages || (state?.error && totalImages === 0)) && <p className="field-error">{errors.newImages ?? "Add at least one image."}</p>}
      </section>

      <section className="studio-card">
        <h2 className="studio-card-title">Details</h2>
        <div className="form">
          <Field label="Title *" error={errors.title}>
            <input name="title" className="input" defaultValue={artwork?.title} required maxLength={120} placeholder="e.g. Alpenglow" />
          </Field>
          <div className="field-row">
            <Field label="Status">
              <select name="status" className="input" defaultValue={artwork?.status ?? "available"}>
                <option value="available">Available</option>
                <option value="sold">Sold — found its home</option>
              </select>
            </Field>
            <Field label="Price (USD)" error={errors.price} hint="Leave empty to hide the price.">
              <input name="price" className="input" inputMode="decimal" defaultValue={artwork?.price ?? ""} placeholder="e.g. 120" />
            </Field>
          </div>
          <div className="field-row">
            <Field label="Category" error={errors.category} hint="Gallery filter. Manage the list under Categories.">
              <select name="category" className="input" defaultValue={artwork?.category ?? categories[0]?.id}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year" error={errors.year}>
              <input name="year" className="input" inputMode="numeric" defaultValue={artwork?.year ?? new Date().getFullYear()} />
            </Field>
          </div>
          <Field label="Medium" hint="Shown under the title, e.g. “Watercolour on paper (300gsm), framed”.">
            <input name="medium" className="input" defaultValue={artwork?.medium} maxLength={200} />
          </Field>
          <Field label="Dimensions">
            <input name="size" className="input" defaultValue={artwork?.size} maxLength={120} placeholder="e.g. 33.5 × 44.5 cm" />
          </Field>
          <Field label="The story behind it" hint="Leave an empty line between paragraphs.">
            <textarea name="story" className="input" rows={7} defaultValue={artwork?.story.join("\n\n")} />
          </Field>
        </div>
      </section>

      <div className="studio-actions">
        <button className="btn btn-accent" disabled={busy}>
          {preparing ? "Preparing images…" : pending ? "Saving…" : artwork ? "Save changes" : "Publish artwork"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
