"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

type PrivacyTabProps = {
  supabase: SupabaseClient;
  user: User;
  isPublicProfile: boolean;
  setIsPublicProfile: (v: boolean) => void;
};

export default function PrivacyTab({
  supabase,
  user,
  isPublicProfile,
  setIsPublicProfile,
}: PrivacyTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-6">Privacy & Safety</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">Public Profile</h3>
              <p className="mt-1 text-sm text-foreground/70">Allow your saved outfits to appear on the Community Feed.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isPublicProfile}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setIsPublicProfile(checked);
                  await supabase.from("profiles").update({ is_public: checked }).eq("id", user.id);
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">Download My Data</h3>
              <p className="mt-1 text-sm text-foreground/70">Get a copy of your wardrobe items and saved outfits.</p>
            </div>
            <button
              className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt transition-colors"
              type="button"
            >
              Request Data
            </button>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
            <p className="mt-1 mb-3 text-sm text-foreground/70">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              type="button"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
