"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteUserAccountPermanently } from "@/src/app/actions/auth";

export type UsernameAvailability = "idle" | "checking" | "available" | "taken";

export type UsernameMessage = { type: string; text: string };

type ProfileTabProps = {
  supabase: SupabaseClient;
  router: { push: (href: string) => void };
  setTheme: (theme: string) => void;
  username: string;
  usernameInput: string;
  setUsernameInput: (v: string) => void;
  isEditingUsername: boolean;
  setIsEditingUsername: (v: boolean) => void;
  isLengthValid: boolean;
  isFormatValid: boolean;
  profanityError: string;
  availability: UsernameAvailability;
  usernameMessage: UsernameMessage;
  handleUpdateUsername: () => Promise<void>;
  isDeletingAccount: boolean;
  setIsDeletingAccount: (v: boolean) => void;
  confirmText: string;
  setConfirmText: (v: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
};

export default function ProfileTab({
  supabase,
  router,
  setTheme,
  username,
  usernameInput,
  setUsernameInput,
  isEditingUsername,
  setIsEditingUsername,
  isLengthValid,
  isFormatValid,
  profanityError,
  availability,
  usernameMessage,
  handleUpdateUsername,
  isDeletingAccount,
  setIsDeletingAccount,
  confirmText,
  setConfirmText,
  isProcessing,
  setIsProcessing,
}: ProfileTabProps) {
  return (
    <div className="space-y-8">
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
                  onClick={() => void handleUpdateUsername()}
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
        <h2 className="text-xl font-semibold text-foreground mb-4">Danger Zone</h2>
        <p className="text-sm text-foreground/70 mb-4">
          Permanently delete your account and all of your data. This action cannot be undone.
        </p>
        <button
          onClick={() => {
            setIsDeletingAccount(true);
            setConfirmText("");
          }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Delete Account
        </button>

        {isDeletingAccount && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-default">
            <div className="relative w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 text-left text-foreground shadow-xl">
              <button
                onClick={() => setIsDeletingAccount(false)}
                className="absolute right-4 top-4 text-foreground/50 hover:text-foreground"
                type="button"
              >
                ✕
              </button>
              <h2 className="mb-2 text-xl font-bold text-red-600">Delete Account</h2>
              <p className="mb-4 text-sm text-foreground/70">
                Are you sure you want to completely delete your account? All your saved outfits, wardrobe items, and
                personal data will be permanently erased. This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="mb-1 block text-sm font-medium">
                  Type <span className="font-bold">confirm</span> to proceed:
                </label>
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
                  type="button"
                >
                  Cancel
                </button>
                <button
                  disabled={confirmText.toLowerCase() !== "confirm" || isProcessing}
                  onClick={async () => {
                    try {
                      setIsProcessing(true);

                      const {
                        data: { user: authUser },
                      } = await supabase.auth.getUser();
                      if (!authUser) throw new Error("No user found");

                      await deleteUserAccountPermanently(authUser.id);

                      await supabase.auth.signOut();

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
                  type="button"
                >
                  {isProcessing ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
