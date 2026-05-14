"use client";

import { removeBackground } from "@imgly/background-removal";
import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { createClient } from "@/src/utils/supabase/client";
import UsernameSetupModal from "@/src/components/UsernameSetupModal";
import CameraView from "./CameraView";
import ClothingType from "./ClothingType";
import DropZone from "./DropZone";
import { ClothingType as ClothingTypeValue } from "./types";

interface PendingImage {
  id: string;
  fileName: string;
  url: string;
  type: ClothingTypeValue | "";
}

interface WardrobeUploaderProps {
  title?: string;
  description?: string;
  className?: string;
  onUploadComplete?: () => void;
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

async function convertHeicToPng(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const convertedBlob = await heic2any({
    blob: file,
    toType: "image/png",
    quality: 0.9,
  });

  return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
}

/**
 * Downscales raster images so the longest side is at most 1024px before WASM
 * background removal, reducing main-thread stalls on large uploads.
 */
async function downscaleImageMaxDimension1024(source: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    const maxDim = Math.max(w, h);
    if (maxDim <= 1024) {
      const buf = await source.arrayBuffer();
      return new Blob([buf], {
        type:
          (source instanceof File ? source.type : source.type) || "image/jpeg",
      });
    }

    const scale = 1024 / maxDim;
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get canvas 2d context");
    }
    ctx.drawImage(bitmap, 0, 0, tw, th);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        0.92,
      );
    });
  } finally {
    bitmap.close();
  }
}

const ALLOWED_EXTENSIONS = [
  ".heic",
  ".heif",
  ".webp",
  ".bmp",
  ".psd",
  ".raw",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
];

