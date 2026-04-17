export type ClothingType = "upper" | "lower";

export interface WardrobeItem {
  id: string;
  url: string;
  type: ClothingType;
  isOwned: boolean;
  createdAt: string;
}

export interface NewWardrobeItem {
  url: string;
  type: ClothingType;
  isOwned: boolean;
}
