"use client";

interface ClothingTypeProps {
  value: "upper" | "lower" | "shoes" | "accessories" | "";
  onChange: (value: "upper" | "lower" | "shoes" | "accessories" | "") => void;
  includePlaceholder?: boolean;
}

export default function ClothingType({
  value,
  onChange,
  includePlaceholder = false,
}: ClothingTypeProps) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value as
            | "upper"
            | "lower"
            | "shoes"
            | "accessories"
            | "",
        )
      }
      className="w-full rounded-lg border border-border-theme bg-brand-cream p-2 text-sm text-brand-forest focus:ring-brand-mint"
    >
      {includePlaceholder ? (
        <option value="" disabled>
          Select category
        </option>
      ) : null}
      <option value="upper">Upper-wear</option>
      <option value="lower">Lower-wear</option>
      <option value="shoes">Shoes</option>
      <option value="accessories">Accessories</option>
    </select>
  );
}
