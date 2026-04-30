"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { validateUsername, RESTRICTED_WORDS } from "@/src/utils/validation";

interface UsernameSetupModalProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function UsernameSetupModal({ onComplete, onCancel }: UsernameSetupModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameMessage, setUsernameMessage] = useState({ type: "", text: "" });

  const [isLengthValid, setIsLengthValid] = useState(false);
  const [isFormatValid, setIsFormatValid] = useState(false);
  const [profanityError, setProfanityError] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
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
    setProfanityError(isProfane ? "This username contains restricted words." : "");

    setAvailability("idle");

    if (trimmed.length < 3 || isProfane || !validFormatRegex.test(trimmed) || !hasGoodPunctuation) {
      return;
    }

    setAvailability("checking");

    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("username", trimmed).single();
      if (data && data.id !== user?.id) {
        setAvailability("taken");
      } else {
        setAvailability("available");
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [usernameInput, user?.id, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setUsernameMessage({ type: "", text: "" });

    const newName = usernameInput.trim();
    const validation = validateUsername(newName);
    if (!validation.isValid) {
      setUsernameMessage({ type: "error", text: validation.error });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, username: newName });
    setIsSaving(false);

    if (error) {
      setUsernameMessage({ type: "error", text: "Failed to save profile. Try again." });
    } else {
      window.dispatchEvent(new Event("profile-updated"));
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 cursor-default">
      <div className="relative w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-xl text-foreground text-left">
        <button onClick={onCancel} className="absolute right-4 top-4 text-foreground/50 hover:text-foreground">✕</button>
        <h2 className="text-xl font-bold mb-2">Create Your Username</h2>
        <p className="text-sm text-foreground/70 mb-6">Before you can save items to the cloud, you need to set up your public username!</p>

        <div className="mb-6 w-full">
          <label className="block text-sm font-medium text-foreground/70 mb-1">Username</label>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="e.g. fashion_guru"
            className={`w-full rounded-lg border px-3 py-2 bg-background focus:outline-none focus:ring-1 ${
              profanityError || availability === "taken"
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-border-theme focus:border-brand-mint focus:ring-brand-mint"
            }`}
          />

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

          <div className="mt-2 h-5">
            {profanityError && <p className="text-sm font-medium text-red-500">{profanityError}</p>}
            {!profanityError && availability === "checking" && <p className="text-sm text-foreground/70">Checking availability...</p>}
            {!profanityError && availability === "taken" && <p className="text-sm font-medium text-red-500">Username is taken.</p>}
            {!profanityError && availability === "available" && <p className="text-sm font-medium text-brand-mint">Username is available!</p>}
          </div>
        </div>

        {usernameMessage.text && (
          <p className={`mb-4 text-sm ${usernameMessage.type === "error" ? "text-red-600" : "text-brand-mint"}`}>
            {usernameMessage.text}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-theme text-sm font-medium hover:bg-surface-alt transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isLengthValid || !isFormatValid || !!profanityError || availability !== "available" || isSaving}
            className="px-4 py-2 rounded-lg bg-brand-forest text-white text-sm font-medium hover:bg-brand-darkgreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

