export type ClothingType = "upper" | "lower" | "shoes" | "accessories";

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
