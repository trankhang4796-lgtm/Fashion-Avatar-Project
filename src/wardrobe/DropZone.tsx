"use client";

import { ChangeEvent, DragEvent, RefObject } from "react";

interface DropZoneProps {
  isDragging: boolean;
  isCameraOpen: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggleCamera: () => void;
}

export default function DropZone({
  isDragging,
  isCameraOpen,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onToggleCamera,
}: DropZoneProps) {
  return (
    <div
      className={`mb-4 flex min-h-48 flex-col items-center justify-center rounded border-2 border-dashed p-5 text-center transition-colors ${
        isDragging
          ? "border-blue-600 bg-blue-50"
          : "border-border-theme bg-surface hover:bg-surface-alt"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <p className="mb-3 text-sm text-foreground/70">
        Drag and drop clothing images here
      </p>

      <div className="flex gap-2">
        {/* Triggers the hidden file input */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-200"
        >
          Browse Files
        </button>
        
        {/* Toggles the camera feature */}
        <button
          type="button"
          onClick={onToggleCamera}
          className="rounded border border-border-theme bg-surface-alt px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-surface"
        >
          {isCameraOpen ? "Close Camera" : "Take Photo"}
        </button>
      </div>

      {/* Hidden input for traditional file browsing */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.webp,.bmp,.psd,.raw"
        multiple
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}