"use client";

import type { ClothingItem } from "./WardrobeSidebar";

interface ImageGridProps {
  images: ClothingItem[];
  onRemove: (id: string) => void;
  selectedItemIds?: string[];
  onItemToggle?: (item: ClothingItem) => void;
}

export default function ImageGrid({
  images,
  onRemove,
  selectedItemIds,
  onItemToggle,
}: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {images.map((item, index) => {
        const isSelected = selectedItemIds?.includes(item.id) ?? false;

        return (
          <div
            key={item.id}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/json", JSON.stringify(item));
            }}
            onClick={() => onItemToggle?.(item)}
            className={[
              "group relative aspect-square overflow-hidden rounded-lg border bg-slate-50",
              isSelected
                ? "ring-4 ring-brand-mint border-transparent"
                : "border-slate-200",
              onItemToggle ? "cursor-pointer" : "cursor-grab",
              "active:cursor-grabbing",
            ].join(" ")}
          >
            {/* Delete button (restored and safeguarded) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
              title="Remove item"
            >
              ×
            </button>

            {/* The uploaded image */}
            <img
              src={item.url}
              alt={`Uploaded clothing item ${index + 1}`}
              className="pointer-events-none h-full w-full object-contain p-1"
            />
          </div>
        );
      })}
    </div>
  );
}
