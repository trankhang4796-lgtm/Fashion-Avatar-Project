"use server";

import { createClient } from "@supabase/supabase-js";

export async function deleteUserAccountPermanently(userId: string) {
  // Initialize the Admin client bypassing RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // The Admin API aggressively deletes the user and cascades to connected data
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Admin deletion failed:", error);
    throw new Error("Failed to delete user account.");
  }

  return { success: true };
}

