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
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative aspect-square bg-slate-50">
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
              className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-sm font-medium text-slate-500 shadow-sm hover:text-red-500"
            >
              Remove
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {item.type === "upper" ? "Upper-wear" : "Lower-wear"}
              </p>
              <p className="text-sm text-slate-600">
                {item.isOwned ? "Owned" : "Wishlist"}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {item.isOwned ? "Ready" : "Saved"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
