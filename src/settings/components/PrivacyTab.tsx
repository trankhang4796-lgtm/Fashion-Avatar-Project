"use client";

import { useCallback, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { WardrobeItem } from "@/src/wardrobe/types";

type PrivacyTabProps = {
  supabase: SupabaseClient;
  user: User;
  isPublicProfile: boolean;
  setIsPublicProfile: (v: boolean) => void;
};

type WardrobeRow = Record<string, unknown>;
type OutfitRow = Record<string, unknown>;

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
}

function extensionForBlob(blob: Blob, urlHint: string): string {
  if (blob.type === "image/png") return ".png";
  if (blob.type === "image/webp") return ".webp";
  if (blob.type === "image/jpeg" || blob.type === "image/jpg") return ".jpg";
  if (blob.type === "image/gif") return ".gif";
  const match = urlHint.match(/\.(png|webp|gif|jpe?g)(?:\?|$)/i);
  if (match) {
    const ext = match[1].toLowerCase();
    return ext === "jpeg" ? ".jpg" : `.${ext}`;
  }
  return ".jpg";
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for image`);
  }
  return response.blob();
}

function readWardrobeItemUrl(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const url = (item as WardrobeItem).url;
  return isHttpUrl(url) ? url : null;
}

function collectOutfitImagePaths(outfit: OutfitRow): { basePath: string; url: string }[] {
  const id = String(outfit.id ?? "unknown");
  const results: { basePath: string; url: string }[] = [];

  const upper = outfit.upper_wear;
  const upperUrl = readWardrobeItemUrl(upper);
  if (upperUrl) results.push({ basePath: `images/outfits/${id}_upper`, url: upperUrl });

  const lower = outfit.lower_wear;
  const lowerUrl = readWardrobeItemUrl(lower);
  if (lowerUrl) results.push({ basePath: `images/outfits/${id}_lower`, url: lowerUrl });

  const shoes = outfit.shoes ?? outfit.shoes_wear;
  const shoesUrl = readWardrobeItemUrl(shoes);
  if (shoesUrl) results.push({ basePath: `images/outfits/${id}_shoes`, url: shoesUrl });

  const rawAcc = outfit.accessories ?? outfit.accessory_items;
  const accessories = Array.isArray(rawAcc) ? rawAcc : [];
  accessories.forEach((acc, index) => {
    const u = readWardrobeItemUrl(acc);
    if (u) results.push({ basePath: `images/outfits/${id}_accessory_${index}`, url: u });
  });

  return results;
}

export default function PrivacyTab({
  supabase,
  user,
  isPublicProfile,
  setIsPublicProfile,
}: PrivacyTabProps) {
  const [isGatheringData, setIsGatheringData] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const handleRequestData = useCallback(async () => {
    setIsGatheringData(true);
    try {
      const { data: wardrobeRows, error: wardrobeError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (wardrobeError) {
        throw new Error(wardrobeError.message || "Failed to load wardrobe items.");
      }

      const { data: outfitRows, error: outfitsError } = await supabase
        .from("saved_outfits")
        .select("*")
        .eq("user_id", user.id);

      if (outfitsError) {
        throw new Error(outfitsError.message || "Failed to load saved outfits.");
      }

      const wardrobe: WardrobeRow[] = (wardrobeRows ?? []) as WardrobeRow[];
      const outfits: OutfitRow[] = (outfitRows ?? []) as OutfitRow[];

      const imageFailures: string[] = [];

      const zip = new JSZip();

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        wardrobe_items: wardrobe,
        saved_outfits: outfits,
        imageDownloadFailures: [] as string[],
      };

      const wardrobeTasks = wardrobe.map((row) => {
        const id = String(row.id ?? "item");
        const url = row.image_url;
        return isHttpUrl(url) ? { basePath: `images/wardrobe/${id}`, url } : null;
      });

      const outfitTasks = outfits.flatMap((row) => collectOutfitImagePaths(row));

      const allTasks = [...wardrobeTasks.filter(Boolean), ...outfitTasks] as {
        basePath: string;
        url: string;
      }[];

      for (const { basePath, url } of allTasks) {
        try {
          const blob = await fetchImageBlob(url);
          const ext = extensionForBlob(blob, url);
          zip.file(`${basePath}${ext}`, blob);
        } catch {
          imageFailures.push(url);
        }
      }

      exportPayload.imageDownloadFailures = imageFailures;

      zip.file("data.json", JSON.stringify(exportPayload, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "my-fava-data.zip");

      if (imageFailures.length > 0) {
        alert(
          `Your download started, but ${imageFailures.length} image(s) could not be fetched. Details are listed in data.json under "imageDownloadFailures".`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while exporting your data.";
      alert(message);
    } finally {
      setIsGatheringData(false);
    }
  }, [supabase, user]);

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
            <label
              className={`relative inline-flex items-center ${
                isUpdatingPrivacy ? "cursor-wait opacity-60 pointer-events-none" : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={isPublicProfile}
                disabled={isUpdatingPrivacy}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setIsUpdatingPrivacy(true);
                  try {
                    if (!checked) {
                      const { error: outfitsError } = await supabase
                        .from("saved_outfits")
                        .update({ is_published: false })
                        .eq("user_id", user.id);
                      if (outfitsError) {
                        throw new Error(outfitsError.message || "Failed to unpublish outfits.");
                      }
                    }

                    const { error: profileError } = await supabase
                      .from("profiles")
                      .update({ is_public: checked })
                      .eq("id", user.id);
                    if (profileError) {
                      throw new Error(profileError.message || "Failed to update profile visibility.");
                    }

                    setIsPublicProfile(checked);
                    window.dispatchEvent(new Event("saved-outfits-updated"));
                  } catch (err) {
                    const message =
                      err instanceof Error
                        ? err.message
                        : "Could not update your privacy settings. Please try again.";
                    alert(message);
                  } finally {
                    setIsUpdatingPrivacy(false);
                  }
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
              className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={isGatheringData}
              onClick={() => void handleRequestData()}
            >
              {isGatheringData ? "Gathering Data..." : "Request Data"}
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
