"use client";

import { useEffect, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import SavedOutfitsSection from "./SavedOutfitsSection";
import WardrobeGrid from "./WardrobeGrid";
import WardrobeUploader from "./WardrobeUploader";

export default function WardrobePageContent() {
  const { items, isLoaded, removeItem } = useWardrobe();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const handleRemoveItem = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this item? This cannot be undone.",
    );
    if (!confirmDelete) return;

    try {
      await removeItem(id);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete the item. Please try again.");
    }
  };

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">My Wardrobe</h1>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-darkgreen"
        >
          Add Clothing
        </button>
      </div>

      <p className="mb-8 max-w-2xl text-base text-slate-600">
        This page shows the same clothing inventory used on the Dashboard.
        Add items from either page and they stay in sync.
      </p>

      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Saved items
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {items.length} item{items.length === 1 ? "" : "s"} in your
                wardrobe
              </p>
            </div>
          </div>

          {!isLoaded ? (
            <p className="text-sm text-slate-500">Loading wardrobe...</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                Your wardrobe is empty
              </h3>
              <p className="mt-2 text-sm text-slate-600">
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
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>

            <div className="pr-10">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Clothing
              </h2>
              <p className="mt-1 text-sm text-slate-600">
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
    </main>
  );
}
