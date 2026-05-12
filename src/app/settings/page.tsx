"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/src/utils/supabase/client";
import { deleteUserAccountPermanently } from "@/src/app/actions/auth";
import { validateUsername, RESTRICTED_WORDS } from "@/src/utils/validation";
import type { User } from "@supabase/supabase-js";

type SettingsTab = "account" | "privacy" | "appearance" | "notifications" | "preferences" | "beta";

function SettingsContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const betaLoadedKeyRef = useRef<string | null>(null);

  const betaSettingsStorageKey = useMemo(() => {
    const idPart = user?.id ?? "anonymous";
    return `fashion-avatar:settings:beta:${idPart}`;
  }, [user?.id]);

  // Username State
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameMessage, setUsernameMessage] = useState({ type: "", text: "" });
  const [isLengthValid, setIsLengthValid] = useState(false);
  const [isFormatValid, setIsFormatValid] = useState(false);
  const [profanityError, setProfanityError] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Password State
  const [passwordFlow, setPasswordFlow] = useState<"idle" | "editing">("idle");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordLengthValid, setPasswordLengthValid] = useState(false);
  const [passwordUpperLowerValid, setPasswordUpperLowerValid] = useState(false);
  const [passwordNumberSpecialValid, setPasswordNumberSpecialValid] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Privacy State (Local UI only for now)
  const [isPublicProfile, setIsPublicProfile] = useState(true);

  // Preferences State (Local UI only for now)
  const [measurementSystem, setMeasurementSystem] = useState<"imperial" | "metric">("imperial");
  const [defaultWardrobeView, setDefaultWardrobeView] = useState<"owned" | "unowned" | "outfits">("owned");
  const [askBeforeCamera, setAskBeforeCamera] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Beta Settings State (persisted locally)
  const [betaFeaturesEnabled, setBetaFeaturesEnabled] = useState(false);
  const [betaFastAiGeneration, setBetaFastAiGeneration] = useState(false);
  const [betaSettingsLoaded, setBetaSettingsLoaded] = useState(false);

  useEffect(() => {
    // Check URL for a specific tab to open (e.g., ?tab=preferences)
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

    // 1. Instant Synchronous Checks
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

    // 2. Debounced Asynchronous Check (Availability)
    setAvailability("idle");

    if (trimmed.length < 3 || isProfane || !validFormatRegex.test(trimmed) || !hasGoodPunctuation) {
      return; // Stop checking availability if basic rules fail
    }

    if (trimmed === username) {
      setAvailability("available"); // It is their current name
      return;
    }

    setAvailability("checking");

    // Wait 500ms after the user stops typing before hitting the database
    const timeoutId = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("username", trimmed).single();

      if (data && data.id !== user?.id) {
        setAvailability("taken");
      } else {
        setAvailability("available");
      }
    }, 500);

    // Cleanup function cancels the previous timeout if they keep typing
    return () => clearTimeout(timeoutId);
  }, [usernameInput, isEditingUsername, user?.id, username, supabase]);

  // Real-time Password Validation
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

    // Run the new master validation
    const validation = validateUsername(newName);
    if (!validation.isValid) {
      setUsernameMessage({ type: "error", text: validation.error });
      return;
    }

    // Check if username is already taken by someone else
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", newName).single();

    if (existing && existing.id !== user?.id) {
      setUsernameMessage({ type: "error", text: "That username is already taken!" });
      return;
    }

    // Update the profiles table
    const { error } = await supabase.from("profiles").upsert({ id: user?.id, username: newName });

    if (error) {
      setUsernameMessage({ type: "error", text: "Failed to update username." });
    } else {
      setUsername(newName);
      // Broadcast the update to the Navbar
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
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
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

        {/* DYNAMIC CONTENT AREA */}
        <section className="flex-1">
          {activeTab === "account" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Username</label>
                    {isEditingUsername ? (
                      <div className="w-full">
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
                            profanityError || availability === "taken"
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-border-theme focus:border-brand-mint focus:ring-brand-mint"
                          }`}
                        />

                        {/* Live Validation Checklist */}
                        <div className="mt-3 flex flex-col gap-1 text-sm">
                          <div className={`flex items-center gap-2 ${isLengthValid ? "text-brand-mint" : "text-foreground/60"}`}>
                            <span className="text-base">{isLengthValid ? "✓" : "○"}</span>
                            <span>Between 3 and 20 characters</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isFormatValid ? "text-brand-mint" : "text-foreground/60"}`}>
                            <span className="text-base">{isFormatValid ? "✓" : "○"}</span>
                            <span>Letters, numbers, periods, and underscores only</span>
                          </div>
                        </div>

                        {/* Real-time Warnings */}
                        <div className="mt-2 h-5">
                          {profanityError && <p className="text-sm font-medium text-red-500">{profanityError}</p>}
                          {!profanityError && availability === "checking" && (
                            <p className="text-sm text-foreground/70">Checking availability...</p>
                          )}
                          {!profanityError && availability === "taken" && (
                            <p className="text-sm font-medium text-red-500">That username is already taken.</p>
                          )}
                          {!profanityError && availability === "available" && usernameInput !== username && (
                            <p className="text-sm font-medium text-brand-mint">Username is available!</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg font-medium text-foreground">{username}</p>
                    )}
                  </div>
                  <div>
                    {isEditingUsername ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateUsername}
                          disabled={!isLengthValid || !isFormatValid || !!profanityError || availability !== "available"}
                          className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-darkgreen disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingUsername(false);
                            setUsernameInput(username);
                          }}
                          className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt"
                      >
                        Change Username
                      </button>
                    )}
                  </div>
                </div>
                {usernameMessage.text && (
                  <p className={`mt-3 text-sm ${usernameMessage.type === "error" ? "text-red-600" : "text-brand-mint"}`}>
                    {usernameMessage.text}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Security</h2>
                {passwordFlow === "idle" ? (
                  <div>
                    <p className="text-sm text-foreground/70 mb-4">Update the password associated with your account.</p>
                    <button
                      onClick={handleStartPasswordChange}
                      className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt"
                    >
                      Change Password
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-sm">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full rounded-lg border border-border-theme px-3 py-2 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                      />

                      {/* Live Password Checklist */}
                      <div className="mt-3 flex flex-col gap-1 text-sm">
                        <div className={`flex items-center gap-2 ${passwordLengthValid ? "text-brand-mint" : "text-foreground/60"}`}>
                          <span className="text-base">{passwordLengthValid ? "✓" : "○"}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordUpperLowerValid ? "text-brand-mint" : "text-foreground/60"}`}>
                          <span className="text-base">{passwordUpperLowerValid ? "✓" : "○"}</span>
                          <span>Uppercase and lowercase letter</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${
                            passwordNumberSpecialValid ? "text-brand-mint" : "text-foreground/60"
                          }`}
                        >
                          <span className="text-base">{passwordNumberSpecialValid ? "✓" : "○"}</span>
                          <span>Number and special character</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
                          confirmPassword.length > 0 && !passwordsMatch
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-border-theme focus:border-brand-mint focus:ring-brand-mint"
                        }`}
                      />
                      <div className="mt-1 h-5">
                        {confirmPassword.length > 0 && (
                          <p className={`text-sm font-medium ${passwordsMatch ? "text-brand-mint" : "text-red-500"}`}>
                            {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={
                          !passwordLengthValid ||
                          !passwordUpperLowerValid ||
                          !passwordNumberSpecialValid ||
                          !passwordsMatch ||
                          isUpdatingPassword
                        }
                        className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-darkgreen disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordFlow("idle");
                          setNewPassword("");
                          setConfirmPassword("");
                          setPasswordMessage({ type: "", text: "" });
                        }}
                        className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                {passwordMessage.text && (
                  <p className={`mt-3 text-sm ${passwordMessage.type === "error" ? "text-red-600" : "text-brand-mint"}`}>
                    {passwordMessage.text}
                  </p>
                )}

                {/* Danger Zone Section */}
                <div className="mt-10 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-500">Danger Zone</h3>
                  <p className="mt-1 text-sm text-foreground/70">
                    Permanently delete your account and all of your data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => {
                      setIsDeletingAccount(true);
                      setConfirmText(""); // Reset text on open
                    }}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                </div>

                {/* Delete Account Modal */}
                {isDeletingAccount && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-default">
                    <div className="relative w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 text-left text-foreground shadow-xl">
                      <button 
                        onClick={() => setIsDeletingAccount(false)} 
                        className="absolute right-4 top-4 text-foreground/50 hover:text-foreground"
                      >
                        ✕
                      </button>
                      <h2 className="mb-2 text-xl font-bold text-red-600">Delete Account</h2>
                      <p className="mb-4 text-sm text-foreground/70">
                        Are you sure you want to completely delete your account? All your saved outfits, wardrobe items, and personal data will be permanently erased. This action cannot be undone.
                      </p>
                      
                      <div className="mb-6">
                        <label className="mb-1 block text-sm font-medium">Type <span className="font-bold">confirm</span> to proceed:</label>
                        <input 
                          type="text" 
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          className="w-full rounded-md border border-border-theme bg-background px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          placeholder="confirm"
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setIsDeletingAccount(false)} 
                          className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-alt"
                        >
                          Cancel
                        </button>
                        <button 
                          disabled={confirmText.toLowerCase() !== "confirm" || isProcessing}
                          onClick={async () => {
                            try {
                              setIsProcessing(true);
                              
                              // 1. Get the current user ID
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) throw new Error("No user found");

                              // 2. Wipe account using the secure backend action
                              await deleteUserAccountPermanently(user.id);
                              
                              // 3. Sign out the user locally
                              await supabase.auth.signOut();
                              
                              // 4. Reset theme to system default and redirect
                              setTheme("system");
                              router.push("/");
                              
                            } catch (error) {
                              console.error("Error deleting account:", error);
                              alert("Failed to delete account. Please contact support.");
                            } finally {
                              setIsProcessing(false);
                            }
                          }} 
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? "Deleting..." : "Permanently Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRIVACY & SAFETY TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-6">Privacy & Safety</h2>

                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Public Profile</h3>
                      <p className="mt-1 text-sm text-foreground/70">
                        Allow your saved outfits to appear on the Community Feed.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isPublicProfile}
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          setIsPublicProfile(checked);
                          await supabase.from("profiles").update({ is_public: checked }).eq("id", user?.id);
                        }}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
                    </label>
                  </div>

                  {/* Data Portability */}
                  <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Download My Data</h3>
                      <p className="mt-1 text-sm text-foreground/70">Get a copy of your wardrobe items and saved outfits.</p>
                    </div>
                    <button className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt transition-colors">
                      Request Data
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                    <p className="mt-1 mb-3 text-sm text-foreground/70">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-6">App Preferences</h2>

                <div className="space-y-6">
                  {/* Measurement System */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Measurement System</h3>
                      <p className="mt-1 text-sm text-foreground/70">Used for sizing and avatar adjustments.</p>
                    </div>
                    <select
                      value={measurementSystem}
                      onChange={(e) => setMeasurementSystem(e.target.value as "imperial" | "metric")}
                      className="w-full sm:w-auto rounded-lg border border-border-theme bg-surface px-3 py-2 text-sm text-foreground/70 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                    >
                      <option value="imperial">Imperial (in, lbs)</option>
                      <option value="metric">Metric (cm, kg)</option>
                    </select>
                  </div>

                  {/* Default View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Default Wardrobe View</h3>
                      <p className="mt-1 text-sm text-foreground/70">Choose which tab opens first in the sidebar.</p>
                    </div>
                    <select
                      value={defaultWardrobeView}
                      onChange={(e) => setDefaultWardrobeView(e.target.value as "owned" | "unowned" | "outfits")}
                      className="w-full sm:w-auto rounded-lg border border-border-theme bg-surface px-3 py-2 text-sm text-foreground/70 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                    >
                      <option value="owned">Owned Clothes</option>
                      <option value="unowned">Wishlist</option>
                      <option value="outfits">Saved Outfits</option>
                    </select>
                  </div>

                  {/* Camera Behavior */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Camera Permissions</h3>
                      <p className="mt-1 text-sm text-foreground/70">
                        Always ask before turning on the camera in the uploader.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={askBeforeCamera}
                        onChange={(e) => setAskBeforeCamera(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-6">Appearance</h2>

                <div className="space-y-6">
                  {/* Theme Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Theme</h3>
                      <p className="mt-1 text-sm text-foreground/70">Customize the visual style of F.AVA AI.</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border-theme bg-surface-alt p-1">
                      {(["light", "dark", "system"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={async () => {
                            setTheme(t);
                            if (user) {
                              await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
                            }
                          }}
                          className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all ${
                            mounted && theme === t
                              ? "bg-surface text-brand-forest shadow-sm ring-1 ring-border-theme"
                              : "text-foreground/70 hover:text-foreground hover:bg-surface-alt"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BETA TAB (UI ONLY) */}
          {activeTab === "beta" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-6">Beta</h2>

                <div className="space-y-6">
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Enable Beta Features</h3>
                      <p className="mt-1 text-sm text-foreground/70">
                        Turn on experimental features. These may change frequently.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={betaFeaturesEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setBetaFeaturesEnabled(enabled);
                          if (!enabled) {
                            setBetaFastAiGeneration(false);
                          }
                        }}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
                    </label>
                  </div>

                  {/* Models Section (disabled until master toggle enabled) */}
                  <div className={betaFeaturesEnabled ? "" : "pointer-events-none opacity-50"}>
                    <h3 className="text-sm font-semibold text-foreground">Avatar Generation Models</h3>
                    <p className="mt-1 text-sm text-foreground/70">
                      Choose which beta model paths are available for avatar generation.
                    </p>

                    <div className="mt-4 space-y-6 rounded-xl border border-border-theme bg-surface-alt/40 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">Fast AI Generation (API)</h4>
                          <p className="mt-1 text-sm text-foreground/70">
                            Faster generation using a hosted API endpoint.
                          </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={betaFastAiGeneration}
                            disabled={!betaFeaturesEnabled}
                            onChange={(e) => {
                              setBetaFastAiGeneration(e.target.checked);
                            }}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-surface-alt after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border-theme after:bg-surface after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK FOR UNFINISHED TABS */}
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
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-10">Loading settings...</main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

