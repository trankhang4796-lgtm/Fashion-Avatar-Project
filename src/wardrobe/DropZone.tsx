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
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <p className="mb-3 text-sm text-slate-600">
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
          className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {isCameraOpen ? "Close Camera" : "Take Photo"}
        </button>
      </div>

      {/* Hidden input for traditional file browsing */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}