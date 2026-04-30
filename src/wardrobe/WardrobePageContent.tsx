"use client";

import { useEffect, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import SavedOutfitsSection from "./SavedOutfitsSection";
import WardrobeGrid from "./WardrobeGrid";
import WardrobeUploader from "./WardrobeUploader";

export default function WardrobePageContent() {
  const { items, isLoaded, removeItem } = useWardrobe();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAddModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAddModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAddModalOpen]);

  useEffect(() => {
    if (!isAddModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAddModalOpen]);

  const handleRemoveItem = (id: string) => {
    setItemToDelete(id);
  };

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">My Wardrobe</h1>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-darkgreen"
        >
          Add Clothing
        </button>
      </div>

      <p className="mb-8 max-w-2xl text-base text-foreground/70">
        This page shows the same clothing inventory used on the Dashboard.
        Add items from either page and they stay in sync.
      </p>

      <div className="space-y-8">
        <section className="rounded-2xl border border-border-theme bg-surface-alt p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Saved items
              </h2>
              <p className="mt-1 text-sm text-foreground/70">
                {items.length} item{items.length === 1 ? "" : "s"} in your
                wardrobe
              </p>
            </div>
          </div>

          {!isLoaded ? (
            <p className="text-sm text-foreground/70">Loading wardrobe...</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-theme bg-surface px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Your wardrobe is empty
              </h3>
              <p className="mt-2 text-sm text-foreground/70">
                Click Add Clothing to upload your first clothing image.
              </p>
            </div>
          ) : (
            <WardrobeGrid items={items} onRemove={handleRemoveItem} />
          )}
        </section>

        <SavedOutfitsSection />
      </div>

      {isAddModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add clothing"
        >
          <button
            type="button"
            aria-label="Close add clothing modal"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border-theme bg-surface p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1.5 text-foreground/70 transition-colors hover:bg-surface-alt hover:text-foreground"
            >
              ×
            </button>

            <div className="pr-10">
              <h2 className="text-lg font-semibold text-foreground">
                Add Clothing
              </h2>
              <p className="mt-1 text-sm text-foreground/70">
                Upload from files, drag and drop, or take a photo.
              </p>
            </div>

            <WardrobeUploader
              className="mt-4 border-0 bg-transparent p-0 shadow-none"
              title=""
              description=""
            />
          </div>
        </div>
      ) : null}

      {/* Custom Delete Modal for Clothing Items */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 cursor-default">
          <div className="relative w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-xl text-foreground text-left">
            <button onClick={() => setItemToDelete(null)} className="absolute right-4 top-4 text-foreground/50 hover:text-foreground">✕</button>
            <h2 className="text-xl font-bold mb-2">Delete Item</h2>
            <p className="text-sm text-foreground/70 mb-6">Are you sure you want to permanently delete this clothing item? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setItemToDelete(null)} 
                className="px-4 py-2 rounded-lg border border-border-theme text-sm font-medium hover:bg-surface-alt transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await removeItem(itemToDelete!);
                    setItemToDelete(null);
                  } catch (error) {
                    console.error("Failed to delete item:", error);
                    alert("Failed to delete the item. Please try again.");
                  }
                }} 
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
