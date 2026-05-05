"use client";

import Image from "next/image";
import { DragEvent, useRef } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { useBetaSettings } from "@/src/hooks/useBetaSettings";
import { WardrobeItem } from "@/src/wardrobe/types";

interface AvatarCanvasProps {
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  onUpperWearChange: (item: WardrobeItem | null) => void;
  onLowerWearChange: (item: WardrobeItem | null) => void;
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

export default function AvatarCanvas({
  upperWear,
  lowerWear,
  onUpperWearChange,
  onLowerWearChange,
}: AvatarCanvasProps) {
  const { customAvatarUrl, setCustomAvatarUrl } = useWardrobe();
  const { betaFeaturesEnabled } = useBetaSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDropUpper(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    const item = JSON.parse(raw) as WardrobeItem;
    if (item.type === "upper") onUpperWearChange(item);
  }

  function handleDropLower(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    const item = JSON.parse(raw) as WardrobeItem;
    if (item.type === "lower") onLowerWearChange(item);
  }

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
      className="flex aspect-[1/2] w-72 flex-col gap-4 overflow-hidden rounded-3xl border-4 border-slate-800 bg-white dark:bg-surface p-4 shadow-xl md:w-96"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.webp,.bmp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/")) {
            alert("Please upload an image file.");
            e.target.value = "";
            return;
          }

          try {
            const url = await fileToDataUrl(file);
            setCustomAvatarUrl(url);
          } catch (error) {
            console.error("Unable to save custom avatar", error);
            alert("Unable to read that file. Please try a different image.");
          } finally {
            e.target.value = "";
          }
        }}
      />

      {!betaFeaturesEnabled ? (
        <div className="relative flex min-h-0 flex-1 flex-col gap-4">
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
              <span className="text-3xl font-semibold text-slate-400">
                Upper
              </span>
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
              <span className="text-3xl font-semibold text-slate-400">
                Lower
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="relative flex-1 w-full overflow-hidden rounded-2xl">
            {customAvatarUrl ? (
              <Image
                src={customAvatarUrl}
                alt="Custom avatar"
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 768px) 18rem, 24rem"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-center">
                <p className="max-w-[18rem] text-sm font-medium text-slate-600">
                  Upload a base avatar to preview AI try-on generation.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 top-3 z-20 rounded-full border border-slate-300 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white"
            >
              📷 Upload Avatar
            </button>
          </div>

          <div className="w-full h-1/4 min-h-[120px] flex flex-row gap-3 border-t border-slate-200 pt-3">
            <div
              className="group relative flex-1 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-transparent"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropUpper}
            >
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
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-sm font-semibold text-slate-400">
                    Upper
                  </span>
                </div>
              )}
            </div>

            <div
              className="group relative flex-1 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-transparent"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropLower}
            >
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
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-sm font-semibold text-slate-400">
                    Lower
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
