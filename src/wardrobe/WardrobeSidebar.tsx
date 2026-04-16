"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
// Import our separated components
import ErrorBoundary from "./ErrorBoundary";
import DropZone from "./DropZone";
import CameraView from "./CameraView";
import ImageGrid from "./ImageGrid";
import ClothingType from "./ClothingType";
import OwnershipToggle from "./OwnershipToggle";

interface WardrobeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ClothingItem {
  id: string;
  url: string;
  type: "upper" | "lower";
  isOwned: boolean;
}

interface PendingImage {
  url: string;
  type: "upper" | "lower";
  isOwned: boolean;
}

export default function WardrobeSidebar({ isOpen, onToggle }: WardrobeSidebarProps) {
  // State management
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<ClothingItem[]>([]);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [activeTab, setActiveTab] = useState<"owned" | "unowned">("owned");
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const createdUrlsRef = useRef<string[]>([]);

  // Cleanup memory when component closes
  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Attach camera stream to video element
  useEffect(() => {
    if (isCameraOpen && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isCameraOpen, mediaStream]);

  const setPendingPreview = (nextPendingImage: PendingImage) => {
    if (pendingImage?.url.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImage.url);
      createdUrlsRef.current = createdUrlsRef.current.filter((url) => url !== pendingImage.url);
    }

    setPendingImage(nextPendingImage);
  };

  // Processes raw files into URLs
  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextUrl = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file))[0];

    if (!nextUrl) return;

    createdUrlsRef.current.push(nextUrl);
    setPendingPreview({
      url: nextUrl,
      type: "upper",
      isOwned: true,
    });
  };

  // UI Handlers
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { addFiles(e.target.files); e.target.value = ""; };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); };

  // Camera Handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
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
    
    setPendingPreview({
      url: canvas.toDataURL("image/jpeg", 0.92),
      type: "upper",
      isOwned: true,
    });
    stopCamera();
  };

  const handleAddToWardrobe = () => {
    if (!pendingImage) return;

    setUploadedImageUrls((prev) => [
      {
        id: crypto.randomUUID(),
        url: pendingImage.url,
        type: pendingImage.type,
        isOwned: pendingImage.isOwned,
      },
      ...prev,
    ]);
    setActiveTab(pendingImage.isOwned ? "owned" : "unowned");
    setPendingImage(null);
  };

  const handleCancelPreview = () => {
    if (pendingImage?.url.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImage.url);
      createdUrlsRef.current = createdUrlsRef.current.filter((url) => url !== pendingImage.url);
    }
    setPendingImage(null);
  };

  // Remove Image Handler
  const handleRemoveItem = (idToRemove: string) => {
    const itemToRemove = uploadedImageUrls.find((item) => item.id === idToRemove);
    if (!itemToRemove) return;

    if (itemToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.url);
      createdUrlsRef.current = createdUrlsRef.current.filter((url) => url !== itemToRemove.url);
    }
    setUploadedImageUrls((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const filteredItems = uploadedImageUrls.filter((item) =>
    activeTab === "owned" ? item.isOwned : !item.isOwned,
  );

  // Closed State UI
  if (!isOpen) {
    return (
      <div className="flex h-full items-start justify-center bg-slate-50 p-3">
        <button onClick={onToggle} className="rounded-lg border border-slate-200 bg-slate-100 w-14 h-14 text-xl">+</button>
      </div>
    );
  }

  // Open State UI (Orchestrating the smaller components)
  return (
    <div className="flex h-full flex-col bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Wardrobe</h2>
        <button onClick={onToggle} className="rounded px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100">Close</button>
      </div>

      {/* Wrapping each distinct feature in an Error Boundary */}
      
      <ErrorBoundary featureName="Drag and Drop Upload">
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
      </ErrorBoundary>

      {isCameraOpen && (
        <ErrorBoundary featureName="Camera">
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            onCapture={captureFromCamera}
            onCancel={stopCamera}
          />
        </ErrorBoundary>
      )}

      {pendingImage && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-700">Preview</p>
          <div className="mb-3 aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img src={pendingImage.url} alt="Pending wardrobe item" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-3">
            <ClothingType
              value={pendingImage.type}
              onChange={(value) =>
                setPendingImage((prev) => (prev ? { ...prev, type: value } : prev))
              }
            />
            <OwnershipToggle
              value={pendingImage.isOwned}
              onChange={(value) =>
                setPendingImage((prev) => (prev ? { ...prev, isOwned: value } : prev))
              }
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddToWardrobe}
                className="flex-1 rounded-lg bg-brand-forest px-3 py-2 text-sm font-medium text-white"
              >
                Add to Wardrobe
              </button>
              <button
                type="button"
                onClick={handleCancelPreview}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorBoundary featureName="Image Gallery">
        <div className="mb-3 flex gap-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("owned")}
            className={`pb-2 text-sm font-medium ${
              activeTab === "owned" ? "border-b-2 border-brand-forest text-brand-forest" : "text-slate-400"
            }`}
          >
            Owned
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unowned")}
            className={`pb-2 text-sm font-medium ${
              activeTab === "unowned" ? "border-b-2 border-brand-forest text-brand-forest" : "text-slate-400"
            }`}
          >
            Unowned
          </button>
        </div>
        <ImageGrid 
          images={filteredItems} 
          onRemove={handleRemoveItem} 
        />
      </ErrorBoundary>
    </div>
  );
}