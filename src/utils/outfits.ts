"use client";

import { WardrobeItem } from "@/src/wardrobe/types";
import { createClient } from "@/src/utils/supabase/client";

export interface SavedOutfit {
  id: string;
  name: string;
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  upperWearImage: string | null;
  lowerWearImage: string | null;
  createdAt: string;
  isFavorite: boolean;
}

const SAVED_OUTFITS_EVENT = "saved-outfits-updated";

function getWardrobeItemImage(item: WardrobeItem | null | undefined) {
  return item?.url ?? null;
}

function toSavedOutfit(row: {
  id: string;
  name: string;
  upper_wear: WardrobeItem | null;
  lower_wear: WardrobeItem | null;
  created_at: string;
}): SavedOutfit {
  const upperWear = row.upper_wear;
  const lowerWear = row.lower_wear;

  return {
    id: row.id,
    name: row.name,
    upperWear,
    lowerWear,
    upperWearImage: getWardrobeItemImage(upperWear),
    lowerWearImage: getWardrobeItemImage(lowerWear),
    createdAt: row.created_at,
    isFavorite: false,
  };
}

export async function getSavedOutfits(): Promise<SavedOutfit[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return [];

  const { data, error } = await supabase
    .from("saved_outfits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching outfits:", error);
    return [];
  }

  return data.map((row) =>
    toSavedOutfit({
      id: row.id,
      name: row.name,
      upper_wear: row.upper_wear as WardrobeItem | null,
      lower_wear: row.lower_wear as WardrobeItem | null,
      created_at: row.created_at,
    }),
  );
}

export async function saveOutfitToCloud({
  upperWear,
  lowerWear,
}: {
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
}): Promise<SavedOutfit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("You must be logged in to save an outfit.");
  }

  const existingOutfits = await getSavedOutfits();
  const outfitName = `Outfit ${existingOutfits.length + 1}`;

  const { data, error } = await supabase
    .from("saved_outfits")
    .insert({
      user_id: session.user.id,
      name: outfitName,
      upper_wear: upperWear,
      lower_wear: lowerWear,
    })
    .select()
    .single();

  if (error) throw error;

  const nextOutfit = toSavedOutfit({
    id: data.id,
    name: data.name,
    upper_wear: data.upper_wear as WardrobeItem | null,
    lower_wear: data.lower_wear as WardrobeItem | null,
    created_at: data.created_at,
  });

  // Notify any UI that is listening for saved outfit updates.
  window.dispatchEvent(new Event(SAVED_OUTFITS_EVENT));

  return nextOutfit;
}

export async function deleteOutfitFromCloud(id: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return;

  const { error } = await supabase.from("saved_outfits").delete().eq("id", id);

  if (error) {
    console.error("Error deleting outfit:", error);
    throw error;
  }

  window.dispatchEvent(new Event(SAVED_OUTFITS_EVENT));
}

export function subscribeToSavedOutfits(onStoreChange: () => void) {
  const handleSavedOutfitsChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleSavedOutfitsChange);
  window.addEventListener(SAVED_OUTFITS_EVENT, handleSavedOutfitsChange);

  return () => {
    window.removeEventListener("storage", handleSavedOutfitsChange);
    window.removeEventListener(SAVED_OUTFITS_EVENT, handleSavedOutfitsChange);
  };
}
