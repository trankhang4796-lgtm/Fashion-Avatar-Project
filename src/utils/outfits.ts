"use client";

import { WardrobeItem } from "@/src/wardrobe/types";

export interface SavedOutfit {
  id: string;
  name: string;
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  createdAt: string;
  isFavorite: boolean;
}

const OUTFITS_STORAGE_KEY = "fashion-avatar-saved-outfits";

function getSavedOutfitsFromStorage(): SavedOutfit[] {
  try {
    const rawOutfits = window.localStorage.getItem(OUTFITS_STORAGE_KEY);
    if (!rawOutfits) return [];

    return JSON.parse(rawOutfits) as SavedOutfit[];
  } catch (error) {
    console.error("Unable to read saved outfits from localStorage", error);
    return [];
  }
}

export function saveOutfitToStorage({
  upperWear,
  lowerWear,
}: {
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
}) {
  const existingOutfits = getSavedOutfitsFromStorage();

  // Generate a simple beginner-friendly name like "Outfit 1".
  const outfitName = `Outfit ${existingOutfits.length + 1}`;

  const nextOutfit: SavedOutfit = {
    id: crypto.randomUUID(),
    name: outfitName,
    upperWear,
    lowerWear,
    createdAt: new Date().toISOString(),
    isFavorite: false,
  };

  const updatedOutfits = [nextOutfit, ...existingOutfits];
  window.localStorage.setItem(
    OUTFITS_STORAGE_KEY,
    JSON.stringify(updatedOutfits),
  );

  return nextOutfit;
}

export function getSavedOutfits() {
  return getSavedOutfitsFromStorage();
}
