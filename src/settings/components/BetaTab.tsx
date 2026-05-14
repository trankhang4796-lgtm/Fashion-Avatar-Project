"use client";

type BetaTabProps = {
  betaFeaturesEnabled: boolean;
  setBetaFeaturesEnabled: (v: boolean) => void;
  betaFastAiGeneration: boolean;
  setBetaFastAiGeneration: (v: boolean) => void;
  setCustomAvatarUrl: (url: string | null) => void;
};

export default function BetaTab({
  betaFeaturesEnabled,
  setBetaFeaturesEnabled,
  betaFastAiGeneration,
  setBetaFastAiGeneration,
  setCustomAvatarUrl,
}: BetaTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-6">Beta</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">Enable Beta Features</h3>
              <p className="mt-1 text-sm text-foreground/70">Turn on experimental features. These may change frequently.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={betaFeaturesEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setBetaFeaturesEnabled(enabled);
                  if (!enabled) {
                    setBetaFastAiGeneration(false);
                    setCustomAvatarUrl(null);
                    window.localStorage.removeItem("fashion-avatar:hide-beta-warning");
                  }
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
            </label>
          </div>

          <div className={betaFeaturesEnabled ? "" : "pointer-events-none opacity-50"}>
            <h3 className="text-sm font-semibold text-foreground">Avatar Generation Models</h3>
            <p className="mt-1 text-sm text-foreground/70">Choose which beta model paths are available for avatar generation.</p>

            <div className="mt-4 space-y-6 rounded-xl border border-border-theme bg-surface-alt/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Fast AI Generation (API)</h4>
                  <p className="mt-1 text-sm text-foreground/70">Faster generation using a hosted API endpoint.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={betaFastAiGeneration}
                    disabled={!betaFeaturesEnabled}
                    onChange={(e) => {
                      setBetaFastAiGeneration(e.target.checked);
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
