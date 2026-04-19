"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { NewWardrobeItem, WardrobeItem } from "@/src/wardrobe/types";
import { createClient } from "@/src/utils/supabase/client";

interface WardrobeContextValue {
  items: WardrobeItem[];
  isLoaded: boolean;
  addItem: (item: NewWardrobeItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearGuestWardrobe: () => void;
  fetchWardrobeItems: () => Promise<void>;
}

/** Legacy single bucket (migrated into guest). */
const LEGACY_STORAGE_KEY = "fashion-avatar-wardrobe-items";

function guestStorageKey() {
  return "fashion-avatar-wardrobe-guest";
}

const WardrobeContext = createContext<WardrobeContextValue | undefined>(
  undefined,
);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setIsLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useLayoutEffect(() => {
    if (!isLoaded) return;

    previousUserIdRef.current = userId;

    if (userId !== null) {
      setItems([]);
      return;
    }

    try {
      let raw = window.localStorage.getItem(guestStorageKey());
      if (!raw) {
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          raw = legacy;
          window.localStorage.setItem(guestStorageKey(), legacy);
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
      if (raw) {
        setItems(JSON.parse(raw) as WardrobeItem[]);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Unable to load wardrobe items from localStorage", error);
      setItems([]);
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!isLoaded) return;
    if (userId === null) {
      try {
        window.localStorage.setItem(guestStorageKey(), JSON.stringify(items));
      } catch (error) {
        console.error("Unable to save wardrobe items to localStorage", error);
      }
    }
  }, [items, isLoaded, userId]);

  const addItem = async (item: NewWardrobeItem) => {
    const tempId = crypto.randomUUID();
    const newItem: WardrobeItem = {
      ...item,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    setItems((currentItems) => [newItem, ...currentItems]);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const fileName = `${session.user.id}-${Date.now()}.jpeg`;

        const { error: storageError } = await supabase.storage
          .from("wardrobe-images")
          .upload(fileName, blob, { contentType: blob.type || "image/jpeg" });
        if (storageError) throw storageError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("wardrobe-images").getPublicUrl(fileName);

        const { data: dbData, error: dbError } = await supabase
          .from("wardrobe_items")
          .insert({
            user_id: session.user.id,
            image_url: publicUrl,
            clothing_type: item.type,
            is_owned: item.isOwned,
          })
          .select()
          .single();
        if (dbError) throw dbError;

        setItems((currentItems) =>
          currentItems.map((i) =>
            i.id === tempId
              ? {
                  ...i,
                  id: dbData.id as string,
                  url: dbData.image_url as string,
                  createdAt: dbData.created_at as string,
                }
              : i,
          ),
        );
      } catch (error) {
        console.error("Cloud upload failed:", error);
        setItems((current) => current.filter((i) => i.id !== tempId));
      }
    }
  };

  const removeItem = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this item? This cannot be undone.",
    );
    if (!confirmDelete) return;

    const itemToRemove = items.find((i) => i.id === id);
    if (!itemToRemove) return;

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user && itemToRemove.url.includes("supabase.co")) {
      try {
        const { error: dbError } = await supabase
          .from("wardrobe_items")
          .delete()
          .eq("id", id);

        if (dbError) throw dbError;

        const urlParts = itemToRemove.url.split("/wardrobe-images/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split("?")[0];
          const { error: storageError } = await supabase.storage
            .from("wardrobe-images")
            .remove([filePath]);

          if (storageError)
            console.error("Storage deletion error:", storageError);
        }
      } catch (error) {
        console.error("Cloud deletion failed:", error);
        setItems((currentItems) => [itemToRemove, ...currentItems]);
        alert(
          "Failed to delete the item from the cloud. Please try again.",
        );
      }
    } else if (itemToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.url);
    }
  };

  const clearGuestWardrobe = useCallback(() => {
    setItems((currentItems) => {
      currentItems.forEach((item) => {
        if (item.url.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(item.url);
          } catch {
            /* ignore */
          }
        }
      });
      return [];
    });
    try {
      window.localStorage.removeItem(guestStorageKey());
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      console.error("Unable to clear guest wardrobe from localStorage", error);
    }
  }, []);

  const fetchWardrobeItems = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data, error } = await supabase
          .from("wardrobe_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const cloudItems: WardrobeItem[] = (data ?? []).map((row) => ({
          id: row.id as string,
          url: row.image_url as string,
          type: row.clothing_type as "upper" | "lower",
          isOwned: row.is_owned as boolean,
          createdAt: row.created_at as string,
        }));
        setItems(cloudItems);
      } else {
        const storedItems = window.localStorage.getItem(guestStorageKey());
        setItems(storedItems ? JSON.parse(storedItems) : []);
      }
    } catch (error) {
      console.error("Unable to load wardrobe items", error);
      setItems([]);
    }
  }, []);

  return (
    <WardrobeContext.Provider
      value={{
        items,
        isLoaded,
        addItem,
        removeItem,
        clearGuestWardrobe,
        fetchWardrobeItems,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);

  if (!context) {
    throw new Error("useWardrobe must be used inside a WardrobeProvider");
  }

  return context;
}
