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
  isPublished?: boolean;
  authorName?: string;
  userId?: string;
  likesCount?: number;
  isLikedByMe?: boolean;
}

const SAVED_OUTFITS_EVENT = "saved-outfits-updated";

function getWardrobeItemImage(item: WardrobeItem | null | undefined) {
  return item?.url ?? null;
}

function toSavedOutfit(row: any, currentUserId?: string): SavedOutfit {
  const upperWear = row.upper_wear;
  const lowerWear = row.lower_wear;

  const likes = row.outfit_likes || [];
  const isLikedByMe = currentUserId ? likes.some((like: any) => like.user_id === currentUserId) : false;

  return {
    id: row.id,
    userId: row.user_id, // Added this
    name: row.name,
    upperWear,
    lowerWear,
    upperWearImage: getWardrobeItemImage(upperWear),
    lowerWearImage: getWardrobeItemImage(lowerWear),
    createdAt: row.created_at,
    isFavorite: false,
    isPublished: row.is_published || false,
    authorName: row.profiles?.username || "Anonymous",
    likesCount: likes.length,
    isLikedByMe,
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
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching outfits:", error);
    return [];
  }

  return data.map((row) =>
    toSavedOutfit(
      {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        upper_wear: row.upper_wear as WardrobeItem | null,
        lower_wear: row.lower_wear as WardrobeItem | null,
        created_at: row.created_at,
        is_published: row.is_published,
      },
      session.user.id,
    ),
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
    user_id: data.user_id,
    name: data.name,
    upper_wear: data.upper_wear as WardrobeItem | null,
    lower_wear: data.lower_wear as WardrobeItem | null,
    created_at: data.created_at,
    is_published: data.is_published,
  }, session.user.id);

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

export async function toggleOutfitPublish(id: string, publish: boolean) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not logged in");

  if (publish) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_public")
      .eq("id", session.user.id)
      .single();
    if (!profile?.is_public) throw new Error("Your profile must be public to share outfits. Enable this in Settings.");
  }

  const { error } = await supabase.from("saved_outfits").update({ is_published: publish }).eq("id", id);
  if (error) throw error;
  window.dispatchEvent(new Event(SAVED_OUTFITS_EVENT));
}

export async function getCommunityOutfits(
  page: number = 0,
  limit: number = 40,
  sortBy: string = "newest",
): Promise<SavedOutfit[]> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  let query = supabase
    .from("saved_outfits")
    .select("*, profiles(username), outfit_likes(user_id)")
    .eq("is_published", true);

  if (sortBy === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false }); // Default newest
  }

  // Pagination logic
  const from = page * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching community outfits:", error);
    return [];
  }
  return data.map((row: any) => toSavedOutfit(row, currentUserId));
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

export async function toggleOutfitLike(outfitId: string, currentlyLiked: boolean) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("You must be logged in to like outfits.");

  if (currentlyLiked) {
    const { error } = await supabase
      .from("outfit_likes")
      .delete()
      .match({ outfit_id: outfitId, user_id: session.user.id });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("outfit_likes")
      .insert({ outfit_id: outfitId, user_id: session.user.id });
    if (error) throw error;
  }
}
