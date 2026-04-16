"use client";

interface OwnershipToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function OwnershipToggle({ value, onChange }: OwnershipToggleProps) {
  return (
    <select
      value={value ? "owned" : "unowned"}
      onChange={(event) => onChange(event.target.value === "owned")}
      className="w-full rounded-lg border border-slate-200 bg-brand-cream p-2 text-sm text-brand-forest focus:ring-brand-mint"
    >
      <option value="owned">Owned</option>
      <option value="unowned">Wishlist/Unowned</option>
    </select>
  );
}
