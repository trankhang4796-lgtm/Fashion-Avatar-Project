"use client";

import { useState } from "react";
import AvatarCanvas from "@/src/avatar/AvatarCanvas";
import WardrobeSidebar from "@/src/wardrobe/WardrobeSidebar";
import UsernameSetupModal from "@/src/components/UsernameSetupModal";
import DashboardControls from "@/src/dashboard/components/DashboardControls";
import AITryOnPreviewModal from "@/src/dashboard/components/AITryOnPreviewModal";
import { useDashboard } from "@/src/hooks/useDashboard";

export default function DashboardPage() {
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);

  const {
    upperWear,
    setUpperWear,
    lowerWear,
    setLowerWear,
    shoes,
    setShoes,
    accessories,
    setAccessories,
    saveMessage,
    newlySavedOutfit,
    showUsernameModal,
    setShowUsernameModal,
    isGenerating,
    generatedAvatarImage,
    setGeneratedAvatarImage,
    showBetaWarning,
    dontShowAgainWarning,
    setDontShowAgainWarning,
    editingOutfit,
    canGenerateAiTryOn,
    handleSaveOutfit,
    handleGenerateAiTryOn,
    handleDownloadImage,
    handleUpdateOutfit,
    handleDiscardEdit,
    handleClearOutfit,
    handleCloseBetaWarning,
  } = useDashboard();

  return (
    <main className="relative flex flex-col md:flex-row h-auto min-h-full lg:h-full w-full overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0">
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

        <DashboardControls
          editingOutfit={editingOutfit}
          upperWear={upperWear}
          lowerWear={lowerWear}
          shoes={shoes}
          canGenerateAiTryOn={canGenerateAiTryOn}
          isGenerating={isGenerating}
          saveMessage={saveMessage}
          onUpdateOutfit={handleUpdateOutfit}
          onDiscardEdit={handleDiscardEdit}
          onGenerateAiTryOn={handleGenerateAiTryOn}
          onSaveOutfit={handleSaveOutfit}
          onClearOutfit={handleClearOutfit}
        />

        {isGenerating ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-foreground/20 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-theme bg-surface px-6 py-5 shadow-xl">
              <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-border-theme border-t-brand-forest"
                aria-label="Generating"
              />
              <p className="text-sm font-medium text-foreground/80">Generating AI try-on…</p>
            </div>
          </div>
        ) : null}

        {generatedAvatarImage ? (
          <AITryOnPreviewModal
            imageUrl={generatedAvatarImage}
            onClose={() => setGeneratedAvatarImage(null)}
            onDownload={handleDownloadImage}
          />
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
            void handleSaveOutfit();
          }}
          onCancel={() => setShowUsernameModal(false)}
        />
      )}

      {showBetaWarning ? (
        <div className="absolute bottom-6 right-6 z-50 w-80 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg dark:border-amber-900/50 dark:bg-amber-900/20 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-500">Beta Limitations</h3>
              <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-500/80">
                AI Try-On is in Beta. Generated avatars, clothing fits, and details may be inaccurate or contain visual
                artifacts.
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
              Do not show again while Beta is on
            </label>
          </div>
        </div>
      ) : null}
    </main>
  );
}
