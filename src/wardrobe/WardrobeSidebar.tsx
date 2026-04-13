"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

interface WardrobeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function WardrobeSidebar({
  isOpen,
  onToggle,
}: WardrobeSidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const createdUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isCameraOpen, mediaStream]);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nextUrls = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file));

    if (nextUrls.length === 0) return;

    createdUrlsRef.current.push(...nextUrls);
    setUploadedImageUrls((prev) => [...prev, ...nextUrls]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
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

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
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
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.92);
    setUploadedImageUrls((prev) => [imageUrl, ...prev]);
    stopCamera();
  };

  const handleRemoveItem = (urlToRemove: string) => {
    if (urlToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(urlToRemove);
      createdUrlsRef.current = createdUrlsRef.current.filter(
        (url) => url !== urlToRemove,
      );
    }

    setUploadedImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  if (!isOpen) {
    return (
      <div className="flex h-full items-start justify-center bg-slate-50 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-xl leading-none text-slate-700 hover:bg-blue-50"
          aria-label="Open wardrobe"
          title="Open wardrobe"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Wardrobe</h2>
        <button
          type="button"
          onClick={onToggle}
          className="rounded px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          Close
        </button>
      </div>

      <div
        className={`mb-4 flex min-h-48 flex-col items-center justify-center rounded border-2 border-dashed p-5 text-center transition-colors ${
          isDragging
            ? "border-blue-600 bg-blue-50"
            : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="mb-3 text-sm text-slate-600">
          Drag and drop clothing images here
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-200"
          >
            Browse Files
          </button>
          <button
            type="button"
            onClick={isCameraOpen ? stopCamera : startCamera}
            className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            {isCameraOpen ? "Close Camera" : "Take Photo"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isCameraOpen && (
        <div className="flex flex-1 w-full max-w-md mx-auto flex-col items-center justify-center p-6">
          <div className="w-full rounded-lg border border-slate-200 bg-white p-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[3/4] overflow-hidden rounded-xl bg-slate-900 object-cover shadow-md"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={captureFromCamera}
                className="rounded bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-200"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
        {uploadedImageUrls.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
          >
            <button
              type="button"
              onClick={() => handleRemoveItem(imageUrl)}
              className="absolute top-1 right-1 rounded-full bg-white/70 p-1 text-slate-500 opacity-0 backdrop-blur-sm transition-colors group-hover:opacity-100 hover:bg-slate-100 hover:text-red-500"
              aria-label="Remove clothing item"
              title="Remove item"
            >
              ×
            </button>
            <img
              src={imageUrl}
              alt={`Uploaded clothing item ${index + 1}`}
              className="h-full w-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
