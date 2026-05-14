"use client";

import { WardrobeItem } from "@/src/wardrobe/types";
import { createClient } from "@/src/utils/supabase/client";

export interface SavedOutfit {
  id: string;
  name: string;
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  shoes: WardrobeItem | null;
  accessories: WardrobeItem[];
  upperWearImage: string | null;
  lowerWearImage: string | null;
  shoesImage: string | null;
  accessoryImages: string[];
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
  const shoes = row.shoes ?? row.shoes_wear ?? null;
  const accessories = Array.isArray(row.accessories)
    ? row.accessories
    : Array.isArray(row.accessory_items)
      ? row.accessory_items
      : [];

  const likes = row.outfit_likes || [];
  const isLikedByMe = currentUserId ? likes.some((like: any) => like.user_id === currentUserId) : false;

  return {
    id: row.id,
    userId: row.user_id, // Added this
    name: row.name,
    upperWear,
    lowerWear,
    shoes,
    accessories,
    upperWearImage: getWardrobeItemImage(upperWear),
    lowerWearImage: getWardrobeItemImage(lowerWear),
    shoesImage: getWardrobeItemImage(shoes),
    accessoryImages: accessories
      .map((item: WardrobeItem) => getWardrobeItemImage(item))
      .filter((image: string | null): image is string => Boolean(image)),
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

  return data.map((row) => toSavedOutfit(row, session.user.id));
}

export async function saveOutfitToCloud({
  upperWear,
  lowerWear,
  shoes,
  accessories,
}: {
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  shoes: WardrobeItem | null;
  accessories: WardrobeItem[];
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
      shoes,
      accessories,
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
    shoes: (data as any).shoes as WardrobeItem | null,
    accessories: ((data as any).accessories ?? []) as WardrobeItem[],
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

  const { data: outfitRow, error: outfitFetchError } = await supabase
    .from("saved_outfits")
    .select("upper_wear, lower_wear, shoes, accessories")
    .eq("id", id)
    .single();

  if (outfitFetchError) {
    console.error("Error fetching outfit for deletion:", outfitFetchError);
  } else {
    const upperWearUrl: string | undefined = outfitRow?.upper_wear?.url;
    const lowerWearUrl: string | undefined = outfitRow?.lower_wear?.url;
    const shoesUrl: string | undefined = outfitRow?.shoes?.url;
    const accessoryUrls: string[] = Array.isArray(outfitRow?.accessories)
      ? outfitRow.accessories
          .map((item: WardrobeItem | null) => item?.url)
          .filter((url: string | undefined): url is string => Boolean(url))
      : [];

    const deleteStorageFile = async (itemUrl: string | undefined) => {
      if (!itemUrl) return;
      const urlParts = itemUrl.split("/wardrobe-images/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split("?")[0];
        const { error: storageError } = await supabase.storage
          .from("wardrobe-images")
          .remove([filePath]);
        if (storageError) console.error("Failed to delete image file:", storageError);
      }
    };

    await deleteStorageFile(upperWearUrl);
    await deleteStorageFile(lowerWearUrl);
    await deleteStorageFile(shoesUrl);
    for (const accessoryUrl of accessoryUrls) {
      await deleteStorageFile(accessoryUrl);
    }
  }

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
    .select("*, profiles!inner(username, is_public), outfit_likes(user_id)")
    .eq("is_published", true)
    .eq("profiles.is_public", true);

  if (sortBy === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sortBy === "newest") {
    query = query.order("created_at", { ascending: false });
  }

  if (sortBy === "most_likes") {
    // Manually sort by likes count in JS, then paginate
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching community outfits:", error);
      return [];
    }

    const allOutfits = data.map((row: any) => toSavedOutfit(row, currentUserId));
    
    // Sort descending by likesCount
    allOutfits.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));

    // Manual Pagination
    const from = page * limit;
    return allOutfits.slice(from, from + limit);
  } else {
    // Database-level pagination for newest/oldest
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

export async function updateOutfitInCloud(
  id: string,
  upperWear: WardrobeItem | null,
  lowerWear: WardrobeItem | null,
  shoes: WardrobeItem | null,
  accessories: WardrobeItem[],
): Promise<SavedOutfit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session?.user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("saved_outfits")
    .update({
      upper_wear: upperWear,
      lower_wear: lowerWear,
      shoes,
      accessories,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  
  // Trigger UI sync for other tabs/components
  window.dispatchEvent(new Event(SAVED_OUTFITS_EVENT));

  // Return the newly formatted outfit
  return toSavedOutfit(
    {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      upper_wear: data.upper_wear,
      lower_wear: data.lower_wear,
      shoes: (data as any).shoes,
      accessories: (data as any).accessories ?? [],
      created_at: data.created_at,
      is_published: data.is_published,
    },
    session.user.id,
  );
}

export async function renameOutfitInCloud(
  id: string,
  newName: string,
): Promise<SavedOutfit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("You must be logged in to rename an outfit.");
  }

  const trimmedName = newName.trim();
  if (!trimmedName) {
    throw new Error("Outfit name cannot be empty.");
  }

  const { data, error } = await supabase
    .from("saved_outfits")
    .update({ name: trimmedName })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) throw error;

  window.dispatchEvent(new Event(SAVED_OUTFITS_EVENT));

  return toSavedOutfit(
    {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      upper_wear: data.upper_wear as WardrobeItem | null,
      lower_wear: data.lower_wear as WardrobeItem | null,
      shoes: (data as any).shoes as WardrobeItem | null,
      accessories: ((data as any).accessories ?? []) as WardrobeItem[],
      created_at: data.created_at,
      is_published: data.is_published,
    },
    session.user.id,
  );
}
