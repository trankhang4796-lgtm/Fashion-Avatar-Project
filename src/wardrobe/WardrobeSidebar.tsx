"use client";

import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { createClient } from "@/src/utils/supabase/client";
import {
  deleteOutfitFromCloud,
  getSavedOutfits,
  renameOutfitInCloud,
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
  onEquipOutfit?: (
    upper: WardrobeItem | null,
    lower: WardrobeItem | null,
    shoes: WardrobeItem | null,
    accessories: WardrobeItem[],
  ) => void;
  newlySavedOutfit?: SavedOutfit | null;
  onUpperWearChange?: (item: WardrobeItem | null) => void;
  onLowerWearChange?: (item: WardrobeItem | null) => void;
  onShoesChange?: (item: WardrobeItem | null) => void;
  onAccessoriesChange?: (items: WardrobeItem[]) => void;
}

export default function WardrobeSidebar({
  isOpen,
  onToggle,
  onEquipOutfit,
  newlySavedOutfit,
  onUpperWearChange,
  onLowerWearChange,
  onShoesChange,
  onAccessoriesChange,
}: WardrobeSidebarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"clothes" | "outfits">("clothes");
  const [stagedItems, setStagedItems] = useState<WardrobeItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [outfitToDelete, setOutfitToDelete] = useState<SavedOutfit | null>(null);
  const [renamingOutfitId, setRenamingOutfitId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [, setUploadedImageUrls] = useState<string[]>([]);
  const createdUrlsRef = useRef<string[]>([]);

  const {
    items,
    isLoaded,
    removeItem,
    clearGuestWardrobe,
    fetchWardrobeItems,
    editingOutfit,
    setEditingOutfit,
  } = useWardrobe();

  const handleRemoveItem = (id: string) => {
    setItemToDelete(id);
  };

  const handleItemToggle = (item: WardrobeItem) => {
    setStagedItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id);
      }
      if (item.type === "accessories") {
        return [...prev, item];
      }
      return [...prev.filter((i) => i.type !== item.type), item];
    });
  };

  const handleApplySelection = () => {
    const upper = stagedItems.find((i) => i.type === "upper");
    const lower = stagedItems.find((i) => i.type === "lower");
    const shoes = stagedItems.find((i) => i.type === "shoes");
    const accessoriesOnly = stagedItems.filter((i) => i.type === "accessories");

    if (upper) onUpperWearChange?.(upper);
    if (lower) onLowerWearChange?.(lower);
    if (shoes) onShoesChange?.(shoes);
    if (accessoriesOnly.length > 0) {
      onAccessoriesChange?.(accessoriesOnly);
    }

    setStagedItems([]);

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      onToggle();
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
        const existingIndex = currentOutfits.findIndex(
          (o) => o.id === newlySavedOutfit.id,
        );

        if (existingIndex >= 0) {
          // If the outfit already exists (we are editing it), replace it instantly
          const updatedList = [...currentOutfits];
          updatedList[existingIndex] = newlySavedOutfit;
          return updatedList;
        }

        // If it's a brand new outfit, push it to the very top of the list
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

  if (!isOpen) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background p-4">
        <button
          onClick={onToggle}
          className="h-14 w-14 rounded-lg border border-border-theme bg-surface text-xl text-foreground shadow-sm hover:bg-surface-alt transition-colors"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Wardrobe</h2>
        <button
          onClick={onToggle}
          className="rounded px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
        >
          Close
        </button>
      </div>

      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="mb-4 w-full shrink-0 rounded-lg bg-brand-forest px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-darkgreen"
      >
        Add Clothing
      </button>

      <div className="mb-3 flex shrink-0 gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("clothes")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "clothes"
              ? "border-b-2 border-brand-forest text-brand-forest"
              : "text-slate-400"
          }`}
        >
          Clothes
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

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {activeTab === "outfits" ? (
          savedOutfits.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-surface p-4 text-sm text-slate-500">
              No saved outfits yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {savedOutfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="rounded-xl border border-border-theme bg-surface p-3"
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {renamingOutfitId === outfit.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          autoFocus
                          className="min-w-0 flex-1 rounded-lg border border-border-theme bg-surface px-2 py-1.5 text-sm font-semibold text-foreground focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                          aria-label="Outfit name"
                        />
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const updated = await renameOutfitInCloud(
                                  outfit.id,
                                  newName.trim(),
                                );
                                setSavedOutfits((prev) =>
                                  prev.map((o) =>
                                    o.id === updated.id ? updated : o,
                                  ),
                                );
                                setRenamingOutfitId(null);
                              } catch (err: unknown) {
                                const message =
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to rename outfit.";
                                alert(message);
                              }
                            }}
                            className="rounded-md border border-brand-mint bg-brand-mint px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-forest"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingOutfitId(null);
                              setNewName("");
                            }}
                            className="rounded-md border border-border-theme bg-surface px-2 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-surface-alt dark:border-border-theme"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="truncate text-sm font-semibold text-foreground">
                        {outfit.name}
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-1 w-[132px]">
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
                      {outfit.shoes?.url ? (
                        <img
                          src={outfit.shoes.url}
                          alt={`${outfit.name} shoes`}
                          className="h-16 w-16 rounded-md border border-slate-100 bg-slate-50 object-cover p-1"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-[10px] text-slate-400">
                          No Shoe
                        </div>
                      )}
                      {outfit.accessories?.[0]?.url ? (
                        <img
                          src={outfit.accessories[0].url}
                          alt={`${outfit.name} accessory`}
                          className="h-16 w-16 rounded-md border border-slate-100 bg-slate-50 object-cover p-1"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-[10px] text-slate-400">
                          No Acc
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
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
                      onClick={() => {
                        setRenamingOutfitId(outfit.id);
                        setNewName(outfit.name);
                      }}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-border-theme dark:text-foreground/70 dark:hover:bg-surface-alt"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onEquipOutfit &&
                        onEquipOutfit(
                          outfit.upperWear,
                          outfit.lowerWear,
                          outfit.shoes ?? null,
                          outfit.accessories ?? [],
                        )
                      }
                      className="rounded-lg bg-brand-mint px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-forest"
                    >
                      Place on Avatar
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutfitToDelete(outfit)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const previousPublished = outfit.isPublished;
                        const newPublishState = !outfit.isPublished;
                        setSavedOutfits((prev) =>
                          prev.map((o) =>
                            o.id === outfit.id
                              ? { ...o, isPublished: newPublishState }
                              : o,
                          ),
                        );
                        try {
                          await toggleOutfitPublish(outfit.id, newPublishState);
                        } catch (err: any) {
                          setSavedOutfits((prev) =>
                            prev.map((o) =>
                              o.id === outfit.id
                                ? { ...o, isPublished: previousPublished }
                                : o,
                            ),
                          );
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
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-surface p-4 text-sm text-slate-500">
            No clothes added yet.
          </p>
        ) : (
            <ImageGrid
              key={user?.id ?? "guest"}
              images={items}
              onRemove={handleRemoveItem}
              selectedItemIds={stagedItems.map((i) => i.id)}
              onItemToggle={handleItemToggle}
            />
        )}
        </div>
        {stagedItems.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-surface border-t border-border-theme shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
            <button
              type="button"
              onClick={handleApplySelection}
              className="w-full py-3 px-4 bg-brand-forest text-white rounded-xl font-bold hover:bg-brand-forest/90 transition-colors flex justify-between items-center"
            >
              <span>
                Apply {stagedItems.length} Item{stagedItems.length > 1 ? "s" : ""}
              </span>
              <span>→</span>
            </button>
          </div>
        )}
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

          <div className="relative z-10 flex w-full max-w-2xl max-h-[calc(100vh-48px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-surface p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>

            <div className="pr-10">
              <h2 className="text-lg font-semibold transition-colors">
                Add Clothing
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload from files, drag and drop, or take a photo.
              </p>
            </div>

            <WardrobeUploader
              className="mt-4 flex-1 min-h-0 border-0 bg-transparent p-0 shadow-none"
              title=""
              description=""
              onUploadComplete={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {/* Custom Delete Modal for Sidebar */}
      {outfitToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 cursor-default">
          <div className="relative w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-xl text-foreground text-left">
            <button onClick={() => setOutfitToDelete(null)} className="absolute right-4 top-4 text-foreground/50 hover:text-foreground">✕</button>
            <h2 className="text-xl font-bold mb-2">Delete Outfit</h2>
            <p className="text-sm text-foreground/70 mb-6">Are you sure you want to permanently delete "{outfitToDelete.name}"? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setOutfitToDelete(null)} 
                className="px-4 py-2 rounded-lg border border-border-theme text-sm font-medium hover:bg-surface-alt transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await deleteOutfitFromCloud(outfitToDelete.id);
                    setSavedOutfits((current) => current.filter((o) => o.id !== outfitToDelete.id));
                    setOutfitToDelete(null);
                  } catch (error) {
                    console.error("Failed to delete outfit:", error);
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

      {/* Custom Delete Modal for Clothing Items (Sidebar) */}
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
                    setStagedItems((prev) =>
                      prev.filter((i) => i.id !== itemToDelete),
                    );
                    setItemToDelete(null);
                  } catch (error) {
                    console.error("Failed to delete the item:", error);
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
    </div>
  );
}
