"use client";

interface ClothingTypeProps {
  value: "upper" | "lower";
  onChange: (value: "upper" | "lower") => void;
}

export default function ClothingType({ value, onChange }: ClothingTypeProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as "upper" | "lower")}
      className="w-full rounded-lg border border-slate-200 bg-brand-cream p-2 text-sm text-brand-forest focus:ring-brand-mint"
    >
      <option value="upper">Upper-wear</option>
      <option value="lower">Lower-wear</option>
    </select>
  );
}
