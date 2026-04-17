"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
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

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nextFile = Array.from(files).find((file) =>
      file.type.startsWith("image/"),
    );

    if (!nextFile) return;

    await setPendingFromFile(nextFile);
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

        await setPendingFromFile(blob);
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleAddToWardrobe = () => {
    if (!pendingImage) return;

    addItem({
      url: pendingImage.url,
      type: pendingImage.type,
      isOwned: pendingImage.isOwned,
    });
    setPendingImage(null);
  };

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

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

      {isCameraOpen && (
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          onCapture={captureFromCamera}
          onCancel={stopCamera}
        />
      )}

      {pendingImage && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Preview</h3>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row">
            <div className="h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-32">
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
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
