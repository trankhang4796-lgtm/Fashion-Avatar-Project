"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
// Import our separated components
import ErrorBoundary from "./ErrorBoundary";
import DropZone from "./DropZone";
import CameraView from "./CameraView";
import ImageGrid from "./ImageGrid";

interface WardrobeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function WardrobeSidebar({ isOpen, onToggle }: WardrobeSidebarProps) {
  // State management
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  
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

  // Processes raw files into URLs
  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextUrls = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file));

    if (nextUrls.length === 0) return;
    createdUrlsRef.current.push(...nextUrls);
    setUploadedImageUrls((prev) => [...prev, ...nextUrls]);
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
    
    setUploadedImageUrls((prev) => [canvas.toDataURL("image/jpeg", 0.92), ...prev]);
    stopCamera();
  };

  // Remove Image Handler
  const handleRemoveItem = (urlToRemove: string) => {
    if (urlToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(urlToRemove);
      createdUrlsRef.current = createdUrlsRef.current.filter((url) => url !== urlToRemove);
    }
    setUploadedImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  // Closed State UI
  if (!isOpen) {
    return (
      <div className="flex h-full items-start justify-center bg-slate-50 p-3">
        <button onClick={onToggle} className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-xl">+</button>
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

      <ErrorBoundary featureName="Image Gallery">
        <ImageGrid 
          images={uploadedImageUrls} 
          onRemove={handleRemoveItem} 
        />
      </ErrorBoundary>
    </div>
  );
}