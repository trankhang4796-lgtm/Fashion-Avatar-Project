"use client";

import type { WardrobeItem } from "@/src/wardrobe/types";
import type { SavedOutfit } from "@/src/utils/outfits";

type DashboardControlsProps = {
  editingOutfit: SavedOutfit | null;
  upperWear: WardrobeItem | null;
  lowerWear: WardrobeItem | null;
  shoes: WardrobeItem | null;
  canGenerateAiTryOn: boolean;
  isGenerating: boolean;
  saveMessage: string;
  onUpdateOutfit: () => Promise<void>;
  onDiscardEdit: () => void;
  onGenerateAiTryOn: () => Promise<void>;
  onSaveOutfit: () => Promise<void>;
  onClearOutfit: () => void;
};

export default function DashboardControls({
  editingOutfit,
  upperWear,
  lowerWear,
  shoes,
  canGenerateAiTryOn,
  isGenerating,
  saveMessage,
  onUpdateOutfit,
  onDiscardEdit,
  onGenerateAiTryOn,
  onSaveOutfit,
  onClearOutfit,
}: DashboardControlsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 md:top-6 z-10 flex flex-col items-center md:items-end gap-2 w-full px-4 md:px-0 md:w-auto">
      <div className="flex gap-2">
        {editingOutfit ? (
          <>
            <button
              type="button"
              onClick={() => void onUpdateOutfit()}
              className="rounded-lg bg-brand-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-forest"
            >
              Update Outfit
            </button>
            <button
              type="button"
              onClick={onDiscardEdit}
              className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-sm font-semibold text-foreground/70 shadow-sm hover:bg-surface-alt"
            >
              Discard
            </button>
          </>
        ) : (
          <>
            {canGenerateAiTryOn ? (
              <button
                type="button"
                onClick={() => void onGenerateAiTryOn()}
                disabled={isGenerating}
                className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Generating..." : "✨ Generate AI Try-On"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void onSaveOutfit()}
              disabled={!upperWear || !lowerWear || !shoes}
              className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-darkgreen"
            >
              Save Outfit
            </button>
            <button
              type="button"
              onClick={onClearOutfit}
              className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              title="Remove all clothing"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {saveMessage ? (
        <p className="rounded-lg bg-white/95 px-3 py-2 text-sm text-slate-700 shadow-sm">{saveMessage}</p>
      ) : null}
    </div>
  );
}
