"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { WardrobeItem } from "@/src/wardrobe/types";

export type AvatarOverlayPlacement = {
  x: number; // px offset from center
  y: number; // px offset from center
  scale: number;
  width?: number; // px
  height?: number; // px
};

type OverlaySlot = "upper" | "lower";

/**
 * Optional per-item placement overrides.
 * This is intentionally kept separate from core app data so you can
 * progressively tune alignment without changing your DB schema yet.
 */
const PLACEMENT_OVERRIDES: Partial<
  Record<string, Partial<Record<OverlaySlot, Partial<AvatarOverlayPlacement>>>>
> = {
  // "some-item-id": { upper: { x: 0, y: -6, scale: 1.05 } },
};

const DEFAULT_PLACEMENT: Record<OverlaySlot, AvatarOverlayPlacement> = {
  // Tuned for a clean default fit on the base silhouette below.
  upper: { x: 0, y: -44, scale: 1.05, width: 220, height: 210 },
  lower: { x: 0, y: 86, scale: 1.06, width: 230, height: 250 },
};

function getPlacement(
  item: WardrobeItem | null,
  slot: OverlaySlot,
): AvatarOverlayPlacement {
  if (!item) return DEFAULT_PLACEMENT[slot];
  const override = PLACEMENT_OVERRIDES[item.id]?.[slot];
  // Ensure width/height exist so the overlay container is stable.
  return { ...DEFAULT_PLACEMENT[slot], ...(override ?? {}) };
}

function overlayStyle(placement: AvatarOverlayPlacement): CSSProperties {
  const translate = `translate(${placement.x}px, ${placement.y}px) scale(${placement.scale})`;

  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: `translate(-50%, -50%) ${translate}`,
    width: placement.width ?? 220,
    height: placement.height ?? 220,
    pointerEvents: "none",
  };
}

function BaseAvatarFigure() {
  // Minimal editorial-style 2D figure: no face/fingers, simple hair.
  // Keep this stable so clothing overlays can be tuned predictably.
  return (
    <svg
      viewBox="0 0 300 560"
      aria-hidden="true"
      className="h-full w-full"
    >
      {/* background */}
      <rect x="0" y="0" width="300" height="560" rx="24" fill="#F8FAFC" />

      {/* subtle floor shadow */}
      <ellipse cx="150" cy="520" rx="78" ry="16" fill="#0F172A" opacity="0.08" />

      {/* hair */}
      <path
        d="M106 94c9-23 31-38 44-38s35 15 44 38c4 10-2 22-9 24-10 3-25-8-35-8s-25 11-35 8c-7-2-13-14-9-24Z"
        fill="#1F2937"
      />

      {/* head (no facial features) */}
      <ellipse cx="150" cy="112" rx="34" ry="40" fill="#D1A58A" />

      {/* neck */}
      <rect x="136" y="144" width="28" height="24" rx="10" fill="#C9987E" />

      {/* torso */}
      <path
        d="M106 180c10-12 27-18 44-18s34 6 44 18c10 12 16 34 16 56 0 18-6 34-16 40-10 6-26 10-44 10s-34-4-44-10c-10-6-16-22-16-40 0-22 6-44 16-56Z"
        fill="#D7B29B"
      />

      {/* arms (simple shapes, no fingers) */}
      <path
        d="M92 214c-10 18-12 42-10 64 2 22 8 40 14 54 4 10 10 16 18 14 8-2 11-10 9-20-4-20-7-43-6-70 1-20 5-36 10-50 4-10 2-18-6-22-8-4-17 0-23 10Z"
        fill="#D1A58A"
        opacity="0.92"
      />
      <path
        d="M208 214c10 18 12 42 10 64-2 22-8 40-14 54-4 10-10 16-18 14-8-2-11-10-9-20 4-20 7-43 6-70-1-20-5-36-10-50-4-10-2-18 6-22 8-4 17 0 23 10Z"
        fill="#D1A58A"
        opacity="0.92"
      />

      {/* hips */}
      <path
        d="M108 286c10-8 26-12 42-12s32 4 42 12c8 6 14 18 14 30 0 14-5 24-14 30-10 6-26 10-42 10s-32-4-42-10c-9-6-14-16-14-30 0-12 6-24 14-30Z"
        fill="#CFA790"
      />

      {/* legs */}
      <path
        d="M124 344c8-8 18-12 26-12s18 4 26 12c8 8 12 22 12 38v122c0 12-8 22-18 22h-40c-10 0-18-10-18-22V382c0-16 4-30 12-38Z"
        fill="#D7B29B"
      />

      {/* split legs suggestion */}
      <rect x="148" y="340" width="4" height="188" rx="2" fill="#0F172A" opacity="0.06" />

      {/* simple shoes */}
      <path
        d="M116 520c0-10 8-18 18-18h24c10 0 18 8 18 18v6H116v-6Z"
        fill="#0F172A"
        opacity="0.22"
      />
      <path
        d="M168 520c0-10 8-18 18-18h24c10 0 18 8 18 18v6h-60v-6Z"
        fill="#0F172A"
        opacity="0.22"
      />
    </svg>
  );
}

export default function AvatarPreview({
  upperWear,
  lowerWear,
}: {
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
}) {
  const upperPlacement = getPlacement(upperWear, "upper");
  const lowerPlacement = getPlacement(lowerWear, "lower");

  return (
    <section className="flex w-full flex-col">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">
            Avatar Preview
          </h2>
          <p className="text-sm text-slate-600">
            Updates instantly when you change Upper/Lower slots.
          </p>
        </div>
      </div>

      <div className="relative w-full flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative mx-auto aspect-[3/5] w-full max-w-[360px] p-4">
          {/* Base avatar always visible */}
          <div className="absolute inset-4">
            <BaseAvatarFigure />
          </div>

          {/* Upper overlay */}
          {upperWear?.url ? (
            <div
              style={overlayStyle(upperPlacement)}
              className="relative z-10"
            >
              <Image
                src={upperWear.url}
                alt="Upper clothing preview"
                unoptimized
                fill
                className="object-contain"
                sizes="360px"
                // Future: you can add per-item masking/cutout improvements here.
              />
            </div>
          ) : null}

          {/* Lower overlay */}
          {lowerWear?.url ? (
            <div
              style={overlayStyle(lowerPlacement)}
              className="relative z-10"
            >
              <Image
                src={lowerWear.url}
                alt="Lower clothing preview"
                unoptimized
                fill
                className="object-contain"
                sizes="360px"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

