"use client";

interface ImageGridProps {
  images: Array<{ id: string; url: string }>;
  onRemove: (id: string) => void;
}

export default function ImageGrid({ images, onRemove }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          {/* Delete button appears on hover */}
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="absolute top-1 right-1 rounded-full bg-white/70 p-1 text-slate-500 opacity-0 backdrop-blur-sm transition-colors group-hover:opacity-100 hover:bg-slate-100 hover:text-red-500"
            title="Remove item"
          >
            ×
          </button>
          {/* The uploaded image */}
          <img
            src={image.url}
            alt={`Uploaded clothing item ${index + 1}`}
            className="h-full w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}