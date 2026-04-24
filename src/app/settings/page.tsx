"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { containsProfanity } from "@/src/utils/profanity";
import type { User } from "@supabase/supabase-js";

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Username State
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameMessage, setUsernameMessage] = useState({ type: "", text: "" });

  // Password State
  const [passwordFlow, setPasswordFlow] = useState<"idle" | "editing">("idle");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Fetch from the new profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();

        if (profile?.username) {
          setUsername(profile.username);
          setUsernameInput(profile.username);
        } else {
          const randomName = `User_${Math.floor(Math.random() * 10000)}`;
          setUsername(randomName);
          setUsernameInput(randomName);

          // Save to profiles table
          await supabase.from("profiles").upsert({
            id: session.user.id,
            username: randomName,
          });
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleUpdateUsername = async () => {
    setUsernameMessage({ type: "", text: "" });

    const newName = usernameInput.trim();

    if (!newName) {
      setUsernameMessage({ type: "error", text: "Username cannot be empty." });
      return;
    }
    if (containsProfanity(newName)) {
      setUsernameMessage({ type: "error", text: "This username is not allowed." });
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
      setIsEditingUsername(false);
      setUsernameMessage({ type: "success", text: "Username updated successfully!" });
    }
  };

  const handleStartPasswordChange = () => {
    const confirmChange = window.confirm("Are you sure you want to change your password?");
    if (confirmChange) {
      setPasswordFlow("editing");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
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

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-10">Loading...</main>;
  if (!user) return <main className="mx-auto max-w-3xl px-6 py-10">Please log in to view settings.</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Account Settings</h1>

      <div className="space-y-8">
        {/* USERNAME SECTION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Profile</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-500 mb-1">Username</label>
              {isEditingUsername ? (
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                />
              ) : (
                <p className="text-lg font-medium text-slate-900">{username}</p>
              )}
            </div>

            <div>
              {isEditingUsername ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateUsername}
                    className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-darkgreen"
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
            <p
              className={`mt-3 text-sm ${
                usernameMessage.type === "error" ? "text-red-600" : "text-brand-mint"
              }`}
            >
              {usernameMessage.text}
            </p>
          )}
        </section>

        {/* PASSWORD SECTION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Security</h2>

          {passwordFlow === "idle" ? (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Update the password associated with your account.
              </p>
              <button
                onClick={handleStartPasswordChange}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-darkgreen disabled:opacity-50"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordFlow("idle")}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {passwordMessage.text && (
            <p
              className={`mt-3 text-sm ${
                passwordMessage.type === "error" ? "text-red-600" : "text-brand-mint"
              }`}
            >
              {passwordMessage.text}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

