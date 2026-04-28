"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { validateUsername, RESTRICTED_WORDS } from "@/src/utils/validation";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function ProfileTab({
  user,
  supabase,
  initialUsername,
}: {
  user: User;
  supabase: SupabaseClient;
  initialUsername: string;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [usernameMessage, setUsernameMessage] = useState({ type: "", text: "" });
  const [isLengthValid, setIsLengthValid] = useState(false);
  const [isFormatValid, setIsFormatValid] = useState(false);
  const [profanityError, setProfanityError] = useState("");
  const [availability, setAvailability] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  useEffect(() => {
    setUsername(initialUsername);
    setUsernameInput(initialUsername);
  }, [initialUsername]);

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
    const isProfane = RESTRICTED_WORDS.some((word) =>
      normalized.includes(word),
    );
    setProfanityError(
      isProfane ? "This username contains restricted words." : "",
    );

    // 2. Debounced Asynchronous Check (Availability)
    setAvailability("idle");

    if (
      trimmed.length < 3 ||
      isProfane ||
      !validFormatRegex.test(trimmed) ||
      !hasGoodPunctuation
    ) {
      return; // Stop checking availability if basic rules fail
    }

    if (trimmed === username) {
      setAvailability("available"); // It is their current name
      return;
    }

    setAvailability("checking");

    // Wait 500ms after the user stops typing before hitting the database
    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .single();

      if (data && data.id !== user.id) {
        setAvailability("taken");
      } else {
        setAvailability("available");
      }
    }, 500);

    // Cleanup function cancels the previous timeout if they keep typing
    return () => window.clearTimeout(timeoutId);
  }, [usernameInput, isEditingUsername, user.id, username, supabase]);

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
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", newName)
      .single();

    if (existing && existing.id !== user.id) {
      setUsernameMessage({
        type: "error",
        text: "That username is already taken!",
      });
      return;
    }

    // Update the profiles table
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username: newName });

    if (error) {
      setUsernameMessage({ type: "error", text: "Failed to update username." });
      return;
    }

    setUsername(newName);
    window.dispatchEvent(new Event("profile-updated"));
    setIsEditingUsername(false);
    setUsernameMessage({
      type: "success",
      text: "Username updated successfully!",
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Profile</h2>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-500 mb-1">
            Username
          </label>
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

              <div className="mt-3 flex flex-col gap-1 text-sm">
                <div
                  className={`flex items-center gap-2 ${
                    isLengthValid ? "text-brand-mint" : "text-slate-400"
                  }`}
                >
                  <span className="text-base">{isLengthValid ? "✓" : "○"}</span>
                  <span>Between 3 and 20 characters</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    isFormatValid ? "text-brand-mint" : "text-slate-400"
                  }`}
                >
                  <span className="text-base">{isFormatValid ? "✓" : "○"}</span>
                  <span>Letters, numbers, periods, and underscores only</span>
                </div>
              </div>

              <div className="mt-2 h-5">
                {profanityError ? (
                  <p className="text-sm font-medium text-red-500">
                    {profanityError}
                  </p>
                ) : availability === "checking" ? (
                  <p className="text-sm text-slate-500">
                    Checking availability...
                  </p>
                ) : availability === "taken" ? (
                  <p className="text-sm font-medium text-red-500">
                    That username is already taken.
                  </p>
                ) : availability === "available" && usernameInput !== username ? (
                  <p className="text-sm font-medium text-brand-mint">
                    Username is available!
                  </p>
                ) : null}
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
                disabled={
                  !isLengthValid ||
                  !isFormatValid ||
                  !!profanityError ||
                  availability !== "available"
                }
                className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-darkgreen disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingUsername(false);
                  setUsernameInput(username);
                  setUsernameMessage({ type: "", text: "" });
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
      {usernameMessage.text ? (
        <p
          className={`mt-3 text-sm ${
            usernameMessage.type === "error"
              ? "text-red-600"
              : "text-brand-mint"
          }`}
        >
          {usernameMessage.text}
        </p>
      ) : null}
    </div>
  );
}

