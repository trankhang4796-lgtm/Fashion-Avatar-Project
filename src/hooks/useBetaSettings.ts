import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/utils/supabase/client";

type BetaSettings = {
  betaFeaturesEnabled: boolean;
  betaFastAiGeneration: boolean;
};

export type UseBetaSettingsResult = BetaSettings & { isLoading: boolean };

export const BETA_SETTINGS_STORAGE_EVENT = "fashion-avatar:beta-settings-changed";

function parseBetaSettings(raw: string | null): BetaSettings {
  if (!raw) {
    return {
      betaFeaturesEnabled: false,
      betaFastAiGeneration: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      enabled?: boolean;
      fastApi?: boolean;
    };

    const enabled = !!parsed.enabled;
    const fastApi = enabled ? !!parsed.fastApi : false;

    return {
      betaFeaturesEnabled: enabled,
      betaFastAiGeneration: fastApi,
    };
  } catch {
    return {
      betaFeaturesEnabled: false,
      betaFastAiGeneration: false,
    };
  }
}

/**
 * Read beta settings from localStorage and keep them up-to-date.
 *
 * Storage key: `fashion-avatar:settings:beta:${userId}` (defaults to "anonymous").
 */
export function useBetaSettings(): UseBetaSettingsResult {
  const [userId, setUserId] = useState<string>("anonymous");
  const [settings, setSettings] = useState<BetaSettings>(() =>
    parseBetaSettings(null),
  );
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = useMemo(
    () => `fashion-avatar:settings:beta:${userId || "anonymous"}`,
    [userId],
  );

  useEffect(() => {
    const supabase = createClient();
    let isCancelled = false;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (isCancelled) return;
      setUserId(session?.user?.id ?? "anonymous");
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? "anonymous");
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Initial load for the resolved key
    setSettings(parseBetaSettings(window.localStorage.getItem(storageKey)));

    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key !== storageKey) return;
      setSettings(parseBetaSettings(e.newValue));
    };

    const onSameTabUpdate = () => {
      setSettings(parseBetaSettings(window.localStorage.getItem(storageKey)));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(BETA_SETTINGS_STORAGE_EVENT, onSameTabUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BETA_SETTINGS_STORAGE_EVENT, onSameTabUpdate);
    };
  }, [storageKey]);

  return { ...settings, isLoading };
}

