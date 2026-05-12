"use client";

import Image from "next/image";
import { DragEvent, useEffect, useRef, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { useBetaSettings } from "@/src/hooks/useBetaSettings";
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

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
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

function slotLabel(type: WardrobeItem["type"]) {
  if (type === "upper") return "Upper";
  if (type === "lower") return "Lower";
  if (type === "shoes") return "Shoes";
  return "Accessories";
}

const slotBaseClasses =
  "group relative overflow-hidden rounded-2xl border-4 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100";

const clothingSlotSizeClasses =
  "w-[400px] max-w-full h-[220px] lg:h-[228px]";
const shoesSlotSizeClasses =
  "h-[126px] w-[320px] max-w-full";
const accessorySlotSizeClasses =
  "h-[220px] w-[140px] lg:h-[228px]";

function getOutfitSlotImageClass(
  slot: "upper" | "lower" | "shoes" | "accessory",
) {
  const baseClass =
    "object-contain transition-transform duration-200 will-change-transform";

  if (slot === "upper") return `${baseClass} scale-[1.38]`;
  if (slot === "lower") return `${baseClass} scale-[1.45]`;
  if (slot === "shoes") return `${baseClass} scale-[1.6]`;

  return `${baseClass} scale-110`;
}

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
  const { customAvatarUrl, setCustomAvatarUrl } = useWardrobe();
  const { betaFeaturesEnabled } = useBetaSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slotMessage, setSlotMessage] = useState("");

  useEffect(() => {
    if (!slotMessage) return;
    const timer = window.setTimeout(() => setSlotMessage(""), 2400);
    return () => window.clearTimeout(timer);
  }, [slotMessage]);

  const showMismatchMessage = (
    expected: string,
    received: WardrobeItem["type"],
  ) => {
    setSlotMessage(
      `${slotLabel(received)} item cannot be placed here. This slot accepts ${expected} only.`,
    );
  };

  const handleDropUpper = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const item = parseDraggedItem(event);
    if (!item) return;
    if (item.type !== "upper") {
      showMismatchMessage("Upper-wear", item.type);
      return;
    }
    onUpperWearChange(item);
  };

  const handleDropLower = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const item = parseDraggedItem(event);
    if (!item) return;
    if (item.type !== "lower") {
      showMismatchMessage("Lower-wear", item.type);
      return;
    }
    onLowerWearChange(item);
  };

  const handleDropShoes = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const item = parseDraggedItem(event);
    if (!item) return;
    if (item.type !== "shoes") {
      showMismatchMessage("Shoes", item.type);
      return;
    }
    onShoesChange(item);
  };

  const handleDropAccessories = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const item = parseDraggedItem(event);
    if (!item) return;
    if (item.type !== "accessories") {
      showMismatchMessage("Accessories", item.type);
      return;
    }
    if (accessories.some((existingItem) => existingItem.id === item.id)) return;
    onAccessoriesChange([...accessories, item]);
  };

  const removeAccessory = (id: string) => {
    onAccessoriesChange(accessories.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full" onDragOver={(e) => e.preventDefault()}>
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

      {slotMessage ? (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {slotMessage}
        </p>
      ) : null}

      {!betaFeaturesEnabled ? (
        <div className="mx-auto w-fit max-w-full rounded-3xl border-4 border-slate-800 bg-white p-4 shadow-xl dark:bg-surface">
          <div className="flex min-h-0 max-h-[min(80dvh,56rem)] flex-col gap-3 overflow-y-auto overflow-x-hidden p-2">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-3">
              <div className="flex w-[400px] max-w-full flex-col gap-3">
                <div
                  className={`relative flex ${clothingSlotSizeClasses} items-center justify-center ${slotBaseClasses}`}
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
                        className={getOutfitSlotImageClass("upper")}
                        sizes="400px"
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

                <div
                  className={`relative flex ${clothingSlotSizeClasses} items-center justify-center ${slotBaseClasses}`}
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
                        className={getOutfitSlotImageClass("lower")}
                        sizes="400px"
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

                <div
                  className={`relative mx-auto flex ${shoesSlotSizeClasses} items-center justify-center ${slotBaseClasses}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropShoes}
                >
                  {shoes ? (
                    <>
                      <Image
                        src={shoes.url}
                        alt="Shoes"
                        fill
                        unoptimized
                        className={getOutfitSlotImageClass("shoes")}
                        sizes="320px"
                      />
                      <button
                        type="button"
                        onClick={() => onShoesChange(null)}
                        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-sm text-slate-600 opacity-0 shadow transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Remove shoes"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-slate-400">Shoes</span>
                  )}
                </div>
              </div>

              <div
                className={`relative ${accessorySlotSizeClasses} ${slotBaseClasses} ${
                  accessories.length > 0 ? "p-2" : "flex items-center justify-center"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropAccessories}
              >
                {accessories.length === 0 ? (
                  <span className="text-sm font-semibold text-slate-400">Accessory</span>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {accessories.map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white"
                      >
                        <Image
                          src={item.url}
                          alt="Accessory"
                          fill
                          unoptimized
                          className={getOutfitSlotImageClass("accessory")}
                          sizes="68px"
                        />
                        <button
                          type="button"
                          onClick={() => removeAccessory(item.id)}
                          className="absolute right-1 top-1 rounded-full bg-white/95 px-1.5 text-xs text-slate-600 opacity-0 shadow transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Remove accessory"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-fit max-w-full rounded-3xl border-4 border-slate-800 bg-white p-4 shadow-xl dark:bg-surface">
          <div className="relative mb-3 h-[280px] w-[420px] overflow-hidden rounded-2xl">
            {customAvatarUrl ? (
              <Image
                src={customAvatarUrl}
                alt="Custom avatar"
                fill
                unoptimized
                className="object-contain"
                sizes="420px"
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

          <div className="flex min-h-0 max-h-[min(calc(100dvh-22rem),48rem)] flex-col gap-3 overflow-y-auto overflow-x-hidden border-t border-slate-200 p-2 pt-3">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-3">
              <div className="flex w-[400px] max-w-full flex-col gap-3">
                <div
                  className="group relative flex h-[220px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-transparent lg:h-[228px]"
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
                        className={getOutfitSlotImageClass("upper")}
                        sizes="400px"
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
                    <span className="text-lg font-semibold text-slate-400">Upper</span>
                  )}
                </div>

                <div
                  className="group relative flex h-[220px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-transparent lg:h-[228px]"
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
                        className={getOutfitSlotImageClass("lower")}
                        sizes="400px"
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
                    <span className="text-lg font-semibold text-slate-400">Lower</span>
                  )}
                </div>

                <div
                  className="group relative mx-auto flex h-[126px] w-[320px] max-w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-transparent"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropShoes}
                >
                  {shoes ? (
                    <>
                      <Image
                        src={shoes.url}
                        alt="Shoes"
                        fill
                        unoptimized
                        className={getOutfitSlotImageClass("shoes")}
                        sizes="320px"
                      />
                      <button
                        type="button"
                        onClick={() => onShoesChange(null)}
                        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-sm text-slate-600 opacity-0 shadow transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Remove shoes"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span className="text-base font-semibold text-slate-400">Shoes</span>
                  )}
                </div>
              </div>

              <div
                className={`relative h-[220px] w-[140px] rounded-xl border-2 border-dashed border-slate-300 lg:h-[228px] ${
                  accessories.length > 0 ? "bg-transparent p-2" : "flex items-center justify-center bg-transparent"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropAccessories}
              >
                {accessories.length === 0 ? (
                  <span className="text-sm font-semibold text-slate-400">Accessory</span>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {accessories.map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white/80"
                      >
                        <Image
                          src={item.url}
                          alt="Accessory"
                          fill
                          unoptimized
                          className={getOutfitSlotImageClass("accessory")}
                          sizes="68px"
                        />
                        <button
                          type="button"
                          onClick={() => removeAccessory(item.id)}
                          className="absolute right-1 top-1 rounded-full bg-white/95 px-1.5 text-xs text-slate-600 opacity-0 shadow transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Remove accessory"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
