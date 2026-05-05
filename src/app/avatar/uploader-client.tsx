"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { useBetaSettings } from "@/src/hooks/useBetaSettings";

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

export default function AvatarUploaderClient() {
  const { customAvatarUrl, setCustomAvatarUrl } = useWardrobe();
  const { betaFeaturesEnabled, isLoading } = useBetaSettings();

  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    setIsSaving(true);
    try {
      const url = await fileToDataUrl(file);
      setCustomAvatarUrl(url);
    } catch (error) {
      console.error("Unable to save custom avatar", error);
      alert("Unable to read that file. Please try a different image.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border-theme bg-surface p-6 text-center shadow-sm">
        <p className="text-sm text-foreground/70">Loading beta settings...</p>
      </section>
    );
  }

  if (!betaFeaturesEnabled) {
    return (
      <section className="rounded-2xl border border-border-theme bg-surface p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Custom Avatar</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Custom Avatars are a Beta feature. Please enable Beta Features in your Settings to use this.
        </p>
        <Link
          href="/settings?tab=beta"
          className="mt-4 inline-flex rounded-lg border border-border-theme bg-surface-alt px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-surface"
        >
          Go to Settings
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border-theme bg-surface p-6 text-center shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Custom Avatar</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Upload an image to use as your custom avatar.
        </p>
      </div>

      {customAvatarUrl ? (
        <div className="rounded-xl border border-border-theme bg-surface-alt p-4">
          <h3 className="text-sm font-semibold text-foreground">Preview</h3>
          <div className="mt-6 flex flex-col items-center justify-center gap-6">
            <div className="relative mx-auto w-72 sm:w-80 md:w-96 aspect-[1/2] max-w-full overflow-hidden rounded-xl border border-border-theme bg-surface">
              <Image
                src={customAvatarUrl}
                alt="Custom avatar"
                fill
                unoptimized
                sizes="(max-width: 640px) 288px, (max-width: 768px) 320px, 384px"
                className="object-contain"
              />
            </div>

            <div className="flex w-full max-w-sm flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="w-full min-w-0 flex-1 rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Replace Avatar"}
              </button>
              <button
                type="button"
                onClick={() => setCustomAvatarUrl(null)}
                className="w-full min-w-0 flex-1 rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface"
              >
                Remove / Clear Avatar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`mx-auto flex w-72 sm:w-80 md:w-96 aspect-[1/2] max-w-full flex-col items-center justify-center rounded border-2 border-dashed p-5 text-center transition-colors ${
            isDragging ? "border-blue-600 bg-blue-50" : "border-border-theme bg-surface hover:bg-surface-alt"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            await addFiles(e.dataTransfer.files);
          }}
        >
          <p className="mb-3 text-sm text-foreground/70">
            Drag and drop an avatar image here
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="rounded bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Browse Files"}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.webp,.bmp"
        className="hidden"
        onChange={async (e) => {
          await addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}

