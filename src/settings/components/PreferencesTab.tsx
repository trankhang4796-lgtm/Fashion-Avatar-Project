"use client";

type PreferencesTabProps = {
  measurementSystem: "imperial" | "metric";
  setMeasurementSystem: (v: "imperial" | "metric") => void;
  defaultWardrobeView: "owned" | "unowned" | "outfits";
  setDefaultWardrobeView: (v: "owned" | "unowned" | "outfits") => void;
  askBeforeCamera: boolean;
  setAskBeforeCamera: (v: boolean) => void;
};

export default function PreferencesTab({
  measurementSystem,
  setMeasurementSystem,
  defaultWardrobeView,
  setDefaultWardrobeView,
  askBeforeCamera,
  setAskBeforeCamera,
}: PreferencesTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-6">App Preferences</h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">Measurement System</h3>
              <p className="mt-1 text-sm text-foreground/70">Used for sizing and avatar adjustments.</p>
            </div>
            <select
              value={measurementSystem}
              onChange={(e) => setMeasurementSystem(e.target.value as "imperial" | "metric")}
              className="w-full sm:w-auto rounded-lg border border-border-theme bg-surface px-3 py-2 text-sm text-foreground/70 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
            >
              <option value="imperial">Imperial (in, lbs)</option>
              <option value="metric">Metric (cm, kg)</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">Default Wardrobe View</h3>
              <p className="mt-1 text-sm text-foreground/70">Choose which tab opens first in the sidebar.</p>
            </div>
            <select
              value={defaultWardrobeView}
              onChange={(e) => setDefaultWardrobeView(e.target.value as "owned" | "unowned" | "outfits")}
              className="w-full sm:w-auto rounded-lg border border-border-theme bg-surface px-3 py-2 text-sm text-foreground/70 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
            >
              <option value="owned">Owned Clothes</option>
              <option value="unowned">Wishlist</option>
              <option value="outfits">Saved Outfits</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="text-sm font-medium text-foreground">Camera Permissions</h3>
              <p className="mt-1 text-sm text-foreground/70">Always ask before turning on the camera in the uploader.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={askBeforeCamera}
                onChange={(e) => setAskBeforeCamera(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
