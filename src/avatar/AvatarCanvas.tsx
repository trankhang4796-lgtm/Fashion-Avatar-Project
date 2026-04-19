"use client";

import Image from "next/image";
import { useState } from "react";

export default function AvatarCanvas() {
  const [upperWear, setUpperWear] = useState<any>(null);
  const [lowerWear, setLowerWear] = useState<any>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const item = JSON.parse(raw);
    if (item.type === "upper") setUpperWear(item);
    if (item.type === "lower") setLowerWear(item);
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
              onClick={() => setUpperWear(null)}
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
              onClick={() => setLowerWear(null)}
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
