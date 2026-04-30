"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { deleteUserAccountPermanently } from "@/src/app/actions/auth";

export default function SecurityTab({
  supabase,
}: {
  supabase: SupabaseClient;
}) {
  const [passwordFlow, setPasswordFlow] = useState<"idle" | "editing">("idle");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordLengthValid, setPasswordLengthValid] = useState(false);
  const [passwordUpperLowerValid, setPasswordUpperLowerValid] = useState(false);
  const [passwordNumberSpecialValid, setPasswordNumberSpecialValid] =
    useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (passwordFlow !== "editing") return;

    setPasswordLengthValid(newPassword.length >= 8);
    setPasswordUpperLowerValid(
      /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    );
    setPasswordNumberSpecialValid(
      /\d/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword),
    );
    setPasswordsMatch(newPassword.length > 0 && newPassword === confirmPassword);
  }, [newPassword, confirmPassword, passwordFlow]);

  const handleStartPasswordChange = () => {
    if (window.confirm("Are you sure you want to change your password?")) {
      setPasswordFlow("editing");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    if (!(/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword))) {
      setPasswordMessage({
        type: "error",
        text: "Password must include both uppercase and lowercase letters.",
      });
      return;
    }
    if (!(/\d/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword))) {
      setPasswordMessage({
        type: "error",
        text: "Password must include a number and a special character.",
      });
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
      return;
    }

    setPasswordMessage({
      type: "success",
      text: "Password updated successfully!",
    });
    setPasswordFlow("idle");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
        <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-sm">
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

            <div className="mt-3 flex flex-col gap-1 text-sm">
              <div
                className={`flex items-center gap-2 ${
                  passwordLengthValid ? "text-brand-mint" : "text-slate-400"
                }`}
              >
                <span className="text-base">
                  {passwordLengthValid ? "✓" : "○"}
                </span>
                <span>At least 8 characters</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  passwordUpperLowerValid ? "text-brand-mint" : "text-slate-400"
                }`}
              >
                <span className="text-base">
                  {passwordUpperLowerValid ? "✓" : "○"}
                </span>
                <span>Uppercase and lowercase letter</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  passwordNumberSpecialValid
                    ? "text-brand-mint"
                    : "text-slate-400"
                }`}
              >
                <span className="text-base">
                  {passwordNumberSpecialValid ? "✓" : "○"}
                </span>
                <span>Number and special character</span>
              </div>
            </div>
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
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
                confirmPassword.length > 0 && !passwordsMatch
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-300 focus:border-brand-mint focus:ring-brand-mint"
              }`}
            />
            <div className="mt-1 h-5">
              {confirmPassword.length > 0 ? (
                <p
                  className={`text-sm font-medium ${
                    passwordsMatch ? "text-brand-mint" : "text-red-500"
                  }`}
                >
                  {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
                </p>
              ) : null}
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
      {passwordMessage.text ? (
        <p
          className={`mt-3 text-sm ${
            passwordMessage.type === "error"
              ? "text-red-600"
              : "text-brand-mint"
          }`}
        >
          {passwordMessage.text}
        </p>
      ) : null}

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
                    
                    // 4. Prevent ghost items and reset theme manually
                    window.localStorage.removeItem("fashion-avatar-wardrobe-guest");
                    window.localStorage.removeItem("theme");
                    
                    // 5. Force a hard reload to prevent Next.js script errors
                    window.location.href = "/";
                    
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
  );
}

