"use client";

import Image from "next/image";
import { WardrobeItem } from "./types";

interface WardrobeGridProps {
  items: WardrobeItem[];
  onRemove: (id: string) => void;
}

export default function WardrobeGrid({
  items,
  onRemove,
}: WardrobeGridProps) {
  const getLabel = (type: WardrobeItem["type"]) => {
    if (type === "upper") return "Upper-wear";
    if (type === "lower") return "Lower-wear";
    if (type === "shoes") return "Shoes";
    return "Accessories";
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-2xl border border-border-theme bg-surface shadow-sm"
        >
          {/* Add 'group' here so the hover effect targets the button */}
          <div className="group relative aspect-square bg-surface-alt">
            <Image
              src={item.url}
              alt={`Wardrobe item ${index + 1}`}
              fill
              unoptimized
              sizes="(max-width: 1024px) 50vw, 33vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />

            {/* Sleek 'X' button that appears on hover */}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-lg text-foreground/50 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
              title="Remove item"
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm font-semibold text-foreground">
              {getLabel(item.type)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
