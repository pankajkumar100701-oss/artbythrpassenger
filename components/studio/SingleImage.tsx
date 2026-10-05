"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ArtworkImage } from "@/lib/artwork-types";
import { shrink } from "./shrink";

/** State for an optional single photo (letters, news). The server reads "image" and "removeImage". */
export function useSingleImage(saved: ArtworkImage | null) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeSaved, setRemoveSaved] = useState(false);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return {
    file,
    preview,
    current: saved && !removeSaved ? saved : null,
    pick(next: File) {
      setFile(next);
      setPreview(URL.createObjectURL(next));
    },
    clearNew() {
      setFile(null);
      setPreview(null);
    },
    removeSaved: () => setRemoveSaved(true),
    /** Puts the (shrunk) photo and the remove flag into the form data before submit. */
    async addTo(data: FormData) {
      data.delete("image");
      if (removeSaved) data.set("removeImage", "on");
      if (file) data.set("image", await shrink(file), file.name.replace(/\.\w+$/, ".jpg"));
    },
  };
}

type Props = { image: ReturnType<typeof useSingleImage>; error?: string };

export function SingleImagePicker({ image, error }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  function pick(files: FileList | null) {
    const next = files?.[0];
    if (next) image.pick(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <>
      <div className="image-grid">
        {image.preview ? (
          <figure className="image-tile is-new">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={image.preview} alt="" />
            <span className="image-new">New</span>
            <div className="image-tools">
              <button type="button" onClick={image.clearNew} aria-label="Remove image">
                ✕
              </button>
            </div>
          </figure>
        ) : image.current ? (
          <figure className="image-tile">
            <Image src={image.current.src} alt="" width={160} height={160} />
            <div className="image-tools">
              <button type="button" onClick={image.removeSaved} aria-label="Remove image">
                ✕
              </button>
            </div>
          </figure>
        ) : null}
        <button
          type="button"
          className="image-add"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files);
          }}
        >
          <span aria-hidden="true">＋</span>
          {image.preview || image.current ? "Replace photo" : "Add photo"}
          <small>or drop it here</small>
        </button>
      </div>
      <input ref={fileInput} type="file" name="image" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
      {error && <p className="field-error">{error}</p>}
    </>
  );
}
