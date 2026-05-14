"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

type AppearanceTabProps = {
  supabase: SupabaseClient;
  user: User;
  theme: string | undefined;
  mounted: boolean;
  setTheme: (theme: string) => void;
};

export default function AppearanceTab({ supabase, user, theme, mounted, setTheme }: AppearanceTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-6">Appearance</h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">Theme</h3>
              <p className="mt-1 text-sm text-foreground/70">Customize the visual style of F.AVA AI.</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border-theme bg-surface-alt p-1">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={async () => {
                    setTheme(t);
                    await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
                  }}
                  className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all ${
                    mounted && theme === t
                      ? "bg-surface text-brand-forest shadow-sm ring-1 ring-border-theme"
                      : "text-foreground/70 hover:text-foreground hover:bg-surface-alt"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
