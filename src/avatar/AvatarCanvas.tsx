"use client";

import Image from "next/image";
import { DragEvent } from "react";
import { WardrobeItem } from "@/src/wardrobe/types";

interface AvatarCanvasProps {
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  onUpperWearChange: (item: WardrobeItem | null) => void;
  onLowerWearChange: (item: WardrobeItem | null) => void;
}

export default function AvatarCanvas({
  upperWear,
  lowerWear,
  onUpperWearChange,
  onLowerWearChange,
}: AvatarCanvasProps) {
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    // Each wardrobe card sends its data as JSON when dragged.
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;

    const item = JSON.parse(raw) as WardrobeItem;

    // Drop upper items into the upper slot and lower items into the lower slot.
    if (item.type === "upper") onUpperWearChange(item);
    if (item.type === "lower") onLowerWearChange(item);
  }

  return (
    <div
      className="flex aspect-[1/2] w-72 flex-col gap-4 overflow-hidden rounded-3xl border-4 border-slate-800 bg-white p-4 shadow-xl md:w-96"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="group relative flex h-full w-full flex-col items-center justify-center rounded-2xl border-4 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100 min-h-0 flex-1">
        {upperWear ? (
          <>
            <Image
              src={upperWear.url}
              alt="Upper wear"
              fill
              unoptimized
              className="h-full w-full object-contain p-2"
              sizes="(max-width: 768px) 18rem, 24rem"
            />
            <button
              type="button"
              onClick={() => onUpperWearChange(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-sm text-slate-600 opacity-0 shadow transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              title="Remove upper wear"
            >
              ×
            </button>
          </>
        ) : (
          <span className="text-3xl font-semibold text-slate-400">Upper</span>
        )}
      </div>
      <div className="group relative flex h-full w-full flex-col items-center justify-center rounded-2xl border-4 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100 min-h-0 flex-1">
        {lowerWear ? (
          <>
            <Image
              src={lowerWear.url}
              alt="Lower wear"
              fill
              unoptimized
              className="h-full w-full object-contain p-2"
              sizes="(max-width: 768px) 18rem, 24rem"
            />
            <button
              type="button"
              onClick={() => onLowerWearChange(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-sm text-slate-600 opacity-0 shadow transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              title="Remove lower wear"
            >
              ×
            </button>
          </>
        ) : (
          <span className="text-3xl font-semibold text-slate-400">Lower</span>
        )}
      </div>
    </div>
  );
}
