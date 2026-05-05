"use client";

import { useEffect, useState } from "react";
import AvatarCanvas from "@/src/avatar/AvatarCanvas";
import { WardrobeItem } from "@/src/wardrobe/types";
import { useWardrobe } from "@/src/context/WardrobeContext";
import WardrobeSidebar from "@/src/wardrobe/WardrobeSidebar";
import type { SavedOutfit } from "@/src/utils/outfits";
import { saveOutfitToCloud, updateOutfitInCloud } from "@/src/utils/outfits";
import { createClient } from "@/src/utils/supabase/client";
import UsernameSetupModal from "@/src/components/UsernameSetupModal";
import { useBetaSettings } from "@/src/hooks/useBetaSettings";
import { generateAvatar } from "@/src/services/avatarGenerationService";

export default function DashboardPage() {
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [upperWear, setUpperWear] = useState<WardrobeItem | null>(null);
  const [lowerWear, setLowerWear] = useState<WardrobeItem | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [newlySavedOutfit, setNewlySavedOutfit] = useState<SavedOutfit | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatarImage, setGeneratedAvatarImage] = useState<string | null>(
    null,
  );

  const { editingOutfit, setEditingOutfit, customAvatarUrl } = useWardrobe();
  const betaSettings = useBetaSettings();
  const canGenerateAiTryOn =
    betaSettings.betaFeaturesEnabled &&
    (betaSettings.betaFastAiGeneration || betaSettings.betaHighAccuracyVto);

  useEffect(() => {
    if (editingOutfit) {
      setUpperWear(editingOutfit.upperWear);
      setLowerWear(editingOutfit.lowerWear);
    }
  }, [editingOutfit]);

  const handleSaveOutfit = async () => {
    if (!upperWear && !lowerWear) {
      setSaveMessage("Add an upper or lower clothing item before saving.");
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      // If no profile, no username, or they still have an auto-generated "User_" name
      if (!profile || !profile.username || profile.username.startsWith("User_")) {
        setShowUsernameModal(true);
        return;
      }
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
      setSaveMessage(error.message || "Failed to save outfit.");
    }
  };

  const handleGenerateAiTryOn = async () => {
    if (!upperWear && !lowerWear) {
      setSaveMessage(
        "Equip at least one clothing item (upper or lower) before generating.",
      );
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedAvatarImage(null);
      setSaveMessage("Generating AI try-on...");

      const payload = {
        upperWearUrl: upperWear?.url || null,
        lowerWearUrl: lowerWear?.url || null,
        customAvatarUrl: customAvatarUrl || null,
      };

      const result = await generateAvatar(payload, betaSettings);
      if (typeof result === "string" && result.length > 0) {
        setGeneratedAvatarImage(result);
        setSaveMessage("AI try-on generated!");
      } else {
        setSaveMessage(
          "AI generation completed, but no preview image URL was returned.",
        );
      }
    } catch (error: any) {
      setSaveMessage(error?.message || "Failed to generate AI try-on.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-73px)] w-full overflow-hidden">
      {/* Wardrobe – left sliding sidebar */}
      <aside
        className={`h-full border-r transition-all duration-300 ease-in-out ${
          isWardrobeOpen ? "w-1/2 border-border-theme" : "w-20 border-transparent"
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
          <div className="flex gap-2">
            {editingOutfit ? (
              <>
                <button
                  onClick={async () => {
                    try {
                      setSaveMessage("Updating...");
                      const updatedOutfit = await updateOutfitInCloud(editingOutfit.id, upperWear, lowerWear);
                      setNewlySavedOutfit(updatedOutfit); // This sends the updated data instantly to the sidebar!
                      setSaveMessage("Outfit updated!");
                      setEditingOutfit(null); // Exit edit mode
                    } catch (e: any) {
                      setSaveMessage("Failed to update.");
                    }
                  }}
                  className="rounded-lg bg-brand-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-forest"
                >
                  Update Outfit
                </button>
                <button
                  onClick={() => {
                    setEditingOutfit(null);
                    setUpperWear(null);
                    setLowerWear(null);
                    setSaveMessage("Discarded changes.");
                  }}
                  className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-sm font-semibold text-foreground/70 shadow-sm hover:bg-surface-alt"
                >
                  Discard
                </button>
              </>
            ) : (
              <>
                {canGenerateAiTryOn ? (
                  <button
                    onClick={handleGenerateAiTryOn}
                    disabled={isGenerating}
                    className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating ? "Generating..." : "✨ Generate AI Try-On"}
                  </button>
                ) : null}
                <button
                  onClick={handleSaveOutfit}
                  className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-darkgreen"
                >
                  Save Outfit
                </button>
              </>
            )}
          </div>

          {saveMessage ? (
            <p className="rounded-lg bg-white/95 px-3 py-2 text-sm text-slate-700 shadow-sm">
              {saveMessage}
            </p>
          ) : null}
        </div>

        {isGenerating ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-foreground/20 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-theme bg-surface px-6 py-5 shadow-xl">
              <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-border-theme border-t-brand-forest"
                aria-label="Generating"
              />
              <p className="text-sm font-medium text-foreground/80">
                Generating AI try-on…
              </p>
            </div>
          </div>
        ) : null}

        {generatedAvatarImage ? (
          <div
            className="absolute inset-0 z-30 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-label="AI try-on preview"
          >
            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border-theme bg-surface shadow-2xl">
              <div className="flex items-center justify-between gap-4 border-b border-border-theme bg-surface-alt px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    AI Try-On Preview
                  </h2>
                  <p className="mt-1 text-sm text-foreground/70">
                    Review the generated result. Close to discard this preview.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedAvatarImage(null)}
                  className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm hover:bg-surface-alt"
                >
                  Close / Discard
                </button>
              </div>

              <div className="p-5">
                <div className="overflow-hidden rounded-2xl border border-border-theme bg-surface-alt">
                  <img
                    src={generatedAvatarImage}
                    alt="Generated AI try-on"
                    className="h-[70vh] w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <AvatarCanvas
          upperWear={upperWear}
          lowerWear={lowerWear}
          onUpperWearChange={setUpperWear}
          onLowerWearChange={setLowerWear}
        />
      </section>

      {showUsernameModal && (
        <UsernameSetupModal
          onComplete={() => {
            setShowUsernameModal(false);
            handleSaveOutfit();
          }}
          onCancel={() => setShowUsernameModal(false)}
        />
      )}
    </main>
  );
}
