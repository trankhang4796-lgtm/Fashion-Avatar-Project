"use client";
import { createClient } from "@/src/utils/supabase/client";

export default function SignOutButton() {
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Forcefully clear browser state and return to landing page
      window.location.href = "/";
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 transition-colors"
    >
      Sign Out
    </button>
  );
}

