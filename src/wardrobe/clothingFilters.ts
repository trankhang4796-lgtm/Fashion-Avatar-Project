import type { WardrobeItem } from "./types";

export const clothingFilters = [
  { label: "All", value: "all" },
  { label: "Upper", value: "upper" },
  { label: "Lower", value: "lower" },
  { label: "Shoes", value: "shoes" },
  { label: "Accessories", value: "accessories" },
] as const;

export type ClothingFilterValue = (typeof clothingFilters)[number]["value"];

export function filterClothingItems(
  items: WardrobeItem[],
  selectedFilter: ClothingFilterValue,
) {
  if (selectedFilter === "all") return items;

  return items.filter((item) => item.type.toLowerCase() === selectedFilter);
}
