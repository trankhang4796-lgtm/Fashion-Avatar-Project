"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/src/utils/supabase/client";
import { useWardrobe } from "@/src/context/WardrobeContext";
import type { User } from "@supabase/supabase-js";
import ProfileTab from "@/src/settings/components/ProfileTab";
import SecurityTab from "@/src/settings/components/SecurityTab";
import PrivacyTab from "@/src/settings/components/PrivacyTab";
import PreferencesTab from "@/src/settings/components/PreferencesTab";
import AppearanceTab from "@/src/settings/components/AppearanceTab";
import BetaTab from "@/src/settings/components/BetaTab";
import type { DefaultWardrobeViewPreference } from "@/src/settings/components/PreferencesTab";

const DEFAULT_WARDROBE_VIEW_STORAGE_KEY = "fashion-avatar-default-view";

type SettingsTab = "account" | "privacy" | "appearance" | "preferences" | "beta";

function SettingsContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const { setCustomAvatarUrl } = useWardrobe();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const betaLoadedKeyRef = useRef<string | null>(null);

  const betaSettingsStorageKey = useMemo(() => {
    const idPart = user?.id ?? "anonymous";
    return `fashion-avatar:settings:beta:${idPart}`;
  }, [user?.id]);

  const [isPublicProfile, setIsPublicProfile] = useState(true);

  const [defaultWardrobeView, setDefaultWardrobeView] =
    useState<DefaultWardrobeViewPreference>("clothes");
  const [defaultViewPreferenceHydrated, setDefaultViewPreferenceHydrated] = useState(false);
  const [askBeforeCamera, setAskBeforeCamera] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [betaFeaturesEnabled, setBetaFeaturesEnabled] = useState(false);
  const [betaFastAiGeneration, setBetaFastAiGeneration] = useState(false);
  const [betaSettingsLoaded, setBetaSettingsLoaded] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");

    const validTabs = ["account", "privacy", "appearance", "preferences", "beta"];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam as SettingsTab);
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DEFAULT_WARDROBE_VIEW_STORAGE_KEY);
      if (raw === "outfits") {
        setDefaultWardrobeView("outfits");
      } else {
        setDefaultWardrobeView("clothes");
      }
    } catch {
      setDefaultWardrobeView("clothes");
    } finally {
      setDefaultViewPreferenceHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!defaultViewPreferenceHydrated) return;
    try {
      window.localStorage.setItem(DEFAULT_WARDROBE_VIEW_STORAGE_KEY, defaultWardrobeView);
    } catch {
      // Ignore storage quota / blocked storage errors
    }
  }, [defaultWardrobeView, defaultViewPreferenceHydrated]);

  useEffect(() => {
    if (!mounted) return;
    betaLoadedKeyRef.current = null;
    try {
      const raw = window.localStorage.getItem(betaSettingsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          enabled?: boolean;
          fastApi?: boolean;
        };

        const enabled = !!parsed.enabled;
        const fastApi = enabled ? !!parsed.fastApi : false;

        setBetaFeaturesEnabled(enabled);
        setBetaFastAiGeneration(fastApi);
      }
    } catch {
      // Ignore malformed localStorage values
    } finally {
      betaLoadedKeyRef.current = betaSettingsStorageKey;
      setBetaSettingsLoaded(true);
    }
  }, [mounted, betaSettingsStorageKey]);

  useEffect(() => {
    if (!mounted || !betaSettingsLoaded) return;
    if (betaLoadedKeyRef.current !== betaSettingsStorageKey) return;
    try {
      window.localStorage.setItem(
        betaSettingsStorageKey,
        JSON.stringify({
          enabled: betaFeaturesEnabled,
          fastApi: betaFeaturesEnabled ? betaFastAiGeneration : false,
        }),
      );
      window.dispatchEvent(new Event("fashion-avatar:beta-settings-changed"));
    } catch {
      // Ignore storage quota / blocked storage errors
    }
  }, [
    mounted,
    betaSettingsLoaded,
    betaSettingsStorageKey,
    betaFeaturesEnabled,
    betaFastAiGeneration,
  ]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);

          const { data: profile } = await supabase
            .from("profiles")
            .select("is_public")
            .eq("id", session.user.id)
            .single();

          setIsPublicProfile(profile?.is_public ?? true);
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [supabase]);

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-10">Loading...</main>;
  if (!user) return <main className="mx-auto max-w-5xl px-6 py-10">Please log in to view settings.</main>;

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "account", label: "Account", icon: "👤" },
    { id: "privacy", label: "Privacy & Safety", icon: "🛡️" },
    { id: "appearance", label: "Appearance", icon: "✨" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "beta", label: "Beta", icon: "🧪" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-brand-mint text-white" : "text-foreground/70 hover:bg-surface-alt"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1">
          {activeTab === "account" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProfileTab supabase={supabase} user={user} />
              <SecurityTab supabase={supabase} />
            </div>
          )}

          {activeTab === "privacy" && (
            <PrivacyTab
              supabase={supabase}
              user={user}
              isPublicProfile={isPublicProfile}
              setIsPublicProfile={setIsPublicProfile}
            />
          )}

          {activeTab === "preferences" && (
            <PreferencesTab
              defaultWardrobeView={defaultWardrobeView}
              setDefaultWardrobeView={setDefaultWardrobeView}
              askBeforeCamera={askBeforeCamera}
              setAskBeforeCamera={setAskBeforeCamera}
            />
          )}

          {activeTab === "appearance" && (
            <AppearanceTab supabase={supabase} user={user} theme={theme} mounted={mounted} setTheme={setTheme} />
          )}

          {activeTab === "beta" && (
            <BetaTab
              betaFeaturesEnabled={betaFeaturesEnabled}
              setBetaFeaturesEnabled={setBetaFeaturesEnabled}
              betaFastAiGeneration={betaFastAiGeneration}
              setBetaFastAiGeneration={setBetaFastAiGeneration}
              setCustomAvatarUrl={setCustomAvatarUrl}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-5xl px-6 py-10">Loading settings...</main>}>
      <SettingsContent />
    </Suspense>
  );
}
