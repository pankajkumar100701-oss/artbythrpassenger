"use client";

import Image from "next/image";
import { useState } from "react";
import type { ArtworkImage } from "@/lib/artwork-types";
import { TiltCard } from "./TiltCard";

export function ArtworkViewer({ images, title }: { images: ArtworkImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className="viewer">
      <TiltCard className="viewer-main" max={4}>
        <Image
          key={current.src}
          src={current.src}
          alt={images.length > 1 ? `${title} — view ${index + 1} of ${images.length}` : title}
          width={current.width}
          height={current.height}
          sizes="(max-width: 960px) 92vw, 55vw"
          preload={index === 0}
        />
      </TiltCard>

      {images.length > 1 && (
        <div className="viewer-thumbs" role="tablist" aria-label="Views">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View ${i + 1}`}
              className="viewer-thumb"
              onClick={() => setIndex(i)}
            >
              <Image src={img.src} alt="" width={96} height={96} sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
