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
  const [shoes, setShoes] = useState<WardrobeItem | null>(null);
  const [accessories, setAccessories] = useState<WardrobeItem[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [newlySavedOutfit, setNewlySavedOutfit] = useState<SavedOutfit | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatarImage, setGeneratedAvatarImage] = useState<string | null>(
    null,
  );
  const [showBetaWarning, setShowBetaWarning] = useState(false);
  const [dontShowAgainWarning, setDontShowAgainWarning] = useState(false);

  const { editingOutfit, setEditingOutfit, customAvatarUrl } = useWardrobe();
  const betaSettings = useBetaSettings();
  const canGenerateAiTryOn =
    betaSettings.betaFeaturesEnabled && betaSettings.betaFastAiGeneration;

  useEffect(() => {
    if (
      betaSettings.betaFeaturesEnabled &&
      !window.localStorage.getItem("fashion-avatar:hide-beta-warning")
    ) {
      setShowBetaWarning(true);
    } else {
      setShowBetaWarning(false);
    }
  }, [betaSettings.betaFeaturesEnabled]);

  useEffect(() => {
    if (editingOutfit) {
      setUpperWear(editingOutfit.upperWear);
      setLowerWear(editingOutfit.lowerWear);
      setShoes(editingOutfit.shoes ?? null);
      setAccessories(editingOutfit.accessories ?? []);
    }
  }, [editingOutfit]);

  const handleSaveOutfit = async () => {
    if (!upperWear || !lowerWear || !shoes) {
      setSaveMessage("Upper, Lower, and Shoes are required to save an outfit.");
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
        shoes,
        accessories,
      });
      setNewlySavedOutfit(savedOutfit);

      setSaveMessage(`${savedOutfit.name} saved securely to cloud!`);
    } catch (error: any) {
      setSaveMessage(error.message || "Failed to save outfit.");
    }
  };

  const handleGenerateAiTryOn = async () => {
    const hasAccessory = accessories.length > 0;
    if (!upperWear && !lowerWear && !shoes && !hasAccessory) {
      setSaveMessage(
        "Equip at least one clothing item (upper, lower, shoes, or accessories) before generating.",
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
        shoesUrl: shoes?.url || null,
        accessoriesUrls: accessories.map((a) => a.url),
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

  const handleCloseBetaWarning = () => {
    if (dontShowAgainWarning) {
      window.localStorage.setItem("fashion-avatar:hide-beta-warning", "true");
    }
    setShowBetaWarning(false);
  };

  return (
    <main className="relative flex flex-col md:flex-row h-auto min-h-full lg:h-full w-full overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0">
      {/* Wardrobe – left sliding sidebar */}
      <aside
        className={`absolute left-0 top-0 z-40 h-full bg-surface transition-all duration-300 ease-in-out md:relative md:block md:min-h-0 md:shrink-0 ${
          isWardrobeOpen
            ? "w-full border-r border-border-theme md:w-1/2"
            : "w-0 overflow-hidden md:w-20 md:border-transparent"
        }`}
      >
        <WardrobeSidebar
          isOpen={isWardrobeOpen}
          onToggle={() => setIsWardrobeOpen((prev) => !prev)}
          onEquipOutfit={(upper, lower, nextShoes, nextAccessories) => {
            setUpperWear(upper);
            setLowerWear(lower);
            setShoes(nextShoes);
            setAccessories(nextAccessories);
          }}
          newlySavedOutfit={newlySavedOutfit}
          onUpperWearChange={setUpperWear}
          onLowerWearChange={setLowerWear}
          onShoesChange={setShoes}
          onAccessoriesChange={setAccessories}
        />
      </aside>

      {/* Center stage – blank canvas */}
      <section className="relative z-0 flex h-auto min-h-0 w-full min-w-0 flex-1 items-center justify-center overflow-y-auto lg:h-full lg:overflow-hidden transition-all duration-300 ease-in-out">
        {!isWardrobeOpen ? (
          <button
            type="button"
            onClick={() => setIsWardrobeOpen(true)}
            className="absolute left-4 top-6 z-30 flex h-14 w-14 items-center justify-center rounded-lg border border-border-theme bg-surface text-xl text-foreground shadow-sm transition-colors hover:bg-surface-alt md:hidden"
            aria-label="Open wardrobe"
          >
            +
          </button>
        ) : null}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 md:top-6 z-10 flex flex-col items-center md:items-end gap-2 w-full px-4 md:px-0 md:w-auto">
          <div className="flex gap-2">
            {editingOutfit ? (
              <>
                <button
                  onClick={async () => {
                    try {
                      setSaveMessage("Updating...");
                      const updatedOutfit = await updateOutfitInCloud(
                        editingOutfit.id,
                        upperWear,
                        lowerWear,
                        shoes,
                        accessories,
                      );
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
                    setShoes(null);
                    setAccessories([]);
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
                  disabled={!upperWear || !lowerWear || !shoes}
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
          shoes={shoes}
          accessories={accessories}
          onUpperWearChange={setUpperWear}
          onLowerWearChange={setLowerWear}
          onShoesChange={setShoes}
          onAccessoriesChange={setAccessories}
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

      {showBetaWarning ? (
        <div className="absolute bottom-6 right-6 z-50 w-80 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg dark:border-amber-900/50 dark:bg-amber-900/20 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-500">
                Beta Limitations
              </h3>
              <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-500/80">
                AI Try-On is in Beta. Generated avatars, clothing fits, and details may be
                inaccurate or contain visual artifacts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseBetaWarning}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-400"
              aria-label="Close warning"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgainWarning}
              onChange={(e) => setDontShowAgainWarning(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <label
              htmlFor="dont-show-again"
              className="text-xs text-amber-700/80 dark:text-amber-500/80 cursor-pointer"
            >
              Don't show again while Beta is on
            </label>
          </div>
        </div>
      ) : null}
    </main>
  );
}
