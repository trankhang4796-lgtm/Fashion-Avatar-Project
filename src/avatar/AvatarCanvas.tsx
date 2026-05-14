"use client";

import Image from "next/image";
import { DragEvent } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { WardrobeItem } from "@/src/wardrobe/types";

interface AvatarCanvasProps {
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  shoes: WardrobeItem | null;
  accessories: WardrobeItem[];
  onUpperWearChange: (item: WardrobeItem | null) => void;
  onLowerWearChange: (item: WardrobeItem | null) => void;
  onShoesChange: (item: WardrobeItem | null) => void;
  onAccessoriesChange: (items: WardrobeItem[]) => void;
}

function parseDraggedItem(event: DragEvent<HTMLDivElement>) {
  const raw = event.dataTransfer.getData("application/json");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WardrobeItem;
  } catch {
    return null;
  }
}

const slotBaseClasses =
  "group relative overflow-hidden rounded-2xl border-4 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100";

const getAccessoryItemSize = (count: number) => {
  if (count <= 1) return 112; // Increased from 96
  if (count === 2) return 92; // Increased from 78
  if (count <= 4) return 72; // Increased from 62
  return 56; // Increased from 48
};

function getOutfitSlotImageClass(
  slot: "upper" | "lower" | "shoes" | "accessory",
) {
  if (slot === "accessory") {
    return "object-contain p-1.5 transition-transform duration-200 will-change-transform";
  }

  return "object-contain p-3 sm:p-4 transition-transform duration-200 will-change-transform";
}

const removeButtonClass =
  "absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/40 text-xs text-white backdrop-blur-sm transition-all duration-200 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500/90 pointer-events-auto";

export default function AvatarCanvas({
  upperWear,
  lowerWear,
  shoes,
  accessories,
  onUpperWearChange,
  onLowerWearChange,
  onShoesChange,
  onAccessoriesChange,
}: AvatarCanvasProps) {
  const { customAvatarUrl } = useWardrobe();
  const accessoryItemSize = getAccessoryItemSize(accessories.length);
  const dropShieldClasses = "pointer-events-none";

  const handleGlobalDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const item = parseDraggedItem(event);
    if (!item) return;
    if (item.type === "upper") {
      onUpperWearChange(item);
    } else if (item.type === "lower") {
      onLowerWearChange(item);
    } else if (item.type === "shoes") {
      onShoesChange(item);
    } else if (item.type === "accessories" || item.type === "accessory") {
      if (accessories.some((existing) => existing.id === item.id)) return;
      onAccessoriesChange([...accessories, item]);
    }
  };

  return (
    <div
      className="flex h-auto min-h-full lg:h-full w-full items-center justify-center p-2 sm:p-4 lg:pb-8"
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleGlobalDrop}
    >
      <div className="flex h-auto w-fit max-w-full flex-col lg:flex-row gap-3 lg:gap-4 items-center lg:items-start rounded-3xl border-4 border-slate-800 bg-white p-3 sm:p-4 shadow-xl dark:bg-surface">
        <div className="w-[320px] max-w-full h-[400px] sm:h-[480px] lg:h-[600px] shrink-0 rounded-2xl overflow-hidden relative bg-white border border-border-theme dark:bg-surface-alt">
          {customAvatarUrl ? (
            <Image
              src={customAvatarUrl}
              alt="Custom avatar"
              fill
              unoptimized
              className={`object-contain p-2 ${dropShieldClasses}`}
              sizes="320px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center">
              <p className="max-w-[18rem] text-sm font-medium text-slate-600">
                Upload a base avatar to preview AI try-on generation.
              </p>
            </div>
          )}
        </div>

        <div className="grid w-full max-w-[320px] lg:max-w-none grid-cols-2 lg:grid-cols-[240px_220px] gap-3 lg:gap-4">
          <div
            className={
              "col-span-1 lg:col-start-1 lg:row-start-1 h-[200px] relative flex items-center justify-center " +
              slotBaseClasses
            }
          >
            {upperWear ? (
              <>
                <Image
                  src={upperWear.url}
                  alt="Upper wear"
                  fill
                  unoptimized
                  className={`${getOutfitSlotImageClass("upper")} ${dropShieldClasses}`}
                  sizes="240px"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpperWearChange(null);
                  }}
                  className={removeButtonClass}
                  aria-label="Remove upper wear"
                  title="Remove upper wear"
                >
                  ✕
                </button>
              </>
            ) : (
              <span className={`text-lg font-semibold text-slate-400 ${dropShieldClasses}`}>Upper</span>
            )}
          </div>

          <div
            className={
              "col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 min-h-[160px] h-[200px] relative flex items-center justify-center " +
              (accessories.length > 0
                ? slotBaseClasses.replace(/\bgroup\s+/, "")
                : slotBaseClasses) +
              (accessories.length > 0 ? " p-2" : "")
            }
          >
            {accessories.length === 0 ? (
              <span className={`text-sm font-semibold text-slate-400 ${dropShieldClasses}`}>Accessory</span>
            ) : (
              <div
                className={`flex h-full w-full flex-row flex-wrap content-center items-center justify-center gap-2 overflow-hidden ${dropShieldClasses}`}
              >
                {accessories.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white"
                    style={{
                      width: accessoryItemSize,
                      height: accessoryItemSize,
                    }}
                  >
                    <Image
                      src={item.url}
                      alt="Accessory"
                      fill
                      unoptimized
                      className={`${getOutfitSlotImageClass("accessory")} ${dropShieldClasses}`}
                      sizes={`${accessoryItemSize}px`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAccessoriesChange(
                          accessories.filter((a) => a.id !== item.id),
                        );
                      }}
                      className={`${removeButtonClass} md:opacity-0 md:group-hover:opacity-100`}
                      aria-label="Remove accessory"
                      title="Remove accessory"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className={
              "col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-2 h-[220px] lg:h-[250px] relative flex items-center justify-center " +
              slotBaseClasses
            }
          >
            {lowerWear ? (
              <>
                <Image
                  src={lowerWear.url}
                  alt="Lower wear"
                  fill
                  unoptimized
                  className={`${getOutfitSlotImageClass("lower")} ${dropShieldClasses}`}
                  sizes="240px"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLowerWearChange(null);
                  }}
                  className={removeButtonClass}
                  aria-label="Remove lower wear"
                  title="Remove lower wear"
                >
                  ✕
                </button>
              </>
            ) : (
              <span className={`text-lg font-semibold text-slate-400 ${dropShieldClasses}`}>Lower</span>
            )}
          </div>

          <div
            className={
              "col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-3 h-[120px] lg:h-[118px] relative flex items-center justify-center " +
              slotBaseClasses
            }
          >
            {shoes ? (
              <>
                <Image
                  src={shoes.url}
                  alt="Shoes"
                  fill
                  unoptimized
                  className={`${getOutfitSlotImageClass("shoes")} ${dropShieldClasses}`}
                  sizes="240px"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShoesChange(null);
                  }}
                  className={removeButtonClass}
                  aria-label="Remove shoes"
                  title="Remove shoes"
                >
                  ✕
                </button>
              </>
            ) : (
              <span className={`text-base font-semibold text-slate-400 ${dropShieldClasses}`}>Shoes</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
