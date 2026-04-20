"use client";

import { WardrobeItem } from "@/src/wardrobe/types";
import { createClient } from "@/src/utils/supabase/client";

export interface SavedOutfit {
  id: string;
  name: string;
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  createdAt: string;
  isFavorite: boolean;
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

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    upperWear: row.upper_wear as WardrobeItem | null,
    lowerWear: row.lower_wear as WardrobeItem | null,
    createdAt: row.created_at,
    isFavorite: false,
  }));
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

  return {
    id: data.id,
    name: data.name,
    upperWear: data.upper_wear,
    lowerWear: data.lower_wear,
    createdAt: data.created_at,
    isFavorite: false,
  };
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
}
