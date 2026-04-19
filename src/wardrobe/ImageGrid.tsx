"use client";

import type { ClothingItem } from "./WardrobeSidebar";

interface ImageGridProps {
  images: ClothingItem[];
  onRemove: (id: string) => void;
}

export default function ImageGrid({ images, onRemove }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
      {images.map((item, index) => (
        <div
          key={item.id}
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.setData("application/json", JSON.stringify(item));
          }}
          className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-slate-200 bg-slate-50 active:cursor-grabbing"
        >
          {/* Delete button (restored and safeguarded) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the drag event from swallowing the click
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
      ))}
    </div>
  );
}
