"use client";
import { createClient } from "@/src/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Refresh to update server components
    router.push("/"); // Redirect to home
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

