"use client";

import { useState } from "react";
import Image from "next/image";
import { useCommunityFeed } from "@/src/hooks/useCommunityFeed";

export default function CommunityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    myOutfits,
    searchQuery,
    setSearchQuery,
    currentUserId,
    hasMore,
    loading,
    loadingMore,
    sortBy,
    setSortBy,
    filteredOutfits,
    handleLoadMore,
    handleTogglePublish,
    handleLike,
  } = useCommunityFeed();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 relative h-[calc(100vh-73px)] flex flex-col overflow-hidden">
      <div className="mb-6 flex flex-col items-center shrink-0">
        <h1 className="text-3xl font-bold text-foreground">Community Feed</h1>
        <p className="mt-2 text-base text-foreground mb-6">Discover and search outfits from the F.AVA AI community.</p>

        <div className="w-full max-w-xl flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search outfits or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border-theme bg-surface px-5 py-3 pr-10 text-sm text-foreground shadow-sm focus:border-brand-mint focus:outline-none focus:ring-2 focus:ring-brand-mint/50"
            />
            <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-border-theme bg-surface px-4 py-3 text-sm text-foreground shadow-sm focus:border-brand-mint focus:outline-none focus:ring-2 focus:ring-brand-mint/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_likes">Most Likes</option>
          </select>
        </div>
      </div>

      <div className="absolute right-6 top-10 md:top-20 z-10">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-brand-forest px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-darkgreen transition-transform hover:scale-105"
        >
          <span className="text-lg">+</span> Add Outfit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
        {loading ? (
          <p className="text-center text-foreground/70 mt-10">Loading community outfits...</p>
        ) : filteredOutfits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-theme bg-surface px-6 py-16 text-center mt-10">
            <h3 className="text-lg font-semibold text-foreground">No outfits found</h3>
            <p className="mt-2 text-sm text-foreground/70">
              Try a different search term or be the first to publish an outfit!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredOutfits.map((outfit) => (
                <article
                  key={outfit.id}
                  className="rounded-2xl border border-border-theme bg-surface p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-foreground truncate pr-2">{outfit.name}</h3>
                    <span className="text-xs bg-surface-alt border border-border-theme text-foreground/70 px-2 py-1 rounded-full shrink-0">
                      @{outfit.authorName}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 mb-4 flex-1">
                    <div className="relative aspect-[4/3] w-full rounded-xl bg-surface-alt border border-border-theme overflow-hidden">
                      {outfit.upperWearImage ? (
                        <Image src={outfit.upperWearImage} alt="Upper" fill className="object-contain p-2" unoptimized />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-foreground/60">No Upper</span>
                      )}
                    </div>
                    <div className="relative aspect-[4/3] w-full rounded-xl bg-surface-alt border border-border-theme overflow-hidden">
                      {outfit.lowerWearImage ? (
                        <Image src={outfit.lowerWearImage} alt="Lower" fill className="object-contain p-2" unoptimized />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-foreground/60">No Lower</span>
                      )}
                    </div>
                    <div className="relative aspect-[4/3] w-full rounded-xl bg-surface-alt border border-border-theme overflow-hidden">
                      {outfit.shoesImage ? (
                        <Image src={outfit.shoesImage} alt="Shoes" fill className="object-contain p-2" unoptimized />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-foreground/60">No Shoes</span>
                      )}
                    </div>
                    <div className="rounded-xl bg-surface-alt border border-border-theme p-2">
                      <p className="text-[10px] font-semibold uppercase text-foreground/60 mb-1">Accessories</p>
                      {outfit.accessoryImages.length === 0 ? (
                        <span className="text-xs text-foreground/60">None</span>
                      ) : (
                        <div className="grid grid-cols-4 gap-1">
                          {outfit.accessoryImages.slice(0, 4).map((image, index) => (
                            <div
                              key={`${outfit.id}-community-accessory-${index}`}
                              className="relative aspect-square overflow-hidden rounded border border-border-theme bg-surface"
                            >
                              <Image
                                src={image}
                                alt={`Accessory ${index + 1}`}
                                fill
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-theme flex items-center justify-between mt-auto">
                    <button
                      type="button"
                      onClick={() => void handleLike(outfit)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                        outfit.isLikedByMe ? "text-red-500" : "text-foreground/70 hover:text-red-500"
                      }`}
                    >
                      <span>{outfit.isLikedByMe ? "❤️" : "🤍"}</span>
                      <span>{outfit.likesCount || 0}</span>
                    </button>

                    {currentUserId === outfit.userId && (
                      <button
                        type="button"
                        onClick={() => void handleTogglePublish(outfit)}
                        className="text-xs font-medium text-foreground/60 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {hasMore && !searchQuery && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-border-theme bg-surface px-8 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-alt disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? "Loading..." : "Load More Outfits"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Publish your outfits</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {myOutfits.length === 0 ? (
                <p className="text-center text-slate-500 py-10">
                  You haven&apos;t saved any outfits yet. Head to the Dashboard to create one!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myOutfits.map((outfit) => (
                    <div
                      key={outfit.id}
                      className="border border-slate-200 rounded-xl p-3 flex justify-between items-center bg-slate-50"
                    >
                      <span className="font-medium text-slate-800 truncate pr-2">{outfit.name}</span>
                      <button
                        type="button"
                        onClick={() => void handleTogglePublish(outfit)}
                        className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          outfit.isPublished
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-brand-mint text-white hover:bg-brand-forest"
                        }`}
                      >
                        {outfit.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
