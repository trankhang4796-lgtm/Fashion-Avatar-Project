"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
// Import our separated components
import ErrorBoundary from "./ErrorBoundary";
import DropZone from "./DropZone";
import CameraView from "./CameraView";
import ImageGrid from "./ImageGrid";
import ClothingType from "./ClothingType";
import OwnershipToggle from "./OwnershipToggle";
import { createClient } from "@/src/utils/supabase/client";

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
  file?: File | Blob;
}

export default function WardrobeSidebar({ isOpen, onToggle }: WardrobeSidebarProps) {
  const supabase = useMemo(() => createClient(), []);

  // State management
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<ClothingItem[]>([]);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [activeTab, setActiveTab] = useState<"owned" | "unowned">("owned");
  const [user, setUser] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
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

  const fetchWardrobeItems = async () => {
    try {
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching wardrobe items", error);
        return;
      }

      const mapped: ClothingItem[] =
        (data ?? []).map((row: any) => ({
          id: String(row.id),
          url: String(row.image_url),
          type: row.clothing_type === "lower" ? "lower" : "upper",
          isOwned: Boolean(row.is_owned),
        })) ?? [];

      setUploadedImageUrls(mapped);
    } catch (err) {
      console.error("Error fetching wardrobe items", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error getting session", error);

        const nextUser = data.session?.user ?? null;
        if (!isMounted) return;

        setUser(nextUser);
        if (nextUser) {
          await fetchWardrobeItems();
        }
      } catch (err) {
        console.error("Error checking auth session", err);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

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
    const nextFile = Array.from(files).find((file) => file.type.startsWith("image/"));
    if (!nextFile) return;

    const nextUrl = URL.createObjectURL(nextFile);

    if (!nextUrl) return;

    createdUrlsRef.current.push(nextUrl);
    setPendingPreview({
      url: nextUrl,
      type: "upper",
      isOwned: true,
      file: nextFile,
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

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        createdUrlsRef.current.push(blobUrl);
        setPendingPreview({
          url: blobUrl,
          type: "upper",
          isOwned: true,
          file: blob,
        });
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  const handleCancelPreview = () => {
    if (pendingImage?.url.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImage.url);
      createdUrlsRef.current = createdUrlsRef.current.filter((url) => url !== pendingImage.url);
    }
    setPendingImage(null);
  };

  // Remove Image Handler
  const handleRemoveItem = async (idToRemove: string) => {
    const itemToRemove = uploadedImageUrls.find((item) => item.id === idToRemove);
    if (!itemToRemove) return;

    // 1. Optimistically remove from UI for instant user feedback
    setUploadedImageUrls((prev) => prev.filter((item) => item.id !== idToRemove));

    // 2. Handle local Blob URLs (Guest Mode)
    if (itemToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.url);
      createdUrlsRef.current = createdUrlsRef.current.filter((url) => url !== itemToRemove.url);
      return;
    }

    // 3. Handle Supabase Cloud Deletion (Logged in users)
    if (user && itemToRemove.url.includes("supabase.co")) {
      try {
        // Extract the exact filename from the end of the public URL
        const urlParts = itemToRemove.url.split("/wardrobe-images/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];

          // A. Delete from Storage Bucket
          const { error: storageError } = await supabase
            .storage
            .from("wardrobe-images")
            .remove([filePath]);

          if (storageError) {
            console.error("Error deleting image from bucket:", storageError);
          }
        }

        // B. Delete from Database Table
        const { error: dbError } = await supabase
          .from("wardrobe_items")
          .delete()
          .eq("id", itemToRemove.id);

        if (dbError) {
          console.error("Error deleting from database:", dbError);
        }
      } catch (error) {
        console.error("Failed to delete item from cloud:", error);
      }
    }
  };

  const handleAddPendingToWardrobe = async () => {
    if (!pendingImage || isUploading) return;

    if (!user) {
      const newItem: ClothingItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: pendingImage.url,
        type: pendingImage.type,
        isOwned: pendingImage.isOwned,
      };

      setUploadedImageUrls((prev) => [newItem, ...prev]);
      setActiveTab(pendingImage.isOwned ? "owned" : "unowned");
      setPendingImage(null);
      return;
    }

    if (!pendingImage.file) {
      console.error("Missing raw file/blob for upload");
      return;
    }

    setIsUploading(true);
    try {
      const filename = `${user.id}-${Date.now()}.jpeg`;

      const { error: uploadError } = await supabase
        .storage
        .from("wardrobe-images")
        .upload(filename, pendingImage.file, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading image", uploadError);
        return;
      }

      const { data: publicData } = supabase
        .storage
        .from("wardrobe-images")
        .getPublicUrl(filename);

      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) {
        console.error("Unable to get public URL for uploaded image");
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          clothing_type: pendingImage.type,
          is_owned: pendingImage.isOwned,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error inserting wardrobe item row", insertError);
        return;
      }

      const newItem: ClothingItem = {
        id: inserted?.id ? String(inserted.id) : crypto.randomUUID(),
        url: publicUrl,
        type: pendingImage.type,
        isOwned: pendingImage.isOwned,
      };

      setUploadedImageUrls((prev) => [newItem, ...prev]);
      setActiveTab(pendingImage.isOwned ? "owned" : "unowned");

      if (pendingImage.url.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImage.url);
        createdUrlsRef.current = createdUrlsRef.current.filter((url) => url !== pendingImage.url);
      }
      setPendingImage(null);
    } catch (err) {
      console.error("Error adding wardrobe item", err);
    } finally {
      setIsUploading(false);
    }
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
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Preview & metadata
          </h3>
          <div className="mb-3 flex gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <img
                src={pendingImage.url}
                alt="Pending wardrobe item"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <ClothingType
                value={pendingImage.type}
                onChange={(type) =>
                  setPendingImage((prev) =>
                    prev ? { ...prev, type } : prev
                  )
                }
              />
              <OwnershipToggle
                value={pendingImage.isOwned}
                onChange={(isOwned) =>
                  setPendingImage((prev) =>
                    prev ? { ...prev, isOwned } : prev
                  )
                }
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddPendingToWardrobe}
            disabled={isUploading}
            className="w-full rounded-lg bg-brand-forest px-3 py-2 text-sm font-semibold text-white hover:bg-brand-forest/90 disabled:opacity-60"
          >
            {isUploading ? "Adding..." : "Add to Wardrobe"}
          </button>
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