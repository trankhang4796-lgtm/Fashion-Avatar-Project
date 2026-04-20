"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { createClient } from "@/src/utils/supabase/client";
import {
  deleteOutfitFromCloud,
  getSavedOutfits,
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
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [, setUploadedImageUrls] = useState<string[]>([]);
  const createdUrlsRef = useRef<string[]>([]);

  const { items, isLoaded, removeItem, clearGuestWardrobe, fetchWardrobeItems } =
    useWardrobe();

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
    const supabase = createClient();

    const clearGuestState = () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdUrlsRef.current = [];
      setUploadedImageUrls([]);
      clearGuestWardrobe();
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        clearGuestState();
        void fetchWardrobeItems();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        clearGuestState();
        void fetchWardrobeItems();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        clearGuestState();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearGuestWardrobe, fetchWardrobeItems]);

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

      <WardrobeUploader
        className="mb-4"
        title="Add clothing"
        description="Anything saved here also appears on the Wardrobe page."
      />

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
                    <div className="mt-2 flex items-center gap-2">
                      {outfit.upperWear?.url ? (
                        <img
                          src={outfit.upperWear.url}
                          alt={`${outfit.name} upper`}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : null}
                      {outfit.lowerWear?.url ? (
                        <img
                          src={outfit.lowerWear.url}
                          alt={`${outfit.name} lower`}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : null}
                      {!outfit.upperWear?.url && !outfit.lowerWear?.url ? (
                        <span className="text-xs text-slate-400">
                          No thumbnails
                        </span>
                      ) : null}
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
          onRemove={removeItem}
        />
      )}
    </div>
  );
}
