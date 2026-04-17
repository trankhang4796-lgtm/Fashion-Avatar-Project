"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { NewWardrobeItem, WardrobeItem } from "@/src/wardrobe/types";

interface WardrobeContextValue {
  items: WardrobeItem[];
  isLoaded: boolean;
  addItem: (item: NewWardrobeItem) => void;
  removeItem: (id: string) => void;
}

const STORAGE_KEY = "fashion-avatar-wardrobe-items";

const WardrobeContext = createContext<WardrobeContextValue | undefined>(
  undefined,
);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems) as WardrobeItem[];
        setItems(parsedItems);
      }
    } catch (error) {
      console.error("Unable to load wardrobe items from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Unable to save wardrobe items to localStorage", error);
    }
  }, [items, isLoaded]);

  const addItem = (item: NewWardrobeItem) => {
    setItems((currentItems) => [
      {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      ...currentItems,
    ]);
  };

  const removeItem = (id: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  };

  return (
    <WardrobeContext.Provider value={{ items, isLoaded, addItem, removeItem }}>
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
