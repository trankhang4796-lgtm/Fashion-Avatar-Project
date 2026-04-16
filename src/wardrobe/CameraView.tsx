"use client";

import { RefObject } from "react";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onCapture: () => void;
  onCancel: () => void;
}

export default function CameraView({
  videoRef,
  canvasRef,
  onCapture,
  onCancel,
}: CameraViewProps) {
  return (
    <div className="flex flex-1 w-full max-w-md mx-auto flex-col items-center justify-center p-6">
      <div className="w-full rounded-lg border border-slate-200 bg-white p-3">
        {/* Displays the live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[3/4] overflow-hidden rounded-xl bg-slate-900 object-cover shadow-md"
        />
        {/* Hidden canvas used to take the snapshot */}
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCapture}
            className="rounded bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-200"
          >
            Capture
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}