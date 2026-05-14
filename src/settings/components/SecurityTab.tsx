"use client";

export type PasswordFlow = "idle" | "editing";

export type PasswordMessage = { type: string; text: string };

type SecurityTabProps = {
  passwordFlow: PasswordFlow;
  setPasswordFlow: (value: PasswordFlow) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordMessage: PasswordMessage;
  setPasswordMessage: (v: PasswordMessage) => void;
  isUpdatingPassword: boolean;
  passwordLengthValid: boolean;
  passwordUpperLowerValid: boolean;
  passwordNumberSpecialValid: boolean;
  passwordsMatch: boolean;
  handleStartPasswordChange: () => void;
  handleUpdatePassword: (e: React.FormEvent) => Promise<void>;
};

export default function SecurityTab({
  passwordFlow,
  setPasswordFlow,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordMessage,
  setPasswordMessage,
  isUpdatingPassword,
  passwordLengthValid,
  passwordUpperLowerValid,
  passwordNumberSpecialValid,
  passwordsMatch,
  handleStartPasswordChange,
  handleUpdatePassword,
}: SecurityTabProps) {
  return (
    <div>
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4">Security</h2>
        {passwordFlow === "idle" ? (
          <div>
            <p className="text-sm text-foreground/70 mb-4">Update the password associated with your account.</p>
            <button
              onClick={handleStartPasswordChange}
              className="rounded-lg border border-border-theme px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-alt"
              type="button"
            >
              Change Password
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleUpdatePassword(e)} className="space-y-5 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border-theme px-3 py-2 focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint"
              />

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
      </div>
    </div>
  );
}

