"use client";

import { useEffect, ReactNode } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { useBetaSettings } from "@/src/hooks/useBetaSettings";

export default function SystemHealthGuard({ children }: { children: ReactNode }) {
  const wardrobeContext = useWardrobe();
  const betaSettings = useBetaSettings();

  useEffect(() => {
    // 1. Check Wardrobe Context
    if (!wardrobeContext || typeof wardrobeContext.fetchWardrobeItems !== 'function') {
      throw new Error(
        "<WardrobeContext> is missing or misbehaving! Critical wardrobe functions are unavailable.",
      );
    }

    // 2. Check Beta Settings
    if (!betaSettings || typeof betaSettings.betaFeaturesEnabled === 'undefined') {
      throw new Error("<useBetaSettings> is missing or misbehaving! The beta toggle feature cannot be found.");
    }

    // Add future function checks here...
  }, [wardrobeContext, betaSettings]);

  return <>{children}</>;
}
