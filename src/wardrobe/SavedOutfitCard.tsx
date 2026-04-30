"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
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
  const router = useRouter();
  const { editingOutfit, setEditingOutfit } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);

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
          onClick={() => {
            setEditingOutfit(outfit);
            router.push("/dashboard");
          }}
          className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
            editingOutfit?.id === outfit.id
              ? "bg-brand-mint text-white border-brand-mint"
              : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-border-theme dark:text-foreground/70 dark:hover:bg-surface-alt"
          }`}
        >
          {editingOutfit?.id === outfit.id ? "Editing..." : "Edit"}
        </button>

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
          onClick={() => setIsDeleting(true)}
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

      {/* Custom Delete Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 cursor-default">
          <div className="relative w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-xl text-foreground text-left">
            <button onClick={() => setIsDeleting(false)} className="absolute right-4 top-4 text-foreground/50 hover:text-foreground">✕</button>
            <h2 className="text-xl font-bold mb-2">Delete Outfit</h2>
            <p className="text-sm text-foreground/70 mb-6">Are you sure you want to permanently delete "{outfit.name}"? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsDeleting(false)} 
                className="px-4 py-2 rounded-lg border border-border-theme text-sm font-medium hover:bg-surface-alt transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await deleteOutfitFromCloud(outfit.id);
                    setIsDeleting(false);
                  } catch (err) {
                    console.error("Failed to delete outfit:", err);
                    alert("Failed to delete the outfit. Please try again.");
                  }
                }} 
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete Outfit
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
