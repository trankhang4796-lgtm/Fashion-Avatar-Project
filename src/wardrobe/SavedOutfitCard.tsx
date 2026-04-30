"use client";

import Image from "next/image";
import type { SavedOutfit } from "@/src/utils/outfits";
import { deleteOutfitFromCloud, toggleOutfitPublish } from "@/src/utils/outfits";

interface SavedOutfitCardProps {
  outfit: SavedOutfit;
}

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Saved recently";
  }

  return date.toLocaleString();
}

function getItemSummary(
  item: SavedOutfit["upperWear"] | SavedOutfit["lowerWear"],
  emptyLabel: string,
) {
  if (!item) {
    return emptyLabel;
  }

  return `${item.isOwned ? "Owned" : "Wishlist"} item`;
}

function PreviewTile({
  imageSrc,
  alt,
  label,
}: {
  imageSrc: string | null;
  alt: string;
  label: string;
}) {
  return (
    <div className="flex-1">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border-theme bg-surface-alt">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={alt}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, 180px"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-foreground/60">
            No {label}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SavedOutfitCard({ outfit }: SavedOutfitCardProps) {
  return (
    <article className="rounded-2xl border border-border-theme bg-surface text-foreground p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground truncate pr-2">{outfit.name}</h3>
          <p className="mt-1 text-sm text-foreground/70">
            {formatCreatedAt(outfit.createdAt)}
          </p>
        </div>

        {outfit.isFavorite ? (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            Favorite
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await toggleOutfitPublish(outfit.id, !outfit.isPublished);
            } catch (err: any) {
              alert(err.message);
            }
          }}
          className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
            outfit.isPublished
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {outfit.isPublished ? "Remove from Community" : "Publish to Community"}
        </button>

        <button
          type="button"
          onClick={async () => {
            const confirmDelete = window.confirm(
              "Are you sure you want to permanently delete this outfit? This cannot be undone.",
            );
            if (!confirmDelete) return;

            try {
              await deleteOutfitFromCloud(outfit.id);
            } catch (err) {
              console.error("Failed to delete outfit:", err);
              alert("Failed to delete the outfit. Please try again.");
            }
          }}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-border-theme bg-surface-alt p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/70">
          Outfit Preview
        </p>
        <div className="flex flex-col gap-2">
          <PreviewTile
            imageSrc={outfit.upperWearImage}
            alt={`${outfit.name} upper wear`}
            label="Upper"
          />
          <PreviewTile
            imageSrc={outfit.lowerWearImage}
            alt={`${outfit.name} lower wear`}
            label="Lower"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-border-theme bg-surface-alt p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
            Upper Wear
          </p>
          <p className="mt-1 text-sm text-foreground">
            {getItemSummary(outfit.upperWear, "No upper wear selected")}
          </p>
        </div>

        <div className="rounded-xl border border-border-theme bg-surface-alt p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
            Lower Wear
          </p>
          <p className="mt-1 text-sm text-foreground">
            {getItemSummary(outfit.lowerWear, "No lower wear selected")}
          </p>
        </div>
      </div>
    </article>
  );
}
