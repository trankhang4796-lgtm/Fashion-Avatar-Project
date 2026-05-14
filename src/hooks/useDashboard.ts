"use client";

import { useCallback, useEffect, useState } from "react";
import type { WardrobeItem } from "@/src/wardrobe/types";
import { useWardrobe } from "@/src/context/WardrobeContext";
import type { SavedOutfit } from "@/src/utils/outfits";
import { saveOutfitToCloud, updateOutfitInCloud } from "@/src/utils/outfits";
import { createClient } from "@/src/utils/supabase/client";
import { useBetaSettings } from "@/src/hooks/useBetaSettings";
import { generateAvatar } from "@/src/services/avatarGenerationService";

export function useDashboard() {
  const [upperWear, setUpperWear] = useState<WardrobeItem | null>(null);
  const [lowerWear, setLowerWear] = useState<WardrobeItem | null>(null);
  const [shoes, setShoes] = useState<WardrobeItem | null>(null);
  const [accessories, setAccessories] = useState<WardrobeItem[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [newlySavedOutfit, setNewlySavedOutfit] = useState<SavedOutfit | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatarImage, setGeneratedAvatarImage] = useState<string | null>(null);
  const [showBetaWarning, setShowBetaWarning] = useState(false);
  const [dontShowAgainWarning, setDontShowAgainWarning] = useState(false);

  const { editingOutfit, setEditingOutfit, customAvatarUrl } = useWardrobe();
  const betaSettings = useBetaSettings();
  const canGenerateAiTryOn = betaSettings.betaFeaturesEnabled && betaSettings.betaFastAiGeneration;

  useEffect(() => {
    if (
      betaSettings.betaFeaturesEnabled &&
      !window.localStorage.getItem("fashion-avatar:hide-beta-warning")
    ) {
      setShowBetaWarning(true);
    } else {
      setShowBetaWarning(false);
    }
  }, [betaSettings.betaFeaturesEnabled]);

  useEffect(() => {
    if (editingOutfit) {
      setUpperWear(editingOutfit.upperWear);
      setLowerWear(editingOutfit.lowerWear);
      setShoes(editingOutfit.shoes ?? null);
      setAccessories(editingOutfit.accessories ?? []);
    }
  }, [editingOutfit]);

  const handleSaveOutfit = useCallback(async () => {
    if (!upperWear || !lowerWear || !shoes) {
      setSaveMessage("Upper, Lower, and Shoes are required to save an outfit.");
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", session.user.id).single();

      if (!profile || !profile.username || profile.username.startsWith("User_")) {
        setShowUsernameModal(true);
        return;
      }
    }

    try {
      setSaveMessage("Saving...");
      const savedOutfit = await saveOutfitToCloud({
        upperWear,
        lowerWear,
        shoes,
        accessories,
      });
      setNewlySavedOutfit(savedOutfit);

      setSaveMessage(`${savedOutfit.name} saved securely to cloud!`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save outfit.";
      setSaveMessage(message);
    }
  }, [upperWear, lowerWear, shoes, accessories]);

  const handleGenerateAiTryOn = useCallback(async () => {
    const hasAccessory = accessories.length > 0;
    if (!upperWear && !lowerWear && !shoes && !hasAccessory) {
      setSaveMessage(
        "Equip at least one clothing item (upper, lower, shoes, or accessories) before generating.",
      );
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedAvatarImage(null);
      setSaveMessage("Generating AI try-on...");

      const payload = {
        upperWearUrl: upperWear?.url || null,
        lowerWearUrl: lowerWear?.url || null,
        customAvatarUrl: customAvatarUrl || null,
        shoesUrl: shoes?.url || null,
        accessoriesUrls: accessories.map((a) => a.url),
      };

      const result = await generateAvatar(payload, betaSettings);
      if (typeof result === "string" && result.length > 0) {
        setGeneratedAvatarImage(result);
        setSaveMessage("AI try-on generated!");
      } else {
        setSaveMessage("AI generation completed, but no preview image URL was returned.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate AI try-on.";
      setSaveMessage(message);
    } finally {
      setIsGenerating(false);
    }
  }, [upperWear, lowerWear, shoes, accessories, customAvatarUrl, betaSettings]);

  const handleDownloadImage = useCallback(async () => {
    if (!generatedAvatarImage) return;
    try {
      const response = await fetch(generatedAvatarImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-tryon-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setSaveMessage("Failed to download image.");
    }
  }, [generatedAvatarImage]);

  const handleUpdateOutfit = useCallback(async () => {
    if (!editingOutfit) return;
    try {
      setSaveMessage("Updating...");
      const updatedOutfit = await updateOutfitInCloud(
        editingOutfit.id,
        upperWear,
        lowerWear,
        shoes,
        accessories,
      );
      setNewlySavedOutfit(updatedOutfit);
      setSaveMessage("Outfit updated!");
      setEditingOutfit(null);
    } catch {
      setSaveMessage("Failed to update.");
    }
  }, [editingOutfit, upperWear, lowerWear, shoes, accessories, setEditingOutfit]);

  const handleDiscardEdit = useCallback(() => {
    setEditingOutfit(null);
    setUpperWear(null);
    setLowerWear(null);
    setShoes(null);
    setAccessories([]);
    setSaveMessage("Discarded changes.");
  }, [setEditingOutfit]);

  const handleClearOutfit = useCallback(() => {
    setUpperWear(null);
    setLowerWear(null);
    setShoes(null);
    setAccessories([]);
  }, []);

  const handleCloseBetaWarning = useCallback(() => {
    if (dontShowAgainWarning) {
      window.localStorage.setItem("fashion-avatar:hide-beta-warning", "true");
    }
    setShowBetaWarning(false);
  }, [dontShowAgainWarning]);

  return {
    upperWear,
    setUpperWear,
    lowerWear,
    setLowerWear,
    shoes,
    setShoes,
    accessories,
    setAccessories,
    saveMessage,
    newlySavedOutfit,
    showUsernameModal,
    setShowUsernameModal,
    isGenerating,
    generatedAvatarImage,
    setGeneratedAvatarImage,
    showBetaWarning,
    dontShowAgainWarning,
    setDontShowAgainWarning,
    editingOutfit,
    canGenerateAiTryOn,
    handleSaveOutfit,
    handleGenerateAiTryOn,
    handleDownloadImage,
    handleUpdateOutfit,
    handleDiscardEdit,
    handleClearOutfit,
    handleCloseBetaWarning,
  };
}
