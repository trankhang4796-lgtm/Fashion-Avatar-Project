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
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-2xl border border-border-theme bg-surface shadow-sm"
        >
          <div className="relative aspect-square bg-surface-alt">
            <Image
              src={item.url}
              alt={`Wardrobe item ${index + 1}`}
              fill
              unoptimized
              sizes="(max-width: 1024px) 50vw, 33vw"
              className="object-contain p-3"
            />
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute right-3 top-3 rounded-full border border-border-theme bg-surface px-2.5 py-1 text-sm font-medium text-foreground/70 shadow-sm hover:text-red-500"
            >
              Remove
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {item.type === "upper" ? "Upper-wear" : "Lower-wear"}
              </p>
              <p className="text-sm text-foreground">
                {item.isOwned ? "Owned" : "Wishlist"}
              </p>
            </div>
            <span className="rounded-full border border-border-theme bg-background px-3 py-1 text-xs font-medium text-foreground">
              {item.isOwned ? "Ready" : "Saved"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
