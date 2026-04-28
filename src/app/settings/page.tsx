"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { validateUsername, RESTRICTED_WORDS } from "@/src/utils/validation";
import type { User } from "@supabase/supabase-js";

type SettingsTab = "account" | "privacy" | "appearance" | "notifications" | "preferences";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

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
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-brand-mint text-white" : "text-slate-600 hover:bg-slate-100"
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Profile</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-500 mb-1">Username</label>
                    {isEditingUsername ? (
                      <div className="w-full">
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
                            profanityError || availability === "taken"
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-slate-300 focus:border-brand-mint focus:ring-brand-mint"
                          }`}
                        />

                        {/* Live Validation Checklist */}
                        <div className="mt-3 flex flex-col gap-1 text-sm">
                          <div className={`flex items-center gap-2 ${isLengthValid ? "text-brand-mint" : "text-slate-400"}`}>
                            <span className="text-base">{isLengthValid ? "✓" : "○"}</span>
                            <span>Between 3 and 20 characters</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isFormatValid ? "text-brand-mint" : "text-slate-400"}`}>
                            <span className="text-base">{isFormatValid ? "✓" : "○"}</span>
                            <span>Letters, numbers, periods, and underscores only</span>
                          </div>
                        </div>

                        {/* Real-time Warnings */}
                        <div className="mt-2 h-5">
                          {profanityError && <p className="text-sm font-medium text-red-500">{profanityError}</p>}
                          {!profanityError && availability === "checking" && (
                            <p className="text-sm text-slate-500">Checking availability...</p>
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
                      <p className="text-lg font-medium text-slate-900">{username}</p>
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
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
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

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Security</h2>
                {passwordFlow === "idle" ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-4">Update the password associated with your account.</p>
                    <button
                      onClick={handleStartPasswordChange}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Change Password
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-sm">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                      />

                      {/* Live Password Checklist */}
                      <div className="mt-3 flex flex-col gap-1 text-sm">
                        <div className={`flex items-center gap-2 ${passwordLengthValid ? "text-brand-mint" : "text-slate-400"}`}>
                          <span className="text-base">{passwordLengthValid ? "✓" : "○"}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordUpperLowerValid ? "text-brand-mint" : "text-slate-400"}`}>
                          <span className="text-base">{passwordUpperLowerValid ? "✓" : "○"}</span>
                          <span>Uppercase and lowercase letter</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${
                            passwordNumberSpecialValid ? "text-brand-mint" : "text-slate-400"
                          }`}
                        >
                          <span className="text-base">{passwordNumberSpecialValid ? "✓" : "○"}</span>
                          <span>Number and special character</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
                          confirmPassword.length > 0 && !passwordsMatch
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-slate-300 focus:border-brand-mint focus:ring-brand-mint"
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
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
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
              </div>
            </div>
          )}

          {/* PRIVACY & SAFETY TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Privacy & Safety</h2>

                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Public Profile</h3>
                      <p className="mt-1 text-sm text-slate-500">
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
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
                    </label>
                  </div>

                  {/* Data Portability */}
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Download My Data</h3>
                      <p className="mt-1 text-sm text-slate-500">Get a copy of your wardrobe items and saved outfits.</p>
                    </div>
                    <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Request Data
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                    <p className="mt-1 mb-3 text-sm text-slate-500">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">App Preferences</h2>

                <div className="space-y-6">
                  {/* Measurement System */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Measurement System</h3>
                      <p className="mt-1 text-sm text-slate-500">Used for sizing and avatar adjustments.</p>
                    </div>
                    <select
                      value={measurementSystem}
                      onChange={(e) => setMeasurementSystem(e.target.value as any)}
                      className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                    >
                      <option value="imperial">Imperial (in, lbs)</option>
                      <option value="metric">Metric (cm, kg)</option>
                    </select>
                  </div>

                  {/* Default View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Default Wardrobe View</h3>
                      <p className="mt-1 text-sm text-slate-500">Choose which tab opens first in the sidebar.</p>
                    </div>
                    <select
                      value={defaultWardrobeView}
                      onChange={(e) => setDefaultWardrobeView(e.target.value as any)}
                      className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                    >
                      <option value="owned">Owned Clothes</option>
                      <option value="unowned">Wishlist</option>
                      <option value="outfits">Saved Outfits</option>
                    </select>
                  </div>

                  {/* Camera Behavior */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Camera Permissions</h3>
                      <p className="mt-1 text-sm text-slate-500">
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
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-mint peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-mint/50"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK FOR UNFINISHED TABS */}
          {(activeTab === "appearance" || activeTab === "notifications") && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="text-4xl mb-4 block">{tabs.find((t) => t.id === activeTab)?.icon}</span>
              <h2 className="text-xl font-semibold text-slate-800 capitalize">{activeTab} Settings</h2>
              <p className="mt-2 text-slate-500">This section is currently under construction.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

