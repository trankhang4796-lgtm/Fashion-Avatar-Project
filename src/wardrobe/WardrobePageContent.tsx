"use client";

import { useWardrobe } from "@/src/context/WardrobeContext";
import WardrobeGrid from "./WardrobeGrid";
import WardrobeUploader from "./WardrobeUploader";

export default function WardrobePageContent() {
  const { items, isLoaded, removeItem } = useWardrobe();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Wardrobe</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          This page shows the same clothing inventory used on the Dashboard.
          Add items from either page and they stay in sync.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <WardrobeUploader />

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Saved items
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {items.length} item{items.length === 1 ? "" : "s"} in your
                wardrobe
              </p>
            </div>
          </div>

          {!isLoaded ? (
            <p className="text-sm text-slate-500">Loading wardrobe...</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                Your wardrobe is empty
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Add your first clothing image from this page or from the
                Dashboard sidebar.
              </p>
            </div>
          ) : (
            <WardrobeGrid items={items} onRemove={removeItem} />
          )}
        </section>
      </div>
    </main>
  );
}
