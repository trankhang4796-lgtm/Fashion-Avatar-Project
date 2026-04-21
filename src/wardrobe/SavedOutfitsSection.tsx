"use client";

import { useEffect, useState } from "react";
import {
  getSavedOutfits,
  subscribeToSavedOutfits,
  SavedOutfit,
} from "@/src/utils/outfits";
import SavedOutfitCard from "./SavedOutfitCard";

export default function SavedOutfitsSection() {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadSavedOutfits = async () => {
      const outfits = await getSavedOutfits();

      if (isMounted) {
        setSavedOutfits(outfits);
      }
    };

    void loadSavedOutfits();

    // Re-read outfits only when the shared saved-outfits store changes.
    const unsubscribe = subscribeToSavedOutfits(() => {
      void loadSavedOutfits();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Saved Outfits</h2>
        <p className="mt-1 text-sm text-slate-600">
          Outfits you save from the Dashboard will appear here.
        </p>
      </div>

      {savedOutfits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-800">
            No saved outfits yet.
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Build an outfit on the Dashboard and click Save Outfit to see it
            here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {savedOutfits.map((outfit) => (
            <SavedOutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}
    </section>
  );
}
