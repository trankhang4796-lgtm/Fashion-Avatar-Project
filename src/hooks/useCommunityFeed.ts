"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCommunityOutfits,
  getSavedOutfits,
  toggleOutfitLike,
  toggleOutfitPublish,
  type SavedOutfit,
} from "@/src/utils/outfits";
import { createClient } from "@/src/utils/supabase/client";

const PAGE_SIZE = 40;

export function useCommunityFeed() {
  const [communityOutfits, setCommunityOutfits] = useState<SavedOutfit[]>([]);
  const [myOutfits, setMyOutfits] = useState<SavedOutfit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadCommunityFeed = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const publicOutfits = await getCommunityOutfits(pageNum, PAGE_SIZE, sortBy);

      if (publicOutfits.length < PAGE_SIZE) setHasMore(false);
      else setHasMore(true);

      setCommunityOutfits((prev) => (reset ? publicOutfits : [...prev, ...publicOutfits]));

      if (reset) setLoading(false);
      else setLoadingMore(false);
    },
    [sortBy],
  );

  const loadMyOutfits = useCallback(async () => {
    const personalOutfits = await getSavedOutfits();
    setMyOutfits(personalOutfits);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user?.id ?? null);
    };
    void fetchUser();
  }, []);

  useEffect(() => {
    setPage(0);
    void loadCommunityFeed(0, true);
    void loadMyOutfits();
  }, [sortBy, loadCommunityFeed, loadMyOutfits]);

  useEffect(() => {
    const handleUpdate = () => {
      setPage(0);
      void loadCommunityFeed(0, true);
      void loadMyOutfits();
    };

    window.addEventListener("saved-outfits-updated", handleUpdate);

    return () => {
      window.removeEventListener("saved-outfits-updated", handleUpdate);
    };
  }, [loadCommunityFeed, loadMyOutfits]);

  const handleLoadMore = useCallback(() => {
    setPage((p) => {
      const nextPage = p + 1;
      void loadCommunityFeed(nextPage, false);
      return nextPage;
    });
  }, [loadCommunityFeed]);

  const handleTogglePublish = useCallback(
    async (outfit: SavedOutfit) => {
      const newPublishState = !outfit.isPublished;
      setMyOutfits((current) =>
        current.map((o) => (o.id === outfit.id ? { ...o, isPublished: newPublishState } : o)),
      );
      if (!newPublishState) {
        setCommunityOutfits((current) => current.filter((o) => o.id !== outfit.id));
      }

      try {
        await toggleOutfitPublish(outfit.id, newPublishState);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        alert(message);
        void loadCommunityFeed(0, true);
        void loadMyOutfits();
      }
    },
    [loadCommunityFeed, loadMyOutfits],
  );

  const handleLike = useCallback(
    async (outfit: SavedOutfit) => {
      if (!currentUserId) {
        alert("Please log in to like outfits!");
        return;
      }

      const isLiking = !outfit.isLikedByMe;
      const countModifier = isLiking ? 1 : -1;

      setCommunityOutfits((current) =>
        current.map((o) =>
          o.id === outfit.id
            ? {
                ...o,
                isLikedByMe: isLiking,
                likesCount: (o.likesCount || 0) + countModifier,
              }
            : o,
        ),
      );

      try {
        await toggleOutfitLike(outfit.id, !isLiking);
      } catch (err) {
        console.error("Failed to toggle like", err);
        setPage(0);
        void loadCommunityFeed(0, true);
      }
    },
    [currentUserId, loadCommunityFeed],
  );

  const filteredOutfits = useMemo(
    () =>
      communityOutfits.filter((outfit) =>
        outfit.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [communityOutfits, searchQuery],
  );

  return {
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
  };
}
