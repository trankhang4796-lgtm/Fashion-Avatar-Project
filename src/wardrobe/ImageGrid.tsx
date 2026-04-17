"use client";

import Image from "next/image";
import { WardrobeItem } from "./types";

interface ImageGridProps {
  images: WardrobeItem[];
  onRemove: (id: string) => void;
}

export default function ImageGrid({ images, onRemove }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          {/* Delete button appears on hover */}
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="absolute top-1 right-1 rounded-full bg-white/70 p-1 text-slate-500 opacity-0 backdrop-blur-sm transition-colors group-hover:opacity-100 hover:bg-slate-100 hover:text-red-500"
            title="Remove item"
          >
            ×
          </button>
          {/* The uploaded image */}
          <Image
            src={image.url}
            alt={`Uploaded clothing item ${index + 1}`}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-contain"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 text-[11px] text-white">
            {image.type === "upper" ? "Upper-wear" : "Lower-wear"} ·{" "}
            {image.isOwned ? "Owned" : "Wishlist"}
          </div>
        </div>
      ))}
    </div>
  );
}
