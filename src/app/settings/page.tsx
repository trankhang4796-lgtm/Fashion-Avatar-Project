"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/src/utils/supabase/client";
import { useWardrobe } from "@/src/context/WardrobeContext";
import { validateUsername, RESTRICTED_WORDS } from "@/src/utils/validation";
import type { User } from "@supabase/supabase-js";
import ProfileTab from "@/src/settings/components/ProfileTab";
import SecurityTab from "@/src/settings/components/SecurityTab";
import PrivacyTab from "@/src/settings/components/PrivacyTab";
import PreferencesTab from "@/src/settings/components/PreferencesTab";
import AppearanceTab from "@/src/settings/components/AppearanceTab";
import BetaTab from "@/src/settings/components/BetaTab";

type SettingsTab = "account" | "privacy" | "appearance" | "notifications" | "preferences" | "beta";

function SettingsContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
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

  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameMessage, setUsernameMessage] = useState({ type: "", text: "" });
  const [isLengthValid, setIsLengthValid] = useState(false);
  const [isFormatValid, setIsFormatValid] = useState(false);
  const [profanityError, setProfanityError] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const [passwordFlow, setPasswordFlow] = useState<"idle" | "editing">("idle");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordLengthValid, setPasswordLengthValid] = useState(false);
  const [passwordUpperLowerValid, setPasswordUpperLowerValid] = useState(false);
  const [passwordNumberSpecialValid, setPasswordNumberSpecialValid] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  const [isPublicProfile, setIsPublicProfile] = useState(true);

  const [measurementSystem, setMeasurementSystem] = useState<"imperial" | "metric">("imperial");
  const [defaultWardrobeView, setDefaultWardrobeView] = useState<"owned" | "unowned" | "outfits">("owned");
  const [askBeforeCamera, setAskBeforeCamera] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [betaFeaturesEnabled, setBetaFeaturesEnabled] = useState(false);
  const [betaFastAiGeneration, setBetaFastAiGeneration] = useState(false);
  const [betaSettingsLoaded, setBetaSettingsLoaded] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");

    const validTabs = ["account", "privacy", "appearance", "notifications", "preferences", "beta"];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam as SettingsTab);
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
            .select("username, is_public")
            .eq("id", session.user.id)
            .single();

          if (profile?.username) {
            setUsername(profile.username);
            setUsernameInput(profile.username);
          } else {
            const randomName = `User_${Math.floor(Math.random() * 10000)}`;
            setUsername(randomName);
            setUsernameInput(randomName);
            await supabase.from("profiles").upsert({ id: session.user.id, username: randomName });
          }

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

  useEffect(() => {
    if (!isEditingUsername) return;

    const trimmed = usernameInput.trim();

    setIsLengthValid(trimmed.length >= 3 && trimmed.length <= 20);

    const validFormatRegex = /^[a-zA-Z0-9_.]+$/;
    const hasGoodPunctuation =
      !trimmed.startsWith(".") &&
      !trimmed.startsWith("_") &&
      !trimmed.endsWith(".") &&
      !trimmed.endsWith("_") &&
      !trimmed.includes("..") &&
      !trimmed.includes("__") &&
      !trimmed.includes("._") &&
      !trimmed.includes("_.");
    setIsFormatValid(validFormatRegex.test(trimmed) && hasGoodPunctuation);

    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isProfane = RESTRICTED_WORDS.some((word) => normalized.includes(word));
    if (isProfane) {
      setProfanityError("This username contains restricted words.");
    } else {
      setProfanityError("");
    }

    setAvailability("idle");

    if (trimmed.length < 3 || isProfane || !validFormatRegex.test(trimmed) || !hasGoodPunctuation) {
      return;
    }

    if (trimmed === username) {
      setAvailability("available");
      return;
    }

    setAvailability("checking");

    const timeoutId = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("username", trimmed).single();

      if (data && data.id !== user?.id) {
        setAvailability("taken");
      } else {
        setAvailability("available");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [usernameInput, isEditingUsername, user?.id, username, supabase]);

  useEffect(() => {
    if (passwordFlow !== "editing") return;

    setPasswordLengthValid(newPassword.length >= 8);
    setPasswordUpperLowerValid(/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword));
    setPasswordNumberSpecialValid(/\d/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword));

    setPasswordsMatch(newPassword.length > 0 && newPassword === confirmPassword);
  }, [newPassword, confirmPassword, passwordFlow]);

  const handleUpdateUsername = async () => {
    setUsernameMessage({ type: "", text: "" });

    const newName = usernameInput.trim();

    const validation = validateUsername(newName);
    if (!validation.isValid) {
      setUsernameMessage({ type: "error", text: validation.error });
      return;
    }

    const { data: existing } = await supabase.from("profiles").select("id").eq("username", newName).single();

    if (existing && existing.id !== user?.id) {
      setUsernameMessage({ type: "error", text: "That username is already taken!" });
      return;
    }

    const { error } = await supabase.from("profiles").upsert({ id: user?.id, username: newName });

    if (error) {
      setUsernameMessage({ type: "error", text: "Failed to update username." });
    } else {
      setUsername(newName);
      window.dispatchEvent(new Event("profile-updated"));
      setIsEditingUsername(false);
      setUsernameMessage({ type: "success", text: "Username updated successfully!" });
    }
  };

  const handleStartPasswordChange = () => {
    if (window.confirm("Are you sure you want to change your password?")) {
      setPasswordFlow("editing");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (!(/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword))) {
      setPasswordMessage({ type: "error", text: "Password must include both uppercase and lowercase letters." });
      return;
    }
    if (!(/\d/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword))) {
      setPasswordMessage({ type: "error", text: "Password must include a number and a special character." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
    } else {
      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordFlow("idle");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-10">Loading...</main>;
  if (!user) return <main className="mx-auto max-w-5xl px-6 py-10">Please log in to view settings.</main>;

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "account", label: "Account", icon: "👤" },
    { id: "privacy", label: "Privacy & Safety", icon: "🛡️" },
    { id: "appearance", label: "Appearance", icon: "✨" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
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
              <ProfileTab
                supabase={supabase}
                router={router}
                setTheme={setTheme}
                username={username}
                usernameInput={usernameInput}
                setUsernameInput={setUsernameInput}
                isEditingUsername={isEditingUsername}
                setIsEditingUsername={setIsEditingUsername}
                isLengthValid={isLengthValid}
                isFormatValid={isFormatValid}
                profanityError={profanityError}
                availability={availability}
                usernameMessage={usernameMessage}
                handleUpdateUsername={handleUpdateUsername}
                isDeletingAccount={isDeletingAccount}
                setIsDeletingAccount={setIsDeletingAccount}
                confirmText={confirmText}
                setConfirmText={setConfirmText}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
              <SecurityTab
                passwordFlow={passwordFlow}
                setPasswordFlow={setPasswordFlow}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                passwordMessage={passwordMessage}
                setPasswordMessage={setPasswordMessage}
                isUpdatingPassword={isUpdatingPassword}
                passwordLengthValid={passwordLengthValid}
                passwordUpperLowerValid={passwordUpperLowerValid}
                passwordNumberSpecialValid={passwordNumberSpecialValid}
                passwordsMatch={passwordsMatch}
                handleStartPasswordChange={handleStartPasswordChange}
                handleUpdatePassword={handleUpdatePassword}
              />
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
              measurementSystem={measurementSystem}
              setMeasurementSystem={setMeasurementSystem}
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

          {activeTab === "notifications" && (
            <div className="rounded-2xl border border-dashed border-border-theme bg-surface p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="text-4xl mb-4 block">{tabs.find((t) => t.id === activeTab)?.icon}</span>
              <h2 className="text-xl font-semibold text-foreground capitalize">{activeTab} Settings</h2>
              <p className="mt-2 text-foreground/70">This section is currently under construction.</p>
            </div>
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
