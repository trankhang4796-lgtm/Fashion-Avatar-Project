"use client";

import { useState } from "react";
import AvatarCanvas from "@/src/avatar/AvatarCanvas";
import { WardrobeItem } from "@/src/wardrobe/types";
import WardrobeSidebar from "@/src/wardrobe/WardrobeSidebar";
import type { SavedOutfit } from "@/src/utils/outfits";
import { saveOutfitToCloud } from "@/src/utils/outfits";

export default function DashboardPage() {
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [upperWear, setUpperWear] = useState<WardrobeItem | null>(null);
  const [lowerWear, setLowerWear] = useState<WardrobeItem | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [newlySavedOutfit, setNewlySavedOutfit] = useState<SavedOutfit | null>(null);

  const handleSaveOutfit = async () => {
    if (!upperWear && !lowerWear) {
      setSaveMessage("Add an upper or lower clothing item before saving.");
      return;
    }

    try {
      setSaveMessage("Saving...");
      const savedOutfit = await saveOutfitToCloud({
        upperWear,
        lowerWear,
      });
      setNewlySavedOutfit(savedOutfit);

      setSaveMessage(`${savedOutfit.name} saved securely to cloud!`);
    } catch (error: any) {
      // This will catch the 'You must be logged in' error
      setSaveMessage(error.message || "Failed to save outfit.");
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-73px)] w-full overflow-hidden">
      {/* Wardrobe – left sliding sidebar */}
      <aside
        className={`h-full border-r transition-all duration-300 ease-in-out ${
          isWardrobeOpen ? "w-1/2 border-slate-200" : "w-20 border-transparent"
        }`}
      >
        <WardrobeSidebar
          isOpen={isWardrobeOpen}
          onToggle={() => setIsWardrobeOpen((prev) => !prev)}
          onEquipOutfit={(upper, lower) => {
            setUpperWear(upper);
            setLowerWear(lower);
          }}
          newlySavedOutfit={newlySavedOutfit}
        />
      </aside>

      {/* Center stage – blank canvas */}
      <section className="relative flex flex-1 items-center justify-center transition-all duration-300 ease-in-out">
        <div className="absolute right-6 top-6 z-10 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleSaveOutfit}
            className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-darkgreen"
          >
            Save Outfit
          </button>

          {saveMessage ? (
            <p className="rounded-lg bg-white/95 px-3 py-2 text-sm text-slate-700 shadow-sm">
              {saveMessage}
            </p>
          ) : null}
        </div>

        <AvatarCanvas
          upperWear={upperWear}
          lowerWear={lowerWear}
          onUpperWearChange={setUpperWear}
          onLowerWearChange={setLowerWear}
        />
      </section>
    </main>
  );
}