export default function WardrobeUploader({
  title = "Add clothing",
  description = "Upload or take a photo to save a clothing item to your shared wardrobe.",
  className = "",
  onUploadComplete,
}: WardrobeUploaderProps) {
  const { addItem } = useWardrobe();
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [categoryMode, setCategoryMode] = useState<"same" | "per-item">("same");
  const [globalCategory, setGlobalCategory] = useState<ClothingTypeValue | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("Initializing AI...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isCameraOpen, mediaStream]);

  useEffect(() => {
    if (categoryMode !== "same") return;
    setPendingImages((current) =>
      current.map((image) => ({ ...image, type: globalCategory })),
    );
  }, [categoryMode, globalCategory]);

  const processImageFile = async (file: File): Promise<File> => {
    let processedFile: File = file;

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
      const singleBlob = await convertHeicToPng(file);
      processedFile = new File(
        [singleBlob as BlobPart],
        file.name.replace(/\.heic|\.heif/i, ".png"),
        { type: "image/png" },
      );
    }

    const scaledBlob = await downscaleImageMaxDimension1024(processedFile);
    const baseName = processedFile.name.replace(/\.[^/.]+$/, "") || "image";
    const fileForBackgroundRemoval = new File([scaledBlob], `${baseName}-prebg.jpg`, {
      type: scaledBlob.type.startsWith("image/") ? scaledBlob.type : "image/jpeg",
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    const imageBlob = await removeBackground(fileForBackgroundRemoval, {
      progress: (key, current, total) => {
        const percentage = Math.round((current / total) * 100);
        setProgressPercent(percentage);

        if (key.includes("fetch")) {
          setProgressText("Downloading AI model (only happens once)...");
        } else if (key.includes("compute")) {
          setProgressText("Removing background...");
        } else {
          setProgressText("Processing image...");
        }
      },
    });

    const finalFileName =
      processedFile.name.replace(/\.[^/.]+$/, "") + "-nobg.png";
    return new File([imageBlob], finalFileName, {
      type: "image/png",
    });
  };

  const appendProcessedFiles = async (
    files: Array<{ file: Blob; fileName: string }>,
  ) => {
    const nextPending: PendingImage[] = [];

    for (const file of files) {
      try {
        const url = await fileToDataUrl(file.file);
        nextPending.push({
          id: crypto.randomUUID(),
          fileName: file.fileName,
          url,
          type: categoryMode === "same" ? globalCategory : "",
        });
      } catch (error) {
        console.error("Unable to create image preview", error);
      }
    }

    if (nextPending.length > 0) {
      setPendingImages((current) => [...current, ...nextPending]);
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => {
      if (file.type.startsWith("image/")) return true;
      const lowerName = file.name.toLowerCase();
      return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    });

    if (validFiles.length === 0) return;

    setIsProcessing(true);
    const processedFiles: Array<{ file: File; fileName: string }> = [];

    try {
      for (let index = 0; index < validFiles.length; index += 1) {
        const nextFile = validFiles[index];
        setProgressText(
          `Processing ${index + 1} of ${validFiles.length}: ${nextFile.name}`,
        );
        setProgressPercent(0);
        const finalFile = await processImageFile(nextFile);
        processedFiles.push({ file: finalFile, fileName: nextFile.name });
      }
      await appendProcessedFiles(processedFiles);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process one or more images. Please try standard JPG/PNG files.");
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressText("Initializing AI...");
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await addFiles(event.dataTransfer.files);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setMediaStream(stream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Unable to access camera", error);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMediaStream(null);
    setIsCameraOpen(false);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        setIsProcessing(true);

        try {
          const cameraFile = new File([blob], "camera.jpg", {
            type: blob.type || "image/jpeg",
          });
          const finalFile = await processImageFile(cameraFile);
          await appendProcessedFiles([
            {
              file: finalFile,
              fileName: `Camera ${new Date().toLocaleTimeString()}`,
            },
          ]);
        } catch (error) {
          console.error("Error processing camera image:", error);
          alert("Failed to process the captured photo.");
        } finally {
          setIsProcessing(false);
          setProgressPercent(0);
          setProgressText("Initializing AI...");
        }
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const removePendingImage = (id: string) => {
    setPendingImages((current) => current.filter((image) => image.id !== id));
  };

  const clearSelection = () => {
    setPendingImages([]);
    setGlobalCategory("");
    setCategoryMode("same");
  };

  const updatePendingImageCategory = (id: string, type: PendingImage["type"]) => {
    setPendingImages((current) =>
      current.map((image) => (image.id === id ? { ...image, type } : image)),
    );
  };

  const hasCategoryError =
    pendingImages.length > 0 &&
    (categoryMode === "same"
      ? !globalCategory
      : pendingImages.some((image) => !image.type));

  const savePendingImages = async () => {
    const itemsToSave =
      categoryMode === "same"
        ? pendingImages.map((image) => ({
            ...image,
            type: globalCategory as ClothingTypeValue,
          }))
        : pendingImages;

    await Promise.all(
      itemsToSave.map((image) =>
        addItem({
          url: image.url,
          type: image.type as ClothingTypeValue,
          isOwned: true,
        }),
      ),
    );
  };

  const handleAddToWardrobe = async () => {
    if (pendingImages.length === 0 || hasCategoryError) return;

    setIsSaving(true);

    try {
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

        if (!profile || !profile.username || profile.username.startsWith("User_")) {
          setShowUsernameModal(true);
          return;
        }
      }

      await savePendingImages();
      clearSelection();
      onUploadComplete?.();
    } catch (error) {
      console.error("Failed to add items to wardrobe:", error);
      alert("Failed to add one or more items. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const shortFileName = (name: string) =>
    name.length > 28 ? `${name.slice(0, 25)}...` : name;

  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border-theme bg-surface p-5 shadow-sm ${className}`}
    >
      {title || description ? (
        <div className="mb-4">
          {title ? <h2 className="text-lg font-semibold text-foreground">{title}</h2> : null}
          {description ? (
            <p className="mt-1 text-sm text-foreground/70">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <DropZone
          isDragging={isDragging}
          isCameraOpen={isCameraOpen}
          fileInputRef={fileInputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onToggleCamera={isCameraOpen ? stopCamera : startCamera}
        />

        {isProcessing && (
          <div className="mx-auto mt-4 flex w-full max-w-sm flex-col items-center justify-center space-y-2">
            <p className="animate-pulse text-sm font-medium text-foreground/80">
              {progressText}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-brand-mint transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="w-full text-right text-xs text-foreground/50">{progressPercent}%</p>
          </div>
        )}

        {isCameraOpen && (
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            onCapture={captureFromCamera}
            onCancel={stopCamera}
          />
        )}

        <div className="mt-4 rounded-xl border border-border-theme bg-surface-alt p-4">
          <h3 className="text-sm font-semibold text-foreground">Category</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryMode("same")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryMode === "same"
                  ? "bg-brand-mint/20 text-foreground"
                  : "bg-surface text-foreground/70 hover:text-foreground"
              }`}
            >
              Same category for all
            </button>
            <button
              type="button"
              onClick={() => setCategoryMode("per-item")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryMode === "per-item"
                  ? "bg-brand-mint/20 text-foreground"
                  : "bg-surface text-foreground/70 hover:text-foreground"
              }`}
            >
              Choose per item
            </button>
          </div>

          {categoryMode === "same" ? (
            <div className="mt-3">
              <ClothingType
                value={globalCategory}
                onChange={(value) => setGlobalCategory(value as ClothingTypeValue | "")}
                includePlaceholder
              />
            </div>
          ) : null}
        </div>

        {pendingImages.length > 0 ? (
          <div className="mt-4 rounded-xl border border-border-theme bg-surface-alt p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Selected Images ({pendingImages.length})
              </h3>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-medium text-foreground/70 hover:text-foreground"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pendingImages.map((image) => (
                <article
                  key={image.id}
                  className="rounded-lg border border-border-theme bg-surface p-2"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md border border-border-theme bg-surface-alt">
                    <Image
                      src={image.url}
                      alt={image.fileName}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-contain"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-foreground/70">
                    {shortFileName(image.fileName)}
                  </p>

                  {categoryMode === "per-item" ? (
                    <div className="mt-1">
                      <ClothingType
                        value={image.type}
                        onChange={(value) =>
                          updatePendingImageCategory(image.id, value as PendingImage["type"])
                        }
                        includePlaceholder
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => removePendingImage(image.id)}
                    className="mt-1 text-[11px] font-medium text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {hasCategoryError ? (
          <p className="mt-3 text-xs text-red-500">
            Please choose a category for all selected items before saving.
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-10 mt-4 flex shrink-0 flex-wrap justify-end gap-2 border-t border-border-theme bg-surface pt-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt"
        >
          Add More Files
        </button>
        <button
          type="button"
          onClick={handleAddToWardrobe}
          disabled={
            pendingImages.length === 0 || hasCategoryError || isSaving || isProcessing
          }
          className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-darkgreen disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "Saving..."
            : `Add ${pendingImages.length} Item${pendingImages.length === 1 ? "" : "s"}`}
        </button>
      </div>

      {showUsernameModal && (
        <UsernameSetupModal
          onComplete={() => {
            setShowUsernameModal(false);
            void handleAddToWardrobe();
          }}
          onCancel={() => setShowUsernameModal(false)}
        />
      )}
    </section>
  );
}
