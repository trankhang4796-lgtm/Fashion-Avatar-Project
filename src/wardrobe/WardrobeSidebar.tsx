"use client";

interface WardrobeSidebarProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

export default function WardrobeSidebar({ isOpen, toggleOpen }: WardrobeSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-amber-100/80 p-4">
      <button
        type="button"
        onClick={toggleOpen}
        className="mb-4 rounded border border-amber-600 bg-amber-200 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-300"
        aria-label={isOpen ? "Close wardrobe" : "Open wardrobe"}
      >
        {isOpen ? "Close" : "Open"}
      </button>
      <div className="flex flex-1 items-center justify-center rounded border-2 border-dashed border-amber-400 bg-amber-50/50 text-amber-800">
        WardrobeSidebar
      </div>
    </div>
  );
}
