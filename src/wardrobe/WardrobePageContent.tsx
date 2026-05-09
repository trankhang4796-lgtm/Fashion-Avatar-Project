"use client";

import { useEffect, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import SavedOutfitsSection from "./SavedOutfitsSection";
import WardrobeGrid from "./WardrobeGrid";
import WardrobeUploader from "./WardrobeUploader";
import { getSavedOutfits, subscribeToSavedOutfits } from "@/src/utils/outfits";

type WardrobeTab = "saved-items" | "saved-outfits";
type SavedItemsFilter = "all" | "upper" | "lower" | "shoes" | "accessories";

const savedItemsFilterTabs: Array<{ key: SavedItemsFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "upper", label: "Upper-wear" },
  { key: "lower", label: "Lower-wear" },
  { key: "shoes", label: "Shoes" },
  { key: "accessories", label: "Accessories" },
];

export default function WardrobePageContent() {
  const { items, isLoaded, removeItem } = useWardrobe();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WardrobeTab>("saved-items");
  const [savedItemsFilter, setSavedItemsFilter] = useState<SavedItemsFilter>("all");
  const [savedOutfitsCount, setSavedOutfitsCount] = useState(0);

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

  useEffect(() => {
    let isMounted = true;

    const loadSavedOutfitsCount = async () => {
      const savedOutfits = await getSavedOutfits();
      if (isMounted) {
        setSavedOutfitsCount(savedOutfits.length);
      }
    };

    void loadSavedOutfitsCount();

    const unsubscribe = subscribeToSavedOutfits(() => {
      void loadSavedOutfitsCount();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const filteredItems =
    savedItemsFilter === "all"
      ? items
      : items.filter((item) => item.type === savedItemsFilter);

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wardrobe</h1>
          <p className="mt-2 max-w-2xl text-base text-foreground/70">
            Manage your saved clothing items and outfits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-darkgreen"
        >
          Add Clothing
        </button>
      </div>

      <div className="mb-8 border-b border-border-theme">
        <nav
          aria-label="Wardrobe sections"
          className="flex items-center gap-6 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab("saved-items")}
            className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "saved-items"
                ? "border-brand-mint text-foreground"
                : "border-transparent text-foreground/70 hover:text-foreground"
            }`}
          >
            Saved Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved-outfits")}
            className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "saved-outfits"
                ? "border-brand-mint text-foreground"
                : "border-transparent text-foreground/70 hover:text-foreground"
            }`}
          >
            Saved Outfits ({savedOutfitsCount})
          </button>
        </nav>
      </div>

      {activeTab === "saved-items" ? (
        <section className="rounded-2xl border border-border-theme bg-surface-alt p-5">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
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

            <div className="flex flex-wrap items-center gap-2">
              {savedItemsFilterTabs.map((filterOption) => (
                <button
                  key={filterOption.key}
                  type="button"
                  onClick={() => setSavedItemsFilter(filterOption.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    savedItemsFilter === filterOption.key
                      ? "border-brand-mint bg-brand-mint/15 text-foreground"
                      : "border-border-theme bg-surface text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {!isLoaded ? (
            <p className="text-sm text-foreground/70">Loading wardrobe...</p>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-theme bg-surface px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {items.length === 0
                  ? "Your wardrobe is empty"
                  : "No items in this category"}
              </h3>
              <p className="mt-2 text-sm text-foreground/70">
                {items.length === 0
                  ? "Click Add Clothing to upload your first clothing image."
                  : "Try another filter to see more saved items."}
              </p>
            </div>
          ) : (
            <WardrobeGrid items={filteredItems} onRemove={handleRemoveItem} />
          )}
        </section>
      ) : (
        <SavedOutfitsSection />
      )}

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
