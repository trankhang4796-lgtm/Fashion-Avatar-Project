"use client";

import { useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import ImageGrid from "./ImageGrid";
import WardrobeUploader from "./WardrobeUploader";

interface WardrobeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function WardrobeSidebar({ isOpen, onToggle }: WardrobeSidebarProps) {
  const [activeTab, setActiveTab] = useState<"owned" | "unowned">("owned");
  const { items, isLoaded, removeItem } = useWardrobe();

  const filteredItems = items.filter((item) =>
    activeTab === "owned" ? item.isOwned : !item.isOwned,
  );

  if (!isOpen) {
    return (
      <div className="flex h-full items-start justify-center bg-slate-50 p-3">
        <button
          onClick={onToggle}
          className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100 text-xl"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Wardrobe</h2>
        <button
          onClick={onToggle}
          className="rounded px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <WardrobeUploader
        className="mb-4"
        title="Add clothing"
        description="Anything saved here also appears on the Wardrobe page."
      />

      <div className="mb-3 flex gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("owned")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "owned"
              ? "border-b-2 border-brand-forest text-brand-forest"
              : "text-slate-400"
          }`}
        >
          Owned
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unowned")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "unowned"
              ? "border-b-2 border-brand-forest text-brand-forest"
              : "text-slate-400"
          }`}
        >
          Wishlist
        </button>
      </div>

      {!isLoaded ? (
        <p className="text-sm text-slate-500">Loading wardrobe...</p>
      ) : filteredItems.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No {activeTab === "owned" ? "owned" : "wishlist"} items yet.
        </p>
      ) : (
        <ImageGrid images={filteredItems} onRemove={removeItem} />
      )}
    </div>
  );
}
