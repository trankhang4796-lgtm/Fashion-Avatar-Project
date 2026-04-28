"use client";

import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { createClient } from "@/src/utils/supabase/client";
import {
  deleteOutfitFromCloud,
  getSavedOutfits,
  toggleOutfitPublish,
  type SavedOutfit,
} from "@/src/utils/outfits";
import ImageGrid from "./ImageGrid";
import WardrobeUploader from "./WardrobeUploader";
import type { WardrobeItem } from "./types";

export type { WardrobeItem as ClothingItem } from "./types";

interface WardrobeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onEquipOutfit?: (upper: WardrobeItem | null, lower: WardrobeItem | null) => void;
  newlySavedOutfit?: SavedOutfit | null;
}

export default function WardrobeSidebar({
  isOpen,
  onToggle,
  onEquipOutfit,
  newlySavedOutfit,
}: WardrobeSidebarProps) {
  const [activeTab, setActiveTab] = useState<"owned" | "unowned" | "outfits">(
    "owned",
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [, setUploadedImageUrls] = useState<string[]>([]);
  const createdUrlsRef = useRef<string[]>([]);

  const { items, isLoaded, removeItem, clearGuestWardrobe, fetchWardrobeItems } =
    useWardrobe();

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

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const outfits = await getSavedOutfits();
      if (isMounted) setSavedOutfits(outfits);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (newlySavedOutfit) {
      setSavedOutfits((currentOutfits) => {
        // Prevent duplicates in case React strict-mode double-fires
        if (currentOutfits.some((o) => o.id === newlySavedOutfit.id)) {
          return currentOutfits;
        }
        // Push the new outfit to the very top of the list
        return [newlySavedOutfit, ...currentOutfits];
      });
    }
  }, [newlySavedOutfit]);

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

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredItems = items.filter((item) =>
    activeTab === "owned" ? item.isOwned : !item.isOwned,
  );

  if (!isOpen) {
    return (
      <div className="flex h-full items-start justify-center bg-slate-50 p-3">
        <button
          onClick={onToggle}
          className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100 text-xl"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Wardrobe</h2>
        <button
          onClick={onToggle}
          className="rounded px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="mb-4 w-full rounded-lg bg-brand-forest px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-darkgreen"
      >
        Add Clothing
      </button>

      <div className="mb-3 flex gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("owned")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "owned"
              ? "border-b-2 border-brand-forest text-brand-forest"
              : "text-slate-400"
          }`}
        >
          Owned
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unowned")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "unowned"
              ? "border-b-2 border-brand-forest text-brand-forest"
              : "text-slate-400"
          }`}
        >
          Wishlist
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outfits")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "outfits"
              ? "border-b-2 border-brand-forest text-brand-forest"
              : "text-slate-400"
          }`}
        >
          Outfits
        </button>
      </div>

      {activeTab === "outfits" ? (
        savedOutfits.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No saved outfits yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {savedOutfits.map((outfit) => (
              <div
                key={outfit.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {outfit.name}
                    </p>
                    <div className="mt-3 flex flex-col gap-1 w-16">
                      {outfit.upperWear?.url ? (
                        <img
                          src={outfit.upperWear.url}
                          alt={`${outfit.name} upper`}
                          className="h-16 w-16 rounded-md border border-slate-100 bg-slate-50 object-cover p-1"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-[10px] text-slate-400">
                          No Top
                        </div>
                      )}

                      {outfit.lowerWear?.url ? (
                        <img
                          src={outfit.lowerWear.url}
                          alt={`${outfit.name} lower`}
                          className="h-16 w-16 rounded-md border border-slate-100 bg-slate-50 object-cover p-1"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-[10px] text-slate-400">
                          No Btm
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEquipOutfit && onEquipOutfit(outfit.upperWear, outfit.lowerWear)
                      }
                      className="rounded-lg bg-brand-mint px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-forest"
                    >
                      Place on Avatar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmDelete = window.confirm(
                          "Are you sure you want to permanently delete this outfit? This cannot be undone.",
                        );
                        if (!confirmDelete) return;

                        try {
                          // Delete from the database
                          await deleteOutfitFromCloud(outfit.id);

                          // Optimistically remove it from the UI so it vanishes instantly
                          setSavedOutfits((current) =>
                            current.filter((o) => o.id !== outfit.id),
                          );
                        } catch (error) {
                          console.error("Failed to delete outfit:", error);
                          alert("Failed to delete the outfit. Please try again.");
                        }
                      }}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Delete
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : !isLoaded ? (
        <p className="text-sm text-slate-500">Loading wardrobe...</p>
      ) : filteredItems.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No {activeTab === "owned" ? "owned" : "wishlist"} items yet.
        </p>
      ) : (
        <ImageGrid
          key={user?.id ?? "guest"}
          images={filteredItems}
          onRemove={handleRemoveItem}
        />
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
    </div>
  );
}
