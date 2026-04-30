"use client";

import { removeBackground } from "@imgly/background-removal";
import heic2any from "heic2any";
import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { createClient } from "@/src/utils/supabase/client";
import UsernameSetupModal from "@/src/components/UsernameSetupModal";
import CameraView from "./CameraView";
import ClothingType from "./ClothingType";
import DropZone from "./DropZone";
import OwnershipToggle from "./OwnershipToggle";
import { ClothingType as ClothingTypeValue } from "./types";

interface PendingImage {
  url: string;
  type: ClothingTypeValue;
  isOwned: boolean;
}

interface WardrobeUploaderProps {
  title?: string;
  description?: string;
  className?: string;
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

export default function WardrobeUploader({
  title = "Add clothing",
  description = "Upload or take a photo to save a clothing item to your shared wardrobe.",
  className = "",
}: WardrobeUploaderProps) {
  const { addItem } = useWardrobe();
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("Initializing AI...");
  const [progressPercent, setProgressPercent] = useState(0);
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

  const setPendingFromFile = async (file: Blob) => {
    try {
      const url = await fileToDataUrl(file);
      setPendingImage({
        url,
        type: "upper",
        isOwned: true,
      });
    } catch (error) {
      console.error("Unable to create image preview", error);
    }
  };

  const processImageFile = async (file: File): Promise<File> => {
    setIsProcessing(true);

    try {
      let processedFile: File = file;

      // STEP 1: Convert HEIC/HEIF to PNG for browser compatibility
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
        const convertedBlob = await heic2any({ blob: file, toType: "image/png" });
        // Handle case where heic2any returns an array of blobs
        const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        processedFile = new File(
          [singleBlob as BlobPart],
          file.name.replace(/\.heic|\.heif/i, ".png"),
          { type: "image/png" },
        );
      }

      // STEP 2: Remove the Background using AI with progress tracking
      const imageBlob = await removeBackground(processedFile, {
        progress: (key, current, total) => {
          const percentage = Math.round((current / total) * 100);
          setProgressPercent(percentage);

          // 'key' tells us what the AI is doing (e.g., fetching models or computing)
          if (key.includes("fetch")) {
            setProgressText("Downloading AI model (only happens once)...");
          } else if (key.includes("compute")) {
            setProgressText("Removing background...");
          } else {
            setProgressText("Processing image...");
          }
        },
      });

      // Create the final clean file
      const finalFileName =
        processedFile.name.replace(/\.[^/.]+$/, "") + "-nobg.png";
      const finalFile = new File([imageBlob], finalFileName, {
        type: "image/png",
      });

      return finalFile;
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process the image. Please try a standard JPG or PNG.");
      throw error;
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressText("Initializing AI...");
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowedExtensions = [
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

    const nextFile = Array.from(files).find((file) => {
      if (file.type.startsWith("image/")) return true;
      const lowerName = file.name.toLowerCase();
      return allowedExtensions.some((ext) => lowerName.endsWith(ext));
    });

    if (!nextFile) return;

    try {
      const finalFile = await processImageFile(nextFile);
      await setPendingFromFile(finalFile);
    } catch {
      // errors already handled in pipeline
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

        try {
          const cameraFile = new File([blob], "camera.jpg", { type: blob.type || "image/jpeg" });
          const finalFile = await processImageFile(cameraFile);
          await setPendingFromFile(finalFile);
        } catch {
          // errors already handled in pipeline
        }
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleAddToWardrobe = async () => {
    if (!pendingImage) return;

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

    addItem({
      url: pendingImage.url,
      type: pendingImage.type,
      isOwned: pendingImage.isOwned,
    });
    setPendingImage(null);
  };

  return (
    <section className={`rounded-2xl border border-border-theme bg-surface p-5 shadow-sm ${className}`}>
      {title || description ? (
        <div className="mb-4">
          {title ? <h2 className="text-lg font-semibold text-foreground">{title}</h2> : null}
          {description ? (
            <p className="mt-1 text-sm text-foreground/70">{description}</p>
          ) : null}
        </div>
      ) : null}

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
        <div className="mt-4 w-full max-w-sm flex flex-col items-center justify-center space-y-2 mx-auto">
          <p className="text-sm font-medium text-foreground/80 animate-pulse">
            {progressText}
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-mint transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-foreground/50 text-right w-full">
            {progressPercent}%
          </p>
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

      {pendingImage && (
        <div className="mt-4 rounded-xl border border-border-theme bg-surface-alt p-4">
          <h3 className="text-sm font-semibold text-foreground">Preview</h3>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row">
            <div className="h-32 w-full overflow-hidden rounded-xl border border-border-theme bg-surface sm:w-32">
              <div className="relative h-full w-full">
                <Image
                  src={pendingImage.url}
                  alt="Pending wardrobe item"
                  fill
                  unoptimized
                  sizes="128px"
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <ClothingType
                value={pendingImage.type}
                onChange={(type) =>
                  setPendingImage((currentImage) =>
                    currentImage ? { ...currentImage, type } : currentImage,
                  )
                }
              />
              <OwnershipToggle
                value={pendingImage.isOwned}
                onChange={(isOwned) =>
                  setPendingImage((currentImage) =>
                    currentImage
                      ? { ...currentImage, isOwned }
                      : currentImage,
                  )
                }
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToWardrobe}
                  className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-darkgreen"
                >
                  Add to Wardrobe
                </button>
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUsernameModal && (
        <UsernameSetupModal
          onComplete={() => {
            setShowUsernameModal(false);
            handleAddToWardrobe();
          }}
          onCancel={() => setShowUsernameModal(false)}
        />
      )}
    </section>
  );
}
