"use client";

type AITryOnPreviewModalProps = {
  imageUrl: string;
  onClose: () => void;
  onDownload: () => void;
};

export default function AITryOnPreviewModal({ imageUrl, onClose, onDownload }: AITryOnPreviewModalProps) {
  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI try-on preview"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border-theme bg-surface shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-border-theme bg-surface-alt px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Try-On Preview</h2>
            <p className="mt-1 text-sm text-foreground/70">Review the generated result. Close to discard this preview.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void onDownload()}
              className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-darkgreen"
            >
              ↓ Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm hover:bg-surface-alt"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="overflow-hidden rounded-2xl border border-border-theme bg-surface-alt">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic external/generated URL */}
            <img src={imageUrl} alt="Generated AI try-on" className="h-[70vh] w-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
