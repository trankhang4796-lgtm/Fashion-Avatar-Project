"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { getCommunityOutfits, getSavedOutfits, toggleOutfitPublish, toggleOutfitLike, type SavedOutfit } from "@/src/utils/outfits";
import { createClient } from "@/src/utils/supabase/client";

export default function CommunityPage() {
  const [communityOutfits, setCommunityOutfits] = useState<SavedOutfit[]>([]);
  const [myOutfits, setMyOutfits] = useState<SavedOutfit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAGE_SIZE = 40;

  const loadCommunityFeed = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const publicOutfits = await getCommunityOutfits(pageNum, PAGE_SIZE, sortBy);
    
    if (publicOutfits.length < PAGE_SIZE) setHasMore(false);
    else setHasMore(true);

    setCommunityOutfits(prev => reset ? publicOutfits : [...prev, ...publicOutfits]);
    
    if (reset) setLoading(false);
    else setLoadingMore(false);
  }, [sortBy]);

  const loadMyOutfits = async () => {
    const personalOutfits = await getSavedOutfits();
    setMyOutfits(personalOutfits);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user?.id || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setPage(0);
    loadCommunityFeed(0, true);
    loadMyOutfits();
  }, [sortBy, loadCommunityFeed]);

  useEffect(() => {
    const handleUpdate = () => {
      setPage(0);
      loadCommunityFeed(0, true);
      loadMyOutfits();
    };

    window.addEventListener("saved-outfits-updated", handleUpdate);
    
    return () => {
      window.removeEventListener("saved-outfits-updated", handleUpdate);
    };
  }, [loadCommunityFeed]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCommunityFeed(nextPage, false);
  };

  const handleTogglePublish = async (outfit: SavedOutfit) => {
    const newPublishState = !outfit.isPublished;
    // Optimistically update both lists
    setMyOutfits(current => current.map(o => o.id === outfit.id ? { ...o, isPublished: newPublishState } : o));
    if (!newPublishState) {
      setCommunityOutfits(current => current.filter(o => o.id !== outfit.id));
    }

    try {
      await toggleOutfitPublish(outfit.id, newPublishState);
    } catch (err: any) {
      alert(err.message);
      loadCommunityFeed(0, true); // Revert on error
      loadMyOutfits();
    }
  };

  const handleLike = async (outfit: SavedOutfit) => {
    if (!currentUserId) {
      alert("Please log in to like outfits!");
      return;
    }
    
    const isLiking = !outfit.isLikedByMe;
    const countModifier = isLiking ? 1 : -1;

    // Optimistic UI Update
    setCommunityOutfits(current => 
      current.map(o => o.id === outfit.id ? { 
        ...o, 
        isLikedByMe: isLiking, 
        likesCount: (o.likesCount || 0) + countModifier 
      } : o)
    );

    try {
      await toggleOutfitLike(outfit.id, !isLiking);
    } catch (err) {
      console.error("Failed to toggle like", err);
      loadCommunityFeed(page, true); // Revert on error
    }
  };

  const filteredOutfits = communityOutfits.filter((outfit) =>
    outfit.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 relative h-[calc(100vh-73px)] flex flex-col overflow-hidden">
      <div className="mb-6 flex flex-col items-center shrink-0">
        <h1 className="text-3xl font-bold text-slate-900">Community Feed</h1>
        <p className="mt-2 text-base text-slate-600 mb-6">Discover and search outfits from the F.AVA AI community.</p>

        <div className="w-full max-w-xl flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search outfits by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 pr-10 text-sm shadow-sm focus:border-brand-mint focus:outline-none focus:ring-2 focus:ring-brand-mint/50"
            />
            <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-mint focus:outline-none focus:ring-2 focus:ring-brand-mint/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="absolute right-6 top-10 md:top-20 z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-brand-forest px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-darkgreen transition-transform hover:scale-105"
        >
          <span className="text-lg">+</span> Add Outfit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
        {loading ? (
          <p className="text-center text-slate-500 mt-10">Loading community outfits...</p>
        ) : filteredOutfits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center mt-10">
            <h3 className="text-lg font-semibold text-slate-800">No outfits found</h3>
            <p className="mt-2 text-sm text-slate-600">Try a different search term or be the first to publish an outfit!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredOutfits.map((outfit) => (
                <article key={outfit.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-slate-900 truncate pr-2">{outfit.name}</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full shrink-0">@{outfit.authorName}</span>
                  </div>
                  
                  {/* Vertically Stacked Images */}
                  <div className="flex flex-col gap-2 mb-4 flex-1">
                    <div className="relative aspect-[4/3] w-full rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                      {outfit.upperWearImage ? (
                        <Image src={outfit.upperWearImage} alt="Upper" fill className="object-contain p-2" unoptimized />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-slate-400">No Upper</span>
                      )}
                    </div>
                    <div className="relative aspect-[4/3] w-full rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                      {outfit.lowerWearImage ? (
                        <Image src={outfit.lowerWearImage} alt="Lower" fill className="object-contain p-2" unoptimized />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-slate-400">No Lower</span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Interactions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <button 
                      onClick={() => handleLike(outfit)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${outfit.isLikedByMe ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                    >
                      <span>{outfit.isLikedByMe ? '❤️' : '🤍'}</span>
                      <span>{outfit.likesCount || 0}</span>
                    </button>

                    {/* Direct Remove Button for Owners */}
                    {currentUserId === outfit.userId && (
                      <button 
                        onClick={() => handleTogglePublish(outfit)}
                        className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
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
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? "Loading..." : "Load More Outfits"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Outfit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Publish your outfits</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {myOutfits.length === 0 ? (
                <p className="text-center text-slate-500 py-10">You haven't saved any outfits yet. Head to the Dashboard to create one!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myOutfits.map((outfit) => (
                    <div key={outfit.id} className="border border-slate-200 rounded-xl p-3 flex justify-between items-center bg-slate-50">
                      <span className="font-medium text-slate-800 truncate pr-2">{outfit.name}</span>
                      <button
                        onClick={() => handleTogglePublish(outfit)}
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

